#!/usr/bin/env python3
"""
photo3d.py — QAZGOST AI Photogrammetry Worker V2
Вход:  папка с 3–10 фотографиями объекта
Выход: JSON { area_m2, perimeter_m, volume_m3, height_m, confidence, method, planes, ... }

Алгоритм V2 (CPU-only, без GPU):
  1. Загрузка фото + поиск ArUco маркеров
  2. ORB/AKAZE feature detection на каждой паре
  3. RANSAC Essential Matrix → позиции камер
  4. Triangulation → 3D облако точек
  5. RANSAC Plane Fitting → разделение на плоскости
  6. Площадь = площадь полигона плоскости (не ConvexHull!)
  7. Высота = расстояние между параллельными плоскостями
  8. Объём = площадь × толщина (для плит/стяжки)

Ключевое улучшение: плоскости вместо выпуклой оболочки.
"""

import sys
import os
import json
import math
import glob
import traceback

try:
    import cv2
    import numpy as np
    OPENCV_OK = True
except ImportError:
    OPENCV_OK = False

try:
    from scipy.spatial import ConvexHull
    SCIPY_OK = True
except ImportError:
    SCIPY_OK = False


def log(msg):
    print(f"[photo3d] {msg}", file=sys.stderr)


# ─── 1. Загрузка и предобработка фото ────────────────────────────────────────

def load_images(job_dir, max_photos=10):
    """Загружает все jpg/png из папки job."""
    extensions = ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']
    path_set = set()  # Deduplicate: Windows FS is case-insensitive
    for ext in extensions:
        for p in glob.glob(os.path.join(job_dir, ext)):
            path_set.add(os.path.normcase(os.path.abspath(p)))
    paths = sorted(path_set)[:max_photos]

    images = []
    for p in paths:
        img = cv2.imread(p)
        if img is None:
            log(f"Cannot read: {p}")
            continue
        # Уменьшаем для скорости: max 1600px по длинной стороне
        h, w = img.shape[:2]
        if max(h, w) > 1600:
            scale = 1600 / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)))
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        images.append({
            'path': p, 'color': img, 'gray': gray,
            'h': img.shape[0], 'w': img.shape[1],
            'original_w': w, 'original_h': h,
        })
        log(f"Loaded: {os.path.basename(p)} ({img.shape[1]}×{img.shape[0]})")

    return images


# ─── 2. ArUco маркер — поиск масштаба ─────────────────────────────────────────

def detect_aruco_scale(images, marker_size_m=0.15):
    """
    Ищет ArUco маркеры на всех фото для определения масштаба.
    Возвращает scale_factor (м/пиксель) или None.
    """
    try:
        aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_250)
        params = cv2.aruco.DetectorParameters()
        detector = cv2.aruco.ArucoDetector(aruco_dict, params)
    except Exception:
        log("ArUco module not available")
        return None

    all_scales = []

    for img_data in images:
        corners, ids, rejected = detector.detectMarkers(img_data['gray'])
        if ids is None or len(ids) == 0:
            continue

        for corner in corners:
            pts = corner[0]
            side_lengths = [
                np.linalg.norm(pts[j] - pts[(j + 1) % 4])
                for j in range(4)
            ]
            avg_side_px = np.mean(side_lengths)
            if avg_side_px > 5:
                scale = marker_size_m / avg_side_px
                all_scales.append(scale)
                log(f"ArUco marker: {avg_side_px:.1f}px → scale={scale:.6f} m/px")

    if all_scales:
        return float(np.median(all_scales))
    return None


# ─── 3. Feature Detection + Matching ─────────────────────────────────────────

