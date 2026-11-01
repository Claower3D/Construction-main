"""
QazGost AI — LiDAR Point Cloud Processor

Обрабатывает данные с LiDAR-сканера (iPhone Pro, iPad Pro, Leica BLK360):
  - Загрузка .las / .laz / .ply / .e57 файлов
  - Расчёт площади поверхностей (стены, пол, потолок)
  - Расчёт объёмов (помещения, траншеи, котлованы)
  - Детекция отклонений от вертикали/горизонтали
  - Экспорт в mesh для 3D визуализации

Зависимости:
  pip install open3d laspy[lazrs] numpy
"""

import threading
import math
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
import numpy as np
from loguru import logger

try:
    import open3d as o3d
    O3D_AVAILABLE = True
except ImportError:
    O3D_AVAILABLE = False
    logger.warning("[LiDAR] open3d not installed — install: pip install open3d")

try:
    import laspy
    LASPY_AVAILABLE = True
except ImportError:
    LASPY_AVAILABLE = False
    logger.info("[LiDAR] laspy not installed — .las/.laz files won't be supported")


MIN_POINTS = 100
# RANSAC/статистика отклонений считаются по случайной подвыборке: на 2.4M точек полный RANSAC
# занимает ~14 с и держит GIL (open3d), блокируя остальные запросы. 200k точек хватает для плоскости.
MAX_FIT_POINTS = 200_000


class PointCloudError(ValueError):
    """Invalid / empty / unreadable point cloud (→ HTTP 400)."""


