"""
QAZGOST AI - Скрипты подготовки датасета
Утилиты для работы с датасетом строительных объектов
"""

import os
import shutil
import random
from pathlib import Path
from typing import List, Tuple
import json


# Классы объектов
CLASSES = [
    "trench",           # 0 - Траншея
    "pipe_pvc",         # 1 - Труба ПВХ
    "pipe_metal",       # 2 - Труба металлическая
    "pipe_concrete",    # 3 - Труба бетонная
    "manhole",          # 4 - Люк/колодец
    "foundation",       # 5 - Фундамент
    "footing",          # 6 - Подошва фундамента
    "rebar",            # 7 - Арматура
    "concrete_pour",    # 8 - Бетонирование
    "formwork",         # 9 - Опалубка
    "excavation",       # 10 - Котлован
    "backfill",         # 11 - Обратная засыпка
    "sand_bed",         # 12 - Песчаная подготовка
    "gravel_bed",       # 13 - Гравийная подготовка
    "wall_brick",       # 14 - Кирпичная стена
    "wall_concrete",    # 15 - Бетонная стена
    "slab",             # 16 - Плита перекрытия
    "column",           # 17 - Колонна
    "beam",             # 18 - Балка
    "person",           # 19 - Человек (для масштаба)
]

CLASSES_RU = {
    0: "Траншея",
    1: "Труба ПВХ",
    2: "Труба металлическая",
    3: "Труба бетонная",
    4: "Люк/колодец",
    5: "Фундамент",
    6: "Подошва фундамента",
    7: "Арматура",
    8: "Бетонирование",
    9: "Опалубка",
    10: "Котлован",
    11: "Обратная засыпка",
    12: "Песчаная подготовка",
    13: "Гравийная подготовка",
    14: "Кирпичная стена",
    15: "Бетонная стена",
    16: "Плита перекрытия",
    17: "Колонна",
    18: "Балка",
    19: "Человек",
}


def split_dataset(
    source_images_dir: str,
    source_labels_dir: str,
    output_dir: str,
    train_ratio: float = 0.7,
    val_ratio: float = 0.2,
    test_ratio: float = 0.1,
    seed: int = 42
) -> dict:
    """
    Разделить датасет на train/val/test выборки.
    
    Args:
        source_images_dir: Путь к папке с исходными изображениями
        source_labels_dir: Путь к папке с аннотациями
        output_dir: Путь к выходной папке
        train_ratio: Доля обучающей выборки
        val_ratio: Доля валидационной выборки
        test_ratio: Доля тестовой выборки
        seed: Seed для воспроизводимости
    
    Returns:
        Статистика разделения
    """
    random.seed(seed)
    
    # Получить список изображений
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
    images = []
    
    for file in Path(source_images_dir).iterdir():
        if file.suffix.lower() in image_extensions:
            label_file = Path(source_labels_dir) / f"{file.stem}.txt"
            if label_file.exists():
                images.append((file, label_file))
    
    # Перемешать
    random.shuffle(images)
    
    # Разделить
    total = len(images)
    train_end = int(total * train_ratio)
    val_end = train_end + int(total * val_ratio)
    
    splits = {
        'train': images[:train_end],
        'val': images[train_end:val_end],
        'test': images[val_end:]
    }
    
    # Создать папки и копировать файлы
    output_path = Path(output_dir)
    stats = {}
    
    for split_name, split_files in splits.items():
        img_dir = output_path / 'images' / split_name
        lbl_dir = output_path / 'labels' / split_name
        
        img_dir.mkdir(parents=True, exist_ok=True)
        lbl_dir.mkdir(parents=True, exist_ok=True)
        
        for img_file, lbl_file in split_files:
            shutil.copy(img_file, img_dir / img_file.name)
            shutil.copy(lbl_file, lbl_dir / lbl_file.name)
        
        stats[split_name] = len(split_files)
    
    print(f"✅ Датасет разделён:")
    print(f"   Train: {stats['train']} изображений")
    print(f"   Val: {stats['val']} изображений")
    print(f"   Test: {stats['test']} изображений")
    
    return stats


