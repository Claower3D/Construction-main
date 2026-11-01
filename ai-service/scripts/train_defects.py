#!/usr/bin/env python3
"""
QazGost AI — Complete Defect Detection Training Pipeline

Trains Ultralytics YOLO26 (default yolo26s.pt) on dataset/merged and installs the best weights
into models/defect_yolo26_best.pt (+ .meta.json with val metrics and calibrated conf threshold),
from where the AI service loads them. Optionally (re)downloads public datasets from Roboflow Universe.

ВНИМАНИЕ: текущий dataset/merged размечен ТОЛЬКО классом 0 (crack) — оба набора в DATASETS ниже
это датасеты трещин. Чтобы модель реально находила коррозию/сколы/высолы/пятна, добавьте размеченные
данные этих классов (class_map) — иначе остальные 5 классов останутся необученными.

Classes:
  0: crack       (трещина)
  1: corrosion   (коррозия/ржавчина)
  2: spalling    (отслоение/сколы)
  3: efflorescence (высолы)
  4: damage      (повреждение)
  5: stain       (пятно/протечка)

Usage (из каталога ai-service):
    python scripts/train_defects.py                         # YOLO26s, 120 эпох, imgsz 640, GPU 0 (иначе CPU)
    python scripts/train_defects.py --model yolo26n.pt --epochs 60
    python scripts/train_defects.py --device cpu --time 2   # лимит 2 часа (CPU)
    python scripts/train_defects.py --download              # заново скачать и смержить датасеты Roboflow
"""

import os
import sys
import shutil
import yaml
import argparse
from pathlib import Path
from datetime import datetime

# Project root
ROOT = Path(__file__).parent.parent
DATASET_DIR = ROOT / "dataset"
RUNS_DIR = ROOT / "runs"

# Roboflow API key
RF_API_KEY = os.getenv("ROBOFLOW_API_KEY", "ZRksh6wcykt4frv8Nhzh")

# Public datasets from Roboflow Universe to merge
# Each: (workspace, project, version, class_mapping)
DATASETS = [
    # Concrete crack detection (popular, well-annotated)
    {
        "workspace": "university-bswxt",
        "project": "crack-bphdr",
        "version": 2,
        "class_map": {"crack": 0, "Crack": 0, "cracks": 0},
    },
    # Concrete surface damage
    {
        "workspace": "sdu-sv8fh",
        "project": "concrete-crack-segmentation-bxzjg",
        "version": 1,
        "class_map": {"crack": 0, "Crack": 0},
    },
]

# Our unified class names
CLASS_NAMES = [
    "crack",          # 0 — трещина
    "corrosion",      # 1 — коррозия
    "spalling",       # 2 — отслоение/сколы
    "efflorescence",  # 3 — высолы
    "damage",         # 4 — повреждение
    "stain",          # 5 — пятно/протечка
]


def download_datasets():
    """Download all datasets from Roboflow Universe."""
    try:
        from roboflow import Roboflow
    except ImportError:
        print("❌ roboflow not installed. Run: pip install roboflow")
        sys.exit(1)
    
    rf = Roboflow(api_key=RF_API_KEY)
    raw_dir = DATASET_DIR / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    
    downloaded = []
    
    for i, ds in enumerate(DATASETS):
        print(f"\n{'='*60}")
        print(f"📥 [{i+1}/{len(DATASETS)}] Downloading: {ds['workspace']}/{ds['project']} v{ds['version']}")
        print(f"{'='*60}")
        
        try:
            project = rf.workspace(ds["workspace"]).project(ds["project"])
            dataset = project.version(ds["version"]).download(
                "yolov8",
                location=str(raw_dir / f"ds_{i}")
            )
            downloaded.append({
                "index": i,
                "path": Path(dataset.location),
                "class_map": ds["class_map"],
            })
            print(f"✅ Downloaded to: {dataset.location}")
        except Exception as e:
            print(f"⚠️ Failed to download {ds['project']}: {e}")
            continue
    
    return downloaded