class LiDARProcessor:
    """
    QazGost AI LiDAR point cloud processor.

    Supports:
      - Point cloud loading (.las, .laz, .ply, .pcd, .xyz)
      - Surface area calculation (floor, walls, ceiling)
      - Volume calculation (rooms, excavations)
      - Deviation analysis (plumb, level)
      - Mesh generation for 3D viewer
    """

    _instance = None
    _lock = threading.Lock()

    @classmethod
    def get(cls) -> "LiDARProcessor":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.available = O3D_AVAILABLE

    # ─────────────────────────────────────────────
    # Loading
    # ─────────────────────────────────────────────

    def load_point_cloud(self, file_path: str, strict: bool = False) -> Optional[Any]:
        """
        Load point cloud from file.
        Supports: .las, .laz, .ply, .pcd, .xyz
        Non-finite points (NaN/Inf) are dropped.

        Returns: open3d.geometry.PointCloud, or None on error (strict=False).
        strict=True raises PointCloudError with a human-readable reason instead.
        """
        if not self.available:
            logger.error("[LiDAR] open3d not available")
            if strict:
                raise PointCloudError("LiDAR module not available")
            return None

        path = Path(file_path)
        suffix = path.suffix.lower()

        try:
            if path.stat().st_size == 0:
                raise PointCloudError("Файл облака точек пустой")
            if suffix in (".las", ".laz"):
                pcd = self._load_las(path)
            elif suffix in (".ply", ".pcd", ".xyz"):
                pcd = o3d.io.read_point_cloud(str(path))
            else:
                raise PointCloudError(f"Неподдерживаемый формат: {suffix}")
            if pcd is None:
                raise PointCloudError("Не удалось прочитать облако точек")

            pts = np.asarray(pcd.points)
            finite = np.isfinite(pts).all(axis=1) if len(pts) else np.zeros(0, dtype=bool)
            if len(pts) and not finite.all():
                dropped = int((~finite).sum())
                pcd = pcd.select_by_index(np.where(finite)[0].tolist())
                logger.warning(f"[LiDAR] Dropped {dropped} non-finite points")
            n_points = len(pcd.points)
            if n_points < MIN_POINTS:
                raise PointCloudError(
                    f"Слишком мало корректных точек: {n_points} (нужно минимум {MIN_POINTS}). "
                    "Файл пустой, повреждён или не является облаком точек."
                )
            logger.info(f"[LiDAR] Loaded {n_points:,} points from {path.name}")
            return pcd
        except PointCloudError as e:
            logger.warning(f"[LiDAR] {e}")
            if strict:
                raise
            return None
        except Exception as e:
            logger.error(f"[LiDAR] Load error: {e}")
            if strict:
                raise PointCloudError(f"Не удалось прочитать облако точек: {type(e).__name__}")
            return None

    def _load_las(self, path: Path) -> Optional[Any]:
        """Load .las/.laz via laspy → open3d."""
        if not LASPY_AVAILABLE:
            logger.error("[LiDAR] laspy not installed for .las/.laz support")
            return None

        las = laspy.read(str(path))
        points = np.vstack((las.x, las.y, las.z)).T

        pcd = o3d.geometry.PointCloud()
        pcd.points = o3d.utility.Vector3dVector(points)

        # Colors if available
        if hasattr(las, "red") and hasattr(las, "green") and hasattr(las, "blue"):
            colors = np.vstack((las.red, las.green, las.blue)).T
            colors = colors / 65535.0  # Normalize to [0, 1]
            pcd.colors = o3d.utility.Vector3dVector(colors)

        logger.info(f"[LiDAR] Loaded {len(points):,} points from {path.name}")
        return pcd

    # ─────────────────────────────────────────────
    # Measurements
    # ─────────────────────────────────────────────

    def calculate_room_dimensions(self, pcd) -> Dict[str, Any]:
        """
        Calculate room dimensions from point cloud.

        Returns:
            {
                "length_m": float,
                "width_m": float,
                "height_m": float,
                "floor_area_m2": float,
                "wall_area_m2": float,
                "ceiling_area_m2": float,
                "volume_m3": float,
                "perimeter_m": float,
                "n_points": int
            }
        """
        if pcd is None:
            return self._empty_result()

        points = np.asarray(pcd.points)
        n_points = len(points)

        if n_points < 100:
            logger.warning(f"[LiDAR] Too few points: {n_points}")
            return self._empty_result()

        # Bounding box
        bbox = pcd.get_axis_aligned_bounding_box()
        min_b = bbox.min_bound
        max_b = bbox.max_bound

        length = max_b[0] - min_b[0]
        width = max_b[1] - min_b[1]
        height = max_b[2] - min_b[2]

        # Sort so length >= width
        if width > length:
            length, width = width, length

        floor_area = length * width
        ceiling_area = floor_area
        wall_area = 2 * (length + width) * height
        perimeter = 2 * (length + width)
        volume = length * width * height

        result = {
            "length_m": round(length, 3),
            "width_m": round(width, 3),
            "height_m": round(height, 3),
            "floor_area_m2": round(floor_area, 2),
            "wall_area_m2": round(wall_area, 2),
            "ceiling_area_m2": round(ceiling_area, 2),
            "volume_m3": round(volume, 2),
            "perimeter_m": round(perimeter, 2),
            "n_points": n_points,
        }

        logger.info(f"[LiDAR] Room: {length:.2f}×{width:.2f}×{height:.2f}m = {volume:.1f}m³")
        return result

    def calculate_excavation_volume(self, pcd, ground_level: Optional[float] = None) -> Dict[str, Any]:
        """
        Calculate excavation volume (trench, pit, foundation).

        Args:
            pcd: Point cloud of excavation
            ground_level: Z coordinate of ground surface (auto-detect if None)

        Returns:
            {
                "volume_m3": float,
                "area_m2": float,
                "max_depth_m": float,
                "avg_depth_m": float
            }
        """
        if pcd is None:
            return {"volume_m3": 0, "area_m2": 0, "max_depth_m": 0, "avg_depth_m": 0}

        points = np.asarray(pcd.points)
        z_values = points[:, 2]

        if ground_level is None:
            # Auto-detect: ground level = top 5% of Z values
            ground_level = np.percentile(z_values, 95)

        # Points below ground
        below_mask = z_values < ground_level
        below_points = points[below_mask]

        if len(below_points) < 10:
            return {"volume_m3": 0, "area_m2": 0, "max_depth_m": 0, "avg_depth_m": 0}

        depths = ground_level - below_points[:, 2]
        max_depth = float(np.max(depths))
        avg_depth = float(np.mean(depths))

        # Surface area estimate via alpha shape projection
        xy_points = below_points[:, :2]
        x_range = np.max(xy_points[:, 0]) - np.min(xy_points[:, 0])
        y_range = np.max(xy_points[:, 1]) - np.min(xy_points[:, 1])
        area = x_range * y_range  # Rough bounding box area

        volume = area * avg_depth

        result = {
            "volume_m3": round(volume, 2),
            "area_m2": round(area, 2),
            "max_depth_m": round(max_depth, 3),
            "avg_depth_m": round(avg_depth, 3),
        }

        logger.info(f"[LiDAR] Excavation: {area:.1f}m² × {avg_depth:.2f}m = {volume:.1f}m³")
        return result

    @staticmethod
    def _sample(pcd, max_points: int = MAX_FIT_POINTS):
        n = len(pcd.points)
        if n <= max_points:
            return pcd
        return pcd.random_down_sample(max_points / n)

    def dominant_plane(self, pcd, distance_threshold: float = 0.02) -> Dict[str, Any]:
        """
        RANSAC fit of the dominant plane (floor / wall) on a random subsample (<= MAX_FIT_POINTS).
        Returns plane (a,b,c,d) with unit normal, inlier ratio, normal z-component.
        """
        pcd = self._sample(pcd)
        plane, inliers = pcd.segment_plane(
            distance_threshold=distance_threshold, ransac_n=3, num_iterations=1000,
        )
        a, b, c, d = plane
        n = float(np.linalg.norm([a, b, c])) or 1.0
        return {
            "plane": (a / n, b / n, c / n, d / n),
            "inliers": inliers,
            "inlier_ratio": len(inliers) / max(1, len(pcd.points)),
            "nz": abs(c / n),
        }

    def check_deviations(self, pcd, band_m: float = 0.05) -> Dict[str, Any]:
        """
        Flatness of the dominant surface (RANSAC plane), per SNiP tolerances.

        Раньше одна «плоскость» подгонялась под всё облако (пол + стены + потолок) и идеальная
        комната давала отклонения в метры. Теперь: RANSAC находит доминирующую плоскость, и
        отклонения считаются только для точек этой поверхности (в полосе ±band_m от плоскости).
        Качество оценивается по 95-му перцентилю (устойчиво к выбросам), max — справочно.
        """
        if pcd is None or len(pcd.points) < 3:
            return {"surface_type": "N/A", "max_deviation_mm": 0, "avg_deviation_mm": 0, "quality": "N/A"}

        sample = self._sample(pcd)
        points = np.asarray(sample.points)
        fit = self.dominant_plane(sample)
        a, b, c, d = fit["plane"]
        dist = points @ np.array([a, b, c]) + d
        surface = np.abs(dist) <= band_m
        dev_mm = np.abs(dist[surface]) * 1000.0

        max_dev = float(np.max(dev_mm)) if dev_mm.size else 0.0
        avg_dev = float(np.mean(dev_mm)) if dev_mm.size else 0.0
        p95_dev = float(np.percentile(dev_mm, 95)) if dev_mm.size else 0.0
        surface_type = "horizontal" if fit["nz"] > 0.9 else ("vertical" if fit["nz"] < 0.1 else "inclined")

        # Quality per СНиП 3.04.01-87 (штукатурка: до 3 мм на 1 м) — по p95
        if p95_dev <= 3:
            quality = "✅ Отлично (< 3мм — СНиП 3.04.01-87)"
        elif p95_dev <= 5:
            quality = "⚠️ Допустимо (3-5мм)"
        elif p95_dev <= 10:
            quality = "❌ Требует исправления (5-10мм)"
        else:
            quality = "🚨 Критическое отклонение (> 10мм)"

        return {
            "surface_type": surface_type,
            "method": "ransac_dominant_plane",
            "points_used": int(len(points)),
            "surface_points": int(surface.sum()),
            "surface_share": round(float(surface.mean()), 3),
            "max_deviation_mm": round(max_dev, 1),
            "avg_deviation_mm": round(avg_dev, 1),
            "p95_deviation_mm": round(p95_dev, 1),
            "quality": quality,
            "snip_norm": "СНиП 3.04.01-87",
            "max_allowed_mm": 3.0,
        }

    # ─────────────────────────────────────────────
    # Mesh export
    # ─────────────────────────────────────────────

    def generate_mesh(self, pcd, output_path: str) -> bool:
        """
        Generate triangle mesh from point cloud for 3D visualization.
        Exports as .ply file.
        """
        if pcd is None or not self.available:
            return False

        try:
            # Estimate normals
            pcd.estimate_normals()
            pcd.orient_normals_consistent_tangent_plane(k=15)

            # Poisson reconstruction
            mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
                pcd, depth=8, width=0, scale=1.1
            )

            # Remove low-density vertices (noise)
            densities = np.asarray(densities)
            density_threshold = np.quantile(densities, 0.05)
            vertices_to_remove = densities < density_threshold
            mesh.remove_vertices_by_mask(vertices_to_remove)

            # Save
            o3d.io.write_triangle_mesh(output_path, mesh)
            n_triangles = len(mesh.triangles)
            logger.info(f"[LiDAR] Mesh saved: {output_path} ({n_triangles:,} triangles)")
            return True

        except Exception as e:
            logger.error(f"[LiDAR] Mesh generation failed: {e}")
            return False

    # ─────────────────────────────────────────────
    # Full scan analysis
    # ─────────────────────────────────────────────

    def analyze_scan(self, file_path: str) -> Dict[str, Any]:
        """
        Full analysis of a LiDAR scan file.

        Scan type:
          room       — высота > 1.5 м;
          surface    — почти всё облако лежит в одной горизонтальной плоскости (пол, плита);
          excavation — есть заметная часть точек ниже доминирующей горизонтальной плоскости (грунт).
        Raises PointCloudError for empty / invalid files.
        """
        pcd = self.load_point_cloud(file_path, strict=True)

        points = np.asarray(pcd.points)
        bbox = pcd.get_axis_aligned_bounding_box()
        height = bbox.max_bound[2] - bbox.min_bound[2]

        if height > 1.5:
            dimensions = self.calculate_room_dimensions(pcd)
            scan_type = "room"
        else:
            fit = self.dominant_plane(pcd, distance_threshold=0.03)
            a, b, c, d = fit["plane"]
            horizontal = fit["nz"] > 0.9
            ground_z = None
            below_share = 0.0
            if horizontal:
                # высота плоскости в центре облака: z = -(a x + b y + d) / c
                cx, cy = points[:, 0].mean(), points[:, 1].mean()
                ground_z = float(-(a * cx + b * cy + d) / c)
                below_share = float((points[:, 2] < ground_z - 0.10).mean())
            if horizontal and fit["inlier_ratio"] >= 0.8 and below_share < 0.05:
                scan_type = "surface"
                ext = bbox.max_bound - bbox.min_bound
                dimensions = {
                    "length_m": round(float(max(ext[0], ext[1])), 3),
                    "width_m": round(float(min(ext[0], ext[1])), 3),
                    "area_m2": round(float(ext[0] * ext[1]), 2),
                    "plane_inlier_ratio": round(fit["inlier_ratio"], 3),
                }
            else:
                scan_type = "excavation"
                dimensions = self.calculate_excavation_volume(pcd, ground_level=ground_z)

        deviations = self.check_deviations(pcd)

        return {
            "scan_type": scan_type,
            "n_points": len(points),
            "dimensions": dimensions,
            "deviations": deviations,
            "bbox": {
                "min": bbox.min_bound.tolist(),
                "max": bbox.max_bound.tolist(),
            },
        }

    def _empty_result(self) -> Dict[str, Any]:
        return {
            "length_m": 0, "width_m": 0, "height_m": 0,
            "floor_area_m2": 0, "wall_area_m2": 0, "ceiling_area_m2": 0,
            "volume_m3": 0, "perimeter_m": 0, "n_points": 0,
        }


# ─────────────────────────────────────────────
# Singleton
# ─────────────────────────────────────────────

def get_lidar() -> LiDARProcessor:
    """Get singleton LiDARProcessor instance."""
    return LiDARProcessor.get()