def validate_annotations(labels_dir: str) -> dict:
    """
    Проверить корректность аннотаций в формате YOLO.
    
    Args:
        labels_dir: Путь к папке с аннотациями
    
    Returns:
        Отчёт о проверке
    """
    report = {
        'total_files': 0,
        'valid_files': 0,
        'errors': [],
        'class_distribution': {i: 0 for i in range(len(CLASSES))},
        'total_objects': 0
    }
    
    for label_file in Path(labels_dir).glob('*.txt'):
        report['total_files'] += 1
        file_valid = True
        
        with open(label_file, 'r') as f:
            lines = f.readlines()
        
        for line_num, line in enumerate(lines, 1):
            line = line.strip()
            if not line:
                continue
            
            parts = line.split()
            
            # Проверить количество элементов
            if len(parts) != 5:
                report['errors'].append(f"{label_file.name}:{line_num} - Неверное количество значений: {len(parts)}")
                file_valid = False
                continue
            
            try:
                class_id = int(parts[0])
                x_center = float(parts[1])
                y_center = float(parts[2])
                width = float(parts[3])
                height = float(parts[4])
                
                # Проверить class_id
                if class_id < 0 or class_id >= len(CLASSES):
                    report['errors'].append(f"{label_file.name}:{line_num} - Неверный class_id: {class_id}")
                    file_valid = False
                    continue
                
                # Проверить координаты (должны быть 0-1)
                for val, name in [(x_center, 'x_center'), (y_center, 'y_center'), 
                                   (width, 'width'), (height, 'height')]:
                    if val < 0 or val > 1:
                        report['errors'].append(f"{label_file.name}:{line_num} - {name} вне диапазона: {val}")
                        file_valid = False
                
                if file_valid:
                    report['class_distribution'][class_id] += 1
                    report['total_objects'] += 1
                    
            except ValueError as e:
                report['errors'].append(f"{label_file.name}:{line_num} - Ошибка парсинга: {e}")
                file_valid = False
        
        if file_valid:
            report['valid_files'] += 1
    
    # Вывести отчёт
    print(f"\n📊 Отчёт проверки аннотаций:")
    print(f"   Всего файлов: {report['total_files']}")
    print(f"   Валидных: {report['valid_files']}")
    print(f"   С ошибками: {report['total_files'] - report['valid_files']}")
    print(f"   Всего объектов: {report['total_objects']}")
    
    if report['errors']:
        print(f"\n⚠️ Первые 10 ошибок:")
        for error in report['errors'][:10]:
            print(f"   - {error}")
    
    print(f"\n📈 Распределение по классам:")
    for class_id, count in sorted(report['class_distribution'].items(), key=lambda x: -x[1]):
        if count > 0:
            print(f"   {class_id}: {CLASSES[class_id]} ({CLASSES_RU[class_id]}) - {count}")
    
    return report


def generate_sample_annotation(image_name: str, objects: List[Tuple[int, float, float, float, float]]) -> str:
    """
    Сгенерировать пример аннотации.
    
    Args:
        image_name: Имя изображения
        objects: Список объектов [(class_id, x_center, y_center, width, height), ...]
    
    Returns:
        Строка аннотации в формате YOLO
    """
    lines = []
    for obj in objects:
        class_id, x, y, w, h = obj
        lines.append(f"{class_id} {x:.6f} {y:.6f} {w:.6f} {h:.6f}")
    return '\n'.join(lines)