def merge_datasets(downloaded: list):
    """Merge all downloaded datasets into unified format."""
    merged_dir = DATASET_DIR / "merged"
    
    # Clean previous merge
    if merged_dir.exists():
        shutil.rmtree(merged_dir)
    
    for split in ["train", "val"]:
        (merged_dir / "images" / split).mkdir(parents=True, exist_ok=True)
        (merged_dir / "labels" / split).mkdir(parents=True, exist_ok=True)
    
    total_images = 0
    total_labels = 0
    
    for ds_info in downloaded:
        ds_path = ds_info["path"]
        class_map = ds_info["class_map"]
        idx = ds_info["index"]
        
        for src_split in ["train", "valid", "test"]:
            dst_split = "val" if src_split in ("valid", "test") else "train"
            
            src_imgs = ds_path / src_split / "images"
            src_lbls = ds_path / src_split / "labels"
            
            if not src_imgs.exists():
                continue
            
            # Read dataset's data.yaml to get class names
            data_yaml = ds_path / "data.yaml"
            ds_classes = []
            if data_yaml.exists():
                with open(data_yaml) as f:
                    dy = yaml.safe_load(f)
                    ds_classes = dy.get("names", [])
                    if isinstance(ds_classes, dict):
                        ds_classes = [ds_classes[k] for k in sorted(ds_classes.keys())]
            
            for img_file in src_imgs.iterdir():
                if not img_file.suffix.lower() in ('.jpg', '.jpeg', '.png', '.bmp'):
                    continue
                
                # Copy image with unique prefix
                new_name = f"ds{idx}_{img_file.name}"
                shutil.copy2(img_file, merged_dir / "images" / dst_split / new_name)
                total_images += 1
                
                # Copy and remap labels
                lbl_file = src_lbls / (img_file.stem + ".txt")
                if lbl_file.exists():
                    new_lbl = merged_dir / "labels" / dst_split / (f"ds{idx}_{img_file.stem}.txt")
                    
                    with open(lbl_file) as f:
                        lines = f.readlines()
                    
                    remapped = []
                    for line in lines:
                        parts = line.strip().split()
                        if len(parts) < 5:
                            continue
                        
                        old_class_id = int(parts[0])
                        
                        # Get original class name
                        if old_class_id < len(ds_classes):
                            old_class_name = ds_classes[old_class_id]
                        else:
                            old_class_name = str(old_class_id)
                        
                        # Map to our unified class
                        new_class_id = class_map.get(old_class_name, 0)
                        
                        remapped.append(f"{new_class_id} {' '.join(parts[1:])}\n")
                    
                    if remapped:
                        with open(new_lbl, "w") as f:
                            f.writelines(remapped)
                        total_labels += 1
    
    print(f"\n📊 Merged dataset:")
    print(f"   Images: {total_images}")
    print(f"   Labels: {total_labels}")
    print(f"   Path:   {merged_dir}")
    
    # Create data.yaml (без абсолютного path: пути считаются от каталога yaml — переносимо между ПК)
    data_yaml = {
        "train": "images/train",
        "val": "images/val",
        "nc": len(CLASS_NAMES),
        "names": CLASS_NAMES,
    }
    
    yaml_path = merged_dir / "data.yaml"
    with open(yaml_path, "w") as f:
        yaml.dump(data_yaml, f, default_flow_style=False, allow_unicode=True)
    
    print(f"   Config: {yaml_path}")
    
    return yaml_path, total_images


def resolve_device(requested: str) -> str:
    """'0' / 'cuda' → GPU if available, otherwise fall back to CPU (with a message)."""
    if requested.lower() in ("cpu", "mps"):
        return requested
    try:
        import torch
        if torch.cuda.is_available():
            return requested
    except Exception:
        pass
    print(f"⚠️ GPU '{requested}' недоступен (torch.cuda.is_available() = False) — обучение на CPU")
    return "cpu"


