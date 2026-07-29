"""
test_photo3d.py — end-to-end тест фотограмметрии
Генерирует 5 синтетических изображений комнаты и запускает photo3d.py
"""
import os, sys, json, subprocess, shutil, tempfile
import numpy as np
import cv2

# ── 1. Создаём 5 тестовых изображений ─────────────────────────────────────
def make_synthetic_room(idx, size=(640, 480)):
    """Рисует простую «комнату» с перспективой и текстурными точками"""
    img = np.ones((size[1], size[0], 3), dtype=np.uint8) * 200

    # Фон (стена)
    angle_offset = idx * 15  # каждое фото чуть повёрнуто
    cx = size[0] // 2 + angle_offset * 3
    cy = size[1] // 2

    # Пол
    pts_floor = np.array([[0, size[1]], [size[0], size[1]],
                           [int(size[0]*0.8), int(size[1]*0.6)],
                           [int(size[0]*0.2), int(size[1]*0.6)]], np.int32)
    cv2.fillPoly(img, [pts_floor], (140, 100, 60))

    # Стена задняя
    pts_wall = np.array([[int(size[0]*0.2), int(size[1]*0.6)],
                          [int(size[0]*0.8), int(size[1]*0.6)],
                          [int(size[0]*0.75), 30],
                          [int(size[0]*0.25), 30]], np.int32)
    cv2.fillPoly(img, [pts_wall], (180, 170, 160))

    # Боковая стена
    pts_side = np.array([[0, size[1]], [int(size[0]*0.2), int(size[1]*0.6)],
                          [int(size[0]*0.25), 30], [0, 0]], np.int32)
    cv2.fillPoly(img, [pts_side], (160, 152, 145))

    # Текстурные точки (ключевые точки для ORB)
    rng = np.random.RandomState(42 + idx)
    for _ in range(80):
        x = rng.randint(0, size[0])
        y = rng.randint(0, size[1])
        r = rng.randint(2, 6)
        color = tuple(int(c) for c in rng.randint(30, 200, 3))
        cv2.circle(img, (x, y), r, color, -1)

    # Линии перспективы
    cv2.line(img, (0, size[1]), (cx, cy), (100, 80, 60), 2)
    cv2.line(img, (size[0], size[1]), (cx, cy), (100, 80, 60), 2)
    cv2.line(img, (0, 0), (cx, cy), (100, 80, 60), 1)
    cv2.line(img, (size[0], 0), (cx, cy), (100, 80, 60), 1)

    # Окно
    wx = int(size[0]*0.35) + angle_offset
    cv2.rectangle(img, (wx, 60), (wx + 120, 160), (200, 230, 255), -1)
    cv2.rectangle(img, (wx, 60), (wx + 120, 160), (80, 80, 80), 2)

    return img

# ── 2. Создаём временную папку и сохраняем изображения ────────────────────
test_dir = tempfile.mkdtemp(prefix='photo3d_test_')
print(f"[TEST] Временная папка: {test_dir}")

for i in range(5):
    img = make_synthetic_room(i)
    path = os.path.join(test_dir, f'photo_{i}.jpg')
    cv2.imwrite(path, img)
    print(f"[TEST] Сохранено: photo_{i}.jpg ({img.shape[1]}x{img.shape[0]})")

# ── 3. Запускаем photo3d.py ────────────────────────────────────────────────
script = os.path.join(os.path.dirname(__file__), 'photo3d.py')
print(f"\n[TEST] Запуск photo3d.py...")
print(f"[TEST] Скрипт: {script}")
print(f"[TEST] Папка:  {test_dir}\n")

result = subprocess.run(
    [sys.executable, script, test_dir],
    capture_output=True, text=True, timeout=60
)

# ── 4. Вывод результатов ──────────────────────────────────────────────────
print("=" * 60)
print("STDOUT (JSON результат):")
print(result.stdout)

if result.stderr:
    print("\nSTDERR (лог работы):")
    print(result.stderr)

print(f"\nExit code: {result.returncode}")

# ── 5. Парсим и красиво выводим результат ─────────────────────────────────
try:
    data = json.loads(result.stdout.strip())
    print("\n" + "=" * 60)
    print("✅ РЕЗУЛЬТАТ ФОТОГРАММЕТРИИ:")
    print(f"  📐 Площадь:   {data.get('area_m2', '—')} м²")
    print(f"  📏 Периметр:  {data.get('perimeter_m', '—')} м")
    print(f"  📦 Высота:    {data.get('height_m', '—')} м")
    print(f"  🧊 Объём:     {data.get('volume_m3', '—')} м³")
    print(f"  🎯 Точность:  {round(data.get('confidence', 0) * 100)}%")
    print(f"  🔬 Метод:     {data.get('method', '—')}")
    print(f"  📷 Фото:      {data.get('photo_count', '—')} шт.")
    if data.get('points_3d'):
        print(f"  ☁️  3D-точек: {data['points_3d']}")
    print("=" * 60)
except json.JSONDecodeError as e:
    print(f"\n❌ Ошибка парсинга JSON: {e}")
    print("Raw stdout:", repr(result.stdout))

# ── 6. Чистим ─────────────────────────────────────────────────────────────
shutil.rmtree(test_dir, ignore_errors=True)
print("\n[TEST] Временные файлы удалены. Тест завершён.")