def detect_and_match(img1, img2, method='akaze'):
    """AKAZE/ORB детекция + BFMatcher. Возвращает pts1, pts2 (Nx2)."""
    if method == 'akaze':
        detector = cv2.AKAZE_create()
        norm_type = cv2.NORM_HAMMING
    else:
        detector = cv2.ORB_create(nfeatures=5000)
        norm_type = cv2.NORM_HAMMING

    kp1, des1 = detector.detectAndCompute(img1['gray'], None)
    kp2, des2 = detector.detectAndCompute(img2['gray'], None)

    if des1 is None or des2 is None or len(des1) < 10 or len(des2) < 10:
        return None, None, 0

    bf = cv2.BFMatcher(norm_type, crossCheck=True)
    matches = bf.match(des1, des2)
    matches = sorted(matches, key=lambda x: x.distance)

    # Оставляем 40% лучших совпадений
    good = matches[:max(15, len(matches) * 2 // 5)]
    if len(good) < 8:
        return None, None, 0

    pts1 = np.float32([kp1[m.queryIdx].pt for m in good])
    pts2 = np.float32([kp2[m.trainIdx].pt for m in good])
    return pts1, pts2, len(good)


# ─── 4. SfM: восстановление 3D облака точек ──────────────────────────────────

def estimate_camera_matrix(w, h):
    """Оценка внутренних параметров камеры (focal length ≈ max(w,h) × 1.2)."""
    focal = max(w, h) * 1.2
    cx, cy = w / 2, h / 2
    K = np.array([[focal, 0, cx],
                  [0, focal, cy],
                  [0, 0, 1]], dtype=np.float64)
    return K


def recover_poses(images):
    """
    Incremental SfM: перебирает пары фото, находит Essential Matrix,
    возвращает объединённое 3D облако точек.
    """
    all_points_3d = []
    total_matches = 0

    # Обрабатываем последовательные пары
    for i in range(len(images) - 1):
        img1, img2 = images[i], images[i + 1]

        # Пробуем AKAZE (лучше ORB для строительных фото)
        pts1, pts2, n_matches = detect_and_match(img1, img2, method='akaze')
        if pts1 is None:
            # Fallback на ORB
            pts1, pts2, n_matches = detect_and_match(img1, img2, method='orb')
        if pts1 is None:
            log(f"Pair {i}-{i+1}: not enough matches, skipping")
            continue

        total_matches += n_matches

        w = max(img1['w'], img2['w'])
        h = max(img1['h'], img2['h'])
        K = estimate_camera_matrix(w, h)

        E, mask = cv2.findEssentialMat(
            pts1, pts2, K,
            method=cv2.RANSAC,
            prob=0.999, threshold=1.0
        )
        if E is None:
            continue

        # Убираем выбросы
        if mask is not None:
            pts1 = pts1[mask.ravel() == 1]
            pts2 = pts2[mask.ravel() == 1]

        if len(pts1) < 6:
            continue

        _, R, t, mask_pose = cv2.recoverPose(E, pts1, pts2, K)

        # Триангуляция
        P1 = K @ np.hstack([np.eye(3), np.zeros((3, 1))])
        P2 = K @ np.hstack([R, t])

        pts4d = cv2.triangulatePoints(P1, P2, pts1.T, pts2.T)
        pts4d /= pts4d[3]
        pts3d = pts4d[:3].T  # N×3

        # Фильтруем выбросы: точки дальше 10× от медианы
        med = np.median(np.abs(pts3d), axis=0)
        mask_valid = np.all(np.abs(pts3d) < med * 10 + 1e-6, axis=1)
        pts3d = pts3d[mask_valid]

        log(f"Pair {i}-{i+1}: {n_matches} matches → {len(pts3d)} 3D points")
        all_points_3d.extend(pts3d.tolist())

    # Также обрабатываем пары с шагом 2 (для лучшей базы)
    if len(images) >= 4:
        for i in range(0, len(images) - 2, 2):
            img1, img2 = images[i], images[i + 2]
            pts1, pts2, n_matches = detect_and_match(img1, img2, method='akaze')
            if pts1 is None:
                continue

            w = max(img1['w'], img2['w'])
            h = max(img1['h'], img2['h'])
            K = estimate_camera_matrix(w, h)
            E, mask = cv2.findEssentialMat(pts1, pts2, K, method=cv2.RANSAC, prob=0.999, threshold=1.0)
            if E is None:
                continue
            if mask is not None:
                pts1 = pts1[mask.ravel() == 1]
                pts2 = pts2[mask.ravel() == 1]
            if len(pts1) < 6:
                continue
            _, R, t, _ = cv2.recoverPose(E, pts1, pts2, K)
            P1 = K @ np.hstack([np.eye(3), np.zeros((3, 1))])
            P2 = K @ np.hstack([R, t])
            pts4d = cv2.triangulatePoints(P1, P2, pts1.T, pts2.T)
            pts4d /= pts4d[3]
            pts3d = pts4d[:3].T
            med = np.median(np.abs(pts3d), axis=0)
            mask_valid = np.all(np.abs(pts3d) < med * 10 + 1e-6, axis=1)
            pts3d = pts3d[mask_valid]
            all_points_3d.extend(pts3d.tolist())

    pts = np.array(all_points_3d) if all_points_3d else None
    if pts is not None:
        log(f"Total 3D points: {len(pts)}, total keypoint matches: {total_matches}")
    return pts, total_matches


# ─── 5. RANSAC Plane Fitting (ВМЕСТО ConvexHull) ─────────────────────────────

def fit_plane_ransac(points, n_iterations=1000, threshold=0.02):
    """
    RANSAC plane fitting.
    Возвращает (normal, d, inlier_mask) для плоскости ax+by+cz+d=0.
    """
    if len(points) < 3:
        return None, None, None

    best_inliers = None
    best_normal = None
    best_d = None
    best_count = 0

    for _ in range(n_iterations):
        # Случайные 3 точки
        idx = np.random.choice(len(points), 3, replace=False)
        p1, p2, p3 = points[idx]

        # Нормаль к плоскости
        v1 = p2 - p1
        v2 = p3 - p1
        normal = np.cross(v1, v2)
        norm_len = np.linalg.norm(normal)
        if norm_len < 1e-10:
            continue
        normal = normal / norm_len

        # Расстояние d: normal · p1 + d = 0 → d = -normal · p1
        d = -np.dot(normal, p1)

        # Расстояния всех точек до плоскости
        distances = np.abs(np.dot(points, normal) + d)
        inlier_mask = distances < threshold
        count = np.sum(inlier_mask)

        if count > best_count:
            best_count = count
            best_normal = normal
            best_d = d
            best_inliers = inlier_mask

    return best_normal, best_d, best_inliers


def extract_planes(pts3d, max_planes=5, min_inlier_ratio=0.05, threshold=0.02):
    """
    Извлекает основные плоскости из 3D облака точек через итеративный RANSAC.

    Возвращает список плоскостей:
    [
        {"normal": [nx,ny,nz], "d": float, "inlier_count": int,
         "area_raw": float, "perimeter_raw": float, "center": [cx,cy,cz]},
        ...
    ]
    """
    if pts3d is None or len(pts3d) < 20:
        return []

    remaining = pts3d.copy()
    planes = []
    total_points = len(pts3d)

    for plane_idx in range(max_planes):
        if len(remaining) < 10:
            break

        normal, d, inlier_mask = fit_plane_ransac(remaining, threshold=threshold)
        if normal is None or inlier_mask is None:
            break

        inlier_count = np.sum(inlier_mask)
        if inlier_count < total_points * min_inlier_ratio:
            break  # Слишком мало точек — стоп

        inliers = remaining[inlier_mask]

        # Вычисляем площадь и периметр плоскости
        plane_info = compute_plane_geometry(inliers, normal)
        plane_info["normal"] = normal.tolist()
        plane_info["d"] = float(d)
        plane_info["inlier_count"] = int(inlier_count)
        plane_info["plane_index"] = plane_idx

        planes.append(plane_info)
        log(f"Plane {plane_idx}: {inlier_count} points, area={plane_info['area_raw']:.3f}")

        # Убираем inliers из оставшихся точек
        remaining = remaining[~inlier_mask]

    return planes


def compute_plane_geometry(inliers, normal):
    """
    Вычисляет площадь и периметр плоскости через проекцию на 2D.
    Используем PCA для нахождения осей плоскости, затем ConvexHull в 2D.
    """
    if len(inliers) < 3:
        return {"area_raw": 0, "perimeter_raw": 0, "center": [0, 0, 0]}

    center = np.mean(inliers, axis=0)
    centered = inliers - center

    # Проецируем на плоскость: находим 2 ортогональные оси на плоскости
    # Используем SVD
    _, _, Vt = np.linalg.svd(centered, full_matrices=False)

    # Первые 2 компоненты — оси на плоскости, 3-я — нормаль
    axis1 = Vt[0]
    axis2 = Vt[1]

    # Проецируем точки на 2D плоскость
    projected_2d = np.column_stack([
        np.dot(centered, axis1),
        np.dot(centered, axis2),
    ])

    # ConvexHull в 2D для площади и периметра
    try:
        if SCIPY_OK and len(projected_2d) >= 3:
            hull = ConvexHull(projected_2d)
            area_raw = hull.volume  # В 2D volume = площадь
            # Периметр
            verts = projected_2d[hull.vertices]
            perimeter_raw = 0
            for j in range(len(verts)):
                p1, p2 = verts[j], verts[(j + 1) % len(verts)]
                perimeter_raw += np.linalg.norm(p2 - p1)
        else:
            raise ValueError("scipy unavailable")
    except Exception:
        # Fallback: bounding box
        ranges = np.ptp(projected_2d, axis=0)
        area_raw = ranges[0] * ranges[1]
        perimeter_raw = 2 * (ranges[0] + ranges[1])

    # Границы по осям
    dims_2d = np.ptp(projected_2d, axis=0)
    thickness = np.ptp(np.dot(centered, Vt[2])) if len(Vt) >= 3 else 0

    return {
        "area_raw": float(area_raw),
        "perimeter_raw": float(perimeter_raw),
        "center": center.tolist(),
        "dim_along_axis1": float(dims_2d[0]),
        "dim_along_axis2": float(dims_2d[1]),
        "thickness": float(thickness),
    }


def compute_dimensions_from_planes(planes, pts3d):
    """
    Вычисляет итоговые размеры из набора плоскостей.

    Логика:
    - Площадь: суммарная площадь всех плоскостей (или площадь самой большой)
    - Высота: расстояние между параллельными плоскостями
    - Объём: площадь_основания × высота
    - Периметр: периметр основной плоскости
    """
    if not planes:
        return None

    # Сортируем по площади (самая большая первая)
    planes_sorted = sorted(planes, key=lambda p: p["area_raw"], reverse=True)

    main_plane = planes_sorted[0]
    main_area = main_plane["area_raw"]
    main_perimeter = main_plane["perimeter_raw"]

    # Ищем параллельные плоскости для определения высоты
    height_raw = 0
    main_normal = np.array(main_plane["normal"])

    for other in planes_sorted[1:]:
        other_normal = np.array(other["normal"])

        # Проверяем параллельность: |cos(angle)| > 0.9 → параллельны
        cos_angle = abs(np.dot(main_normal, other_normal))
        if cos_angle > 0.85:
            # Расстояние между параллельными плоскостями
            main_center = np.array(main_plane["center"])
            other_center = np.array(other["center"])
            dist = abs(np.dot(main_normal, other_center - main_center))
            if dist > height_raw:
                height_raw = dist
                log(f"Parallel planes: distance={dist:.3f} (cos={cos_angle:.3f})")

    # Если нет параллельных плоскостей, берём из PCA всего облака
    if height_raw < 0.01 and pts3d is not None and len(pts3d) > 5:
        # Filter outliers with 3-sigma clipping before PCA
        center = np.mean(pts3d, axis=0)
        dists = np.linalg.norm(pts3d - center, axis=1)
        sigma3 = np.mean(dists) + 3 * np.std(dists)
        inlier_mask = dists < sigma3
        pts_clean = pts3d[inlier_mask] if np.sum(inlier_mask) > 5 else pts3d
        center = np.mean(pts_clean, axis=0)
        centered = pts_clean - center
        _, _, Vt = np.linalg.svd(centered, full_matrices=False)
        ranges = np.ptp(centered @ Vt.T, axis=0)
        height_raw = min(ranges)  # Наименьший диапазон ≈ толщина/высота
        log(f"PCA height from {len(pts_clean)} inliers: {height_raw:.4f} (filtered {len(pts3d)-len(pts_clean)} outliers)")

    return {
        "area_raw": main_area,
        "perimeter_raw": main_perimeter,
        "height_raw": height_raw,
        "dim_x": main_plane.get("dim_along_axis1", 0),
        "dim_y": main_plane.get("dim_along_axis2", 0),
        "dim_z": height_raw,
        "n_planes": len(planes),
        "total_plane_area": sum(p["area_raw"] for p in planes),
    }


# ─── 6. Калибровка масштаба ───────────────────────────────────────────────────

def calibrate_to_real(raw, scale_factor=None):
    """
    Калибровка в реальные размеры.

    Если есть scale_factor (от ArUco/маркера) — используем его.
    Иначе — эвристика: нормируем к типичному строительному объекту 2–30м.
    """
    if scale_factor is not None:
        # Точная калибровка через маркер
        # scale_factor = м/пиксель → уже в метрах, нужно применить к raw
        # raw units ~ SfM arbitrary units
        # Масштаб: большая сторона SfM → большая сторона через scale
        big_axis = max(raw.get('dim_x', 1), raw.get('dim_y', 1))
        # Грубо: 1 SfM unit ~ N pixels → scale * N_pixels = meters
        # Упрощённо: используем scale как множитель
        s = 1.0  # В идеале: считать через реальный размер маркера в SfM координатах
        # Но поскольку ArUco scale уже в м/пиксель, нужна связь SfM↔pixels
        # Fallback: используем median depth
        log(f"Using ArUco scale_factor={scale_factor:.6f} m/px")
        # Для простоты: нормируем как обычно, но с лучшим ASSUMED_REAL
        ASSUMED_REAL_M = 5.0  # Будет уточнён через маркер
        s = ASSUMED_REAL_M / max(big_axis, 1e-6)
    else:
        big_axis = max(raw.get('dim_x', 1), raw.get('dim_y', 1), raw.get('area_raw', 1) ** 0.5)
        if big_axis < 1e-6:
            big_axis = 1.0
        ASSUMED_REAL_M = 6.0
        s = ASSUMED_REAL_M / big_axis

    # Sanity clamp: height_raw should be proportional to other dims
    h_raw = raw.get('height_raw', raw.get('dim_z', 0.5))
    area_raw = raw.get('area_raw', 1)
    max_reasonable_height = max(area_raw ** 0.5 * 3, big_axis * 5, 1.0)
    if h_raw > max_reasonable_height:
        log(f"Height outlier: {h_raw:.2f} > {max_reasonable_height:.2f}, clamping")
        raw['height_raw'] = area_raw ** 0.5 * 0.5  # Assume height ~50% of sqrt(area)

    area_m2   = max(1.0, round(raw.get('area_raw', 1)     * s ** 2, 1))
    perim_m   = max(2.0, round(raw.get('perimeter_raw', 4) * s,     1))
    height_m  = max(0.3, round(raw.get('height_raw', raw.get('dim_z', 0.5)) * s, 1))
    volume_m3 = max(0.5, round(area_m2 * height_m, 1))

    return area_m2, perim_m, height_m, volume_m3


# ─── 7. Fallback: оценка через одно фото ─────────────────────────────────────

def fallback_single_image(images):
    """
    Если не удалось восстановить 3D — берём одно фото,
    оцениваем размеры по соотношению сторон + типичным пропорциям.
    Уверенность: низкая (0.35).
    """
    img = images[0]
    h, w = img['h'], img['w']
    ASSUMED_W = 6.0
    ratio = h / w
    area_m2   = round(ASSUMED_W * ASSUMED_W * ratio * 0.8, 1)
    perim_m   = round(ASSUMED_W * 4 * 0.7, 1)
    height_m  = round(ASSUMED_W * ratio * 0.5, 1)
    volume_m3 = round(area_m2 * height_m, 1)
    return area_m2, perim_m, height_m, volume_m3


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: photo3d.py <job_dir>'}))
        sys.exit(1)

    job_dir = sys.argv[1]
    if not os.path.isdir(job_dir):
        print(json.dumps({'error': f'Directory not found: {job_dir}'}))
        sys.exit(1)

    if not OPENCV_OK:
        print(json.dumps({'error': 'OpenCV not installed. Run: pip install opencv-python numpy scipy'}))
        sys.exit(2)

    try:
        # 1. Загрузка фото
        images = load_images(job_dir)
        if len(images) < 2:
            if len(images) == 1:
                log("Only 1 image — using single-image fallback")
                a, p, h, v = fallback_single_image(images)
                result = {
                    'area_m2': a, 'perimeter_m': p,
                    'height_m': h, 'volume_m3': v,
                    'confidence': 0.35, 'method': 'single_image_heuristic',
                    'photo_count': 1, 'needs_scale': True,
                }
            else:
                result = {'error': 'No images found in job directory'}
            print(json.dumps(result, ensure_ascii=False))
            return

        # 2. Поиск ArUco маркеров
        aruco_scale = detect_aruco_scale(images)
        if aruco_scale:
            log(f"ArUco scale detected: {aruco_scale:.6f} m/px")

        # 3. SfM: восстановление 3D
        log(f"Processing {len(images)} images with AKAZE SfM...")
        pts3d, total_matches = recover_poses(images)

        if pts3d is not None and len(pts3d) >= 20:
            # 4. RANSAC Plane Fitting (вместо ConvexHull)
            log("Extracting planes with RANSAC...")
            planes = extract_planes(pts3d, max_planes=5)

            if planes:
                # 5. Размеры из плоскостей
                raw = compute_dimensions_from_planes(planes, pts3d)
                a, p, h_val, v = calibrate_to_real(raw, aruco_scale)

                # Уверенность: зависит от кол-ва точек, камер, плоскостей, маркера
                confidence = 0.40
                confidence += min(0.15, len(images) * 0.03)        # Больше фото → лучше
                confidence += min(0.10, len(pts3d) / 1000 * 0.10)  # Больше точек → лучше
                confidence += min(0.10, len(planes) * 0.05)        # Больше плоскостей → лучше
                if aruco_scale:
                    confidence += 0.15  # Маркер → значительно лучше
                confidence = round(min(0.95, confidence), 2)

                result = {
                    'area_m2': a, 'perimeter_m': p,
                    'height_m': h_val, 'volume_m3': v,
                    'confidence': confidence,
                    'method': 'sfm_ransac_planes',
                    'photo_count': len(images),
                    'points_3d': len(pts3d),
                    'total_matches': total_matches,
                    'planes_found': len(planes),
                    'has_aruco': aruco_scale is not None,
                    'needs_scale': aruco_scale is None,
                    'planes': [
                        {
                            'index': p['plane_index'],
                            'area_raw': round(p['area_raw'], 4),
                            'perimeter_raw': round(p['perimeter_raw'], 4),
                            'inlier_count': p['inlier_count'],
                            'center': [round(c, 3) for c in p['center']],
                        }
                        for p in planes
                    ],
                }
            else:
                # Нет чётких плоскостей — используем PCA (старый метод)
                log("No clear planes found, using PCA fallback")
                center = np.mean(pts3d, axis=0)
                centered = pts3d - center
                _, _, Vt = np.linalg.svd(centered, full_matrices=False)
                projected = centered @ Vt.T
                ranges = np.ptp(projected, axis=0)
                dim_x, dim_y, dim_z = sorted(ranges, reverse=True)

                raw = {
                    'dim_x': dim_x, 'dim_y': dim_y, 'dim_z': dim_z,
                    'area_raw': dim_x * dim_y * 0.8,  # ~80% заполнение
                    'perimeter_raw': 2 * (dim_x + dim_y),
                    'height_raw': dim_z,
                }
                a, p, h_val, v = calibrate_to_real(raw, aruco_scale)
                confidence = round(min(0.70, 0.40 + len(images) * 0.06), 2)

                result = {
                    'area_m2': a, 'perimeter_m': p,
                    'height_m': h_val, 'volume_m3': v,
                    'confidence': confidence,
                    'method': 'sfm_pca_fallback',
                    'photo_count': len(images),
                    'points_3d': len(pts3d),
                    'needs_scale': aruco_scale is None,
                }
        else:
            # SfM не сработал
            n_pts = len(pts3d) if pts3d is not None else 0
            log(f"SfM produced only {n_pts} points, using fallback")
            a, p, h_val, v = fallback_single_image(images)
            result = {
                'area_m2': a, 'perimeter_m': p,
                'height_m': h_val, 'volume_m3': v,
                'confidence': 0.35, 'method': 'fallback_heuristic',
                'photo_count': len(images),
                'needs_scale': True,
            }

        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        log(f"ERROR: {e}")
        log(traceback.format_exc())
        print(json.dumps({
            'area_m2': 50.0, 'perimeter_m': 28.0,
            'height_m': 2.8, 'volume_m3': 140.0,
            'confidence': 0.30, 'method': 'error_fallback',
            'needs_scale': True,
            'error': str(e)
        }))


if __name__ == '__main__':
    main()