def prepare_data_yaml(data_yaml: Path) -> Path:
    """
    data.yaml с относительными путями (или с чужим абсолютным path, например Windows) →
    временный yaml с абсолютным путём к каталогу датасета. Исходный файл не меняется.
    """
    import tempfile

    cfg = yaml.safe_load(data_yaml.read_text(encoding="utf-8")) or {}
    cfg["path"] = str(data_yaml.parent.resolve())
    cfg.setdefault("names", CLASS_NAMES)
    cfg["nc"] = len(cfg["names"])
    tmp = Path(tempfile.gettempdir()) / "qazgost_train_data.yaml"
    tmp.write_text(yaml.safe_dump(cfg, allow_unicode=True), encoding="utf-8")
    return tmp


def check_class_balance(data_yaml: Path) -> None:
    """Print label class distribution and warn about classes without any examples."""
    names = CLASS_NAMES
    for split in ("train", "val"):
        counts = {}
        for f in (data_yaml.parent / "labels" / split).glob("*.txt"):
            for line in f.read_text().splitlines():
                if line.strip():
                    k = int(line.split()[0])
                    counts[k] = counts.get(k, 0) + 1
        pretty = ", ".join(f"{names[k] if k < len(names) else k}={v}" for k, v in sorted(counts.items()))
        print(f"   {split}: {pretty or 'нет меток'}")
        missing = [names[i] for i in range(len(names)) if i not in counts]
        if missing and split == "train":
            print(f"   ⚠️ Нет примеров классов: {', '.join(missing)} — модель не научится их находить")


def default_output(base_model: str) -> Path:
    stem = Path(base_model).stem.lower()           # yolo26s / yolov8s / yolo11n
    family = "yolo26" if stem.startswith("yolo26") else stem.rstrip("nslmx")
    return ROOT / "models" / f"defect_{family}_best.pt"


def train_model(
    data_yaml: Path,
    epochs: int = 120,
    imgsz: int = 640,
    batch: int = 16,
    base_model: str = "yolo26s.pt",
    device: str = "0",
    workers: int = 8,
    patience: int = 30,
    time_h: float = None,
    fraction: float = 1.0,
    output: Path = None,
):
    """Train YOLO26 (or another Ultralytics model) and install best.pt into models/."""
    try:
        from ultralytics import YOLO
    except ImportError:
        print("❌ ultralytics not installed. Run: pip install -U ultralytics")
        sys.exit(1)

    device = resolve_device(device)
    output = Path(output) if output else default_output(base_model)
    train_yaml = prepare_data_yaml(data_yaml)

    print(f"\n{'='*60}")
    print(f"🧠 Defect detection training: {base_model}")
    print(f"{'='*60}")
    print(f"   Data:    {data_yaml}")
    check_class_balance(data_yaml)
    print(f"   Epochs:  {epochs}{f' (лимит {time_h} ч)' if time_h else ''}")
    print(f"   ImgSize: {imgsz}   Batch: {batch}   Device: {device}   Fraction: {fraction}")
    print(f"   Output:  {output}")

    model = YOLO(base_model)  # yolo26*.pt скачивается с GitHub releases при первом запуске

    family = Path(base_model).stem.lower()
    run_name = f"{family}_{datetime.now().strftime('%Y%m%d_%H%M')}"
    train_kwargs = dict(
        data=str(train_yaml),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        device=device,
        workers=workers,
        name=run_name,
        project=str(RUNS_DIR),
        patience=patience,
        fraction=fraction,
        save=True,
        plots=True,
        verbose=True,
        cache=False,
    )
    if time_h:
        train_kwargs["time"] = time_h
    model.train(**train_kwargs)

    run_dir = Path(model.trainer.save_dir) if getattr(model, "trainer", None) else RUNS_DIR / run_name
    best_pt = run_dir / "weights" / "best.pt"
    if not best_pt.exists():
        print("⚠️ No best.pt found — training may have failed")
        return None

    output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(best_pt, output)
    print(f"\n✅ Веса установлены: {output}  (run: {run_dir})")

    # Метрики на val + откалиброванный порог → <output>.meta.json (сервис читает его при загрузке)
    try:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from eval_defects import evaluate
        res = evaluate(str(output), str(data_yaml), imgsz=imgsz, device=device, bench=20, write_meta=True)
        print(f"   val: P={res['P']} R={res['R']} mAP50={res['mAP50']} mAP50-95={res['mAP50-95']} "
              f"conf*={res['best_conf_by_f1']}")
    except Exception as e:
        print(f"⚠️ Оценка на val не выполнена ({e}). Запустите: python scripts/eval_defects.py "
              f"--weights {output} --write-meta")
    try:
        shown = str(output.resolve().relative_to(ROOT)).replace("\\", "/")
    except ValueError:
        shown = str(output)
    print("   Сервис выберет модель автоматически (models/defect_yolo26_best.pt — первая в списке);"
          f" явно: DEFECT_MODEL_PATH={shown}")
    return output