def convert_coco_to_yolo(coco_json_path: str, output_dir: str, images_dir: str) -> int:
    """
    Конвертировать аннотации из формата COCO в YOLO.
    
    Args:
        coco_json_path: Путь к COCO JSON файлу
        output_dir: Путь для сохранения YOLO аннотаций
        images_dir: Путь к изображениям
    
    Returns:
        Количество конвертированных файлов
    """
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    with open(coco_json_path, 'r') as f:
        coco = json.load(f)
    
    # Создать маппинг category_id -> class_id
    category_map = {}
    for cat in coco.get('categories', []):
        name = cat['name'].lower()
        if name in CLASSES:
            category_map[cat['id']] = CLASSES.index(name)
    
    # Создать маппинг image_id -> image_info
    image_map = {img['id']: img for img in coco.get('images', [])}
    
    # Группировать аннотации по изображениям
    annotations_by_image = {}
    for ann in coco.get('annotations', []):
        img_id = ann['image_id']
        if img_id not in annotations_by_image:
            annotations_by_image[img_id] = []
        annotations_by_image[img_id].append(ann)
    
    count = 0
    for img_id, anns in annotations_by_image.items():
        img_info = image_map.get(img_id)
        if not img_info:
            continue
        
        img_width = img_info['width']
        img_height = img_info['height']
        file_name = Path(img_info['file_name']).stem
        
        yolo_lines = []
        for ann in anns:
            cat_id = ann['category_id']
            if cat_id not in category_map:
                continue
            
            class_id = category_map[cat_id]
            bbox = ann['bbox']  # [x, y, width, height] в пикселях
            
            # Конвертировать в YOLO формат
            x_center = (bbox[0] + bbox[2] / 2) / img_width
            y_center = (bbox[1] + bbox[3] / 2) / img_height
            width = bbox[2] / img_width
            height = bbox[3] / img_height
            
            yolo_lines.append(f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")
        
        if yolo_lines:
            output_path = Path(output_dir) / f"{file_name}.txt"
            with open(output_path, 'w') as f:
                f.write('\n'.join(yolo_lines))
            count += 1
    
    print(f"✅ Конвертировано {count} файлов из COCO в YOLO")
    return count


def get_dataset_stats(dataset_dir: str) -> dict:
    """
    Получить статистику датасета.
    
    Args:
        dataset_dir: Путь к корневой папке датасета
    
    Returns:
        Статистика
    """
    stats = {
        'splits': {},
        'total_images': 0,
        'total_objects': 0,
        'class_distribution': {i: 0 for i in range(len(CLASSES))}
    }
    
    dataset_path = Path(dataset_dir)
    
    for split in ['train', 'val', 'test']:
        images_dir = dataset_path / 'images' / split
        labels_dir = dataset_path / 'labels' / split
        
        if not images_dir.exists():
            continue
        
        image_count = len(list(images_dir.glob('*.[jJ][pP][gG]')) + 
                         list(images_dir.glob('*.[pP][nN][gG]')))
        
        object_count = 0
        for label_file in labels_dir.glob('*.txt'):
            with open(label_file, 'r') as f:
                lines = [l.strip() for l in f.readlines() if l.strip()]
                object_count += len(lines)
                
                for line in lines:
                    parts = line.split()
                    if parts:
                        try:
                            class_id = int(parts[0])
                            if 0 <= class_id < len(CLASSES):
                                stats['class_distribution'][class_id] += 1
                        except:
                            pass
        
        stats['splits'][split] = {
            'images': image_count,
            'objects': object_count
        }
        stats['total_images'] += image_count
        stats['total_objects'] += object_count
    
    return stats


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Использование:")
        print("  python dataset_utils.py validate <labels_dir>")
        print("  python dataset_utils.py split <images_dir> <labels_dir> <output_dir>")
        print("  python dataset_utils.py stats <dataset_dir>")
        print("  python dataset_utils.py convert_coco <coco_json> <output_dir> <images_dir>")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'validate' and len(sys.argv) >= 3:
        validate_annotations(sys.argv[2])
    
    elif command == 'split' and len(sys.argv) >= 5:
        split_dataset(sys.argv[2], sys.argv[3], sys.argv[4])
    
    elif command == 'stats' and len(sys.argv) >= 3:
        stats = get_dataset_stats(sys.argv[2])
        print(json.dumps(stats, indent=2))
    
    elif command == 'convert_coco' and len(sys.argv) >= 5:
        convert_coco_to_yolo(sys.argv[2], sys.argv[3], sys.argv[4])
    
    else:
        print(f"Неизвестная команда или недостаточно аргументов: {command}")
        sys.exit(1)
