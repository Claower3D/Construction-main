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

    def load_point_cloud(self, file_path: str) -> Optional[Any]:
        """
        Load point cloud from file.
        Supports: .las, .laz, .ply, .pcd, .xyz
        Returns: open3d.geometry.PointCloud or None
        """
        if not self.available:
            logger.error("[LiDAR] open3d not available")
            return None

        path = Path(file_path)
        suffix = path.suffix.lower()

        try:
            if suffix in (".las", ".laz"):
                return self._load_las(path)
            elif suffix in (".ply", ".pcd", ".xyz"):
                pcd = o3d.io.read_point_cloud(str(path))
                n_points = len(pcd.points)
                logger.info(f"[LiDAR] Loaded {n_points:,} points from {path.name}")
                return pcd
            else:
                logger.error(f"[LiDAR] Unsupported format: {suffix}")
                return None
        except Exception as e:
            logger.error(f"[LiDAR] Load error: {e}")
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

    def check_deviations(self, pcd) -> Dict[str, Any]:
        """
        Check surface deviations from vertical/horizontal planes.
        Returns deviation analysis per СНиП РК norms.
        """
        if pcd is None:
            return {"vertical_deviation_mm": 0, "horizontal_deviation_mm": 0, "quality": "N/A"}

        points = np.asarray(pcd.points)

        # Fit plane to points
        pcd.estimate_normals()
        normals = np.asarray(pcd.normals)

        # Average normal direction
        avg_normal = np.mean(normals, axis=0)
        avg_normal = avg_normal / np.linalg.norm(avg_normal)

        # Check if surface is vertical or horizontal
        z_component = abs(avg_normal[2])

        if z_component > 0.7:
            # Horizontal surface (floor/ceiling)
            z_vals = points[:, 2]
            plane_z = np.mean(z_vals)
            deviations = np.abs(z_vals - plane_z) * 1000  # mm
            max_dev = float(np.max(deviations))
            avg_dev = float(np.mean(deviations))
            surface_type = "horizontal"
        else:
            # Vertical surface (wall)
            # Project onto dominant plane
            d = np.dot(points - np.mean(points, axis=0), avg_normal)
            deviations = np.abs(d) * 1000  # mm
            max_dev = float(np.max(deviations))
            avg_dev = float(np.mean(deviations))
            surface_type = "vertical"

        # Quality assessment per СНиП
        # СНиП 3.04.01-87: допустимое отклонение 3мм/м для штукатурки
        if max_dev <= 3:
            quality = "✅ Отлично (< 3мм — СНиП 3.04.01-87)"
        elif max_dev <= 5:
            quality = "⚠️ Допустимо (3-5мм)"
        elif max_dev <= 10:
            quality = "❌ Требует исправления (5-10мм)"
        else:
            quality = "🚨 Критическое отклонение (> 10мм)"

        return {
            "surface_type": surface_type,
            "max_deviation_mm": round(max_dev, 1),
            "avg_deviation_mm": round(avg_dev, 1),
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

        Returns combined results:
          - dimensions (room or excavation)
          - deviations
          - metadata
        """
        pcd = self.load_point_cloud(file_path)
        if pcd is None:
            return {"error": "Failed to load point cloud", "available": self.available}

        points = np.asarray(pcd.points)
        bbox = pcd.get_axis_aligned_bounding_box()
        height = bbox.max_bound[2] - bbox.min_bound[2]

        # Determine type: room (height > 1.5m) or excavation
        if height > 1.5:
            dimensions = self.calculate_room_dimensions(pcd)
            scan_type = "room"
        else:
            dimensions = self.calculate_excavation_volume(pcd)
            scan_type = "excavation"

        deviations = self.check_deviations(pcd)

        return {
            "scan_type": scan_type,
            "file": Path(file_path).name,
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