def export_model(model_path: Path):
    """Export trained model to ONNX for faster inference."""
    try:
        from ultralytics import YOLO
    except ImportError:
        return
    
    print(f"\n📦 Exporting model to ONNX...")
    model = YOLO(str(model_path))
    model.export(format="onnx", imgsz=640, simplify=True)
    
    onnx_path = model_path.with_suffix(".onnx")
    if onnx_path.exists():
        print(f"✅ ONNX model: {onnx_path}")


def main():
    parser = argparse.ArgumentParser(description="QazGost AI — Train Defect Detection Model (YOLO26)")
    parser.add_argument("--download", action="store_true",
                        help="заново скачать датасеты Roboflow и пересобрать dataset/merged (удаляет текущий!)")
    parser.add_argument("--skip-download", action="store_true", help="(устарело) поведение по умолчанию")
    parser.add_argument("--data", type=str, default=str(DATASET_DIR / "merged" / "data.yaml"))
    parser.add_argument("--model", type=str, default="yolo26s.pt", help="базовая модель (default: yolo26s.pt)")
    parser.add_argument("--epochs", type=int, default=120, help="эпохи (default: 120)")
    parser.add_argument("--batch", type=int, default=16, help="batch (default: 16; -1 = auto по памяти GPU)")
    parser.add_argument("--imgsz", type=int, default=640, help="размер изображения (default: 640)")
    parser.add_argument("--device", type=str, default="0", help="'0' — первая GPU (fallback на cpu), 'cpu'")
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--patience", type=int, default=30, help="early stopping (эпох без улучшения)")
    parser.add_argument("--time", type=float, default=None, help="лимит обучения в часах (перекрывает epochs)")
    parser.add_argument("--fraction", type=float, default=1.0, help="доля train-выборки (раньше было 0.3)")
    parser.add_argument("--output", type=str, default=None, help="куда положить веса (default: models/defect_yolo26_best.pt)")
    parser.add_argument("--export", action="store_true", help="Export to ONNX after training")

    args = parser.parse_args()

    print("╔══════════════════════════════════════════════════════════╗")
    print("║     QazGost AI — Defect Detection Training (YOLO26)      ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"\n🕐 Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    data_yaml = Path(args.data)
    if args.download:
        downloaded = download_datasets()
        if downloaded:
            data_yaml, total = merge_datasets(downloaded)
            if total == 0:
                print("❌ No images in merged dataset!")
                sys.exit(1)
        else:
            print("❌ No datasets downloaded — using existing merged dataset")

    if not data_yaml.exists():
        print(f"❌ No dataset found at {data_yaml}. Run with --download first")
        sys.exit(1)
    print(f"📂 Dataset: {data_yaml}")

    model_path = train_model(
        data_yaml=data_yaml,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        base_model=args.model,
        device=args.device,
        workers=args.workers,
        patience=args.patience,
        time_h=args.time,
        fraction=args.fraction,
        output=args.output,
    )

    if model_path and args.export:
        export_model(model_path)

    print(f"\n🏁 Finished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()
