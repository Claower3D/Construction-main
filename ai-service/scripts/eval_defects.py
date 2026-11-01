#!/usr/bin/env python
"""
QazGost AI — оценка модели дефектов на val и подбор порога уверенности.

Запуск (из каталога ai-service):
    python scripts/eval_defects.py --weights models/defect_yolo26_best.pt --write-meta
    python scripts/eval_defects.py --weights models/defect_yolov8s_best.pt --device cpu --out /tmp/eval.json

Что делает:
  1. Создаёт «теневую» копию датасета в /tmp (жёсткие ссылки на фото + копии меток) и временный
     data.yaml с абсолютным путём — так ultralytics не перезаписывает отслеживаемые git файлы
     dataset/merged/labels/*.cache и не зависит от Windows-пути в исходном data.yaml.
  2. model.val(conf=0.001) → P, R, mAP50, mAP50-95 (общие и по классам).
  3. Порог conf — по максимуму среднего F1 (кривая F1 по порогам).
  4. Латентность predict() на одно фото (CPU/GPU — как указано в --device).
  5. --write-meta: сохраняет <веса>.meta.json — сервис берёт оттуда порог и метрики.
"""

import argparse
import glob
import json
import os
import shutil
import sys
import tempfile
import time
from pathlib import Path
from typing import Any, Dict, Optional

ROOT = Path(__file__).resolve().parent.parent  # ai-service/
DEFAULT_DATA = ROOT / "dataset" / "merged" / "data.yaml"


def make_data_yaml(src: Path) -> Path:
    """Temporary data.yaml pointing to a shadow dataset in /tmp (hardlinked images, copied labels)."""
    import yaml

    cfg = yaml.safe_load(src.read_text(encoding="utf-8"))
    real = src.parent.resolve()
    shadow = Path(tempfile.gettempdir()) / "qazgost_defects_shadow"
    for split in ("train", "val", "test"):
        for kind in ("images", "labels"):
            s_dir, d_dir = real / kind / split, shadow / kind / split
            if not s_dir.is_dir() or d_dir.is_dir():
                continue
            d_dir.mkdir(parents=True)
            for f in s_dir.iterdir():
                if not f.is_file():
                    continue
                try:
                    if kind == "images":
                        os.link(f, d_dir / f.name)
                    else:
                        shutil.copy2(f, d_dir / f.name)
                except OSError:
                    shutil.copy2(f, d_dir / f.name)
    cfg["path"] = str(shadow)
    tmp = Path(tempfile.gettempdir()) / "qazgost_defects_data.yaml"
    tmp.write_text(yaml.safe_dump(cfg, allow_unicode=True), encoding="utf-8")
    return tmp


def label_class_counts(labels_dir: Path, names: Dict[int, str]) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for f in labels_dir.glob("*.txt"):
        for line in f.read_text().splitlines():
            if line.strip():
                k = int(line.split()[0])
                name = names.get(k, str(k))
                counts[name] = counts.get(name, 0) + 1
    return counts


def evaluate(
    weights: str,
    data: str = str(DEFAULT_DATA),
    imgsz: int = 0,
    batch: int = 16,
    device: str = "cpu",
    bench: int = 30,
    write_meta: bool = False,
    out: Optional[str] = None,
) -> Dict[str, Any]:
    import numpy as np
    from ultralytics import YOLO

    data_yaml = make_data_yaml(Path(data))
    model = YOLO(weights)
    ckpt = getattr(model, "ckpt", None) or {}
    train_args = ckpt.get("train_args") or {}
    imgsz = imgsz or int(train_args.get("imgsz") or 640)
    m = model.val(
        data=str(data_yaml), split="val", imgsz=imgsz, batch=batch, conf=0.001, device=device,
        plots=False, verbose=False, project=tempfile.gettempdir(), name="qazgost_eval", exist_ok=True,
    )
    box = m.box
    names = {int(k): v for k, v in model.names.items()}

    f1_mean = box.f1_curve.mean(0)  # (1000,) по порогам px
    best_i = int(f1_mean.argmax())

    per_class = {}
    for j, ci in enumerate(box.ap_class_index):
        per_class[names[int(ci)]] = {
            "P": round(float(box.p[j]), 4), "R": round(float(box.r[j]), 4),
            "mAP50": round(float(box.ap50[j]), 4), "mAP50-95": round(float(box.ap[j]), 4),
        }

    def at(conf: float):
        k = int(np.abs(box.px - conf).argmin())
        return {"conf": conf, "P": round(float(box.p_curve[:, k].mean()), 4),
                "R": round(float(box.r_curve[:, k].mean()), 4), "F1": round(float(f1_mean[k]), 4)}

    val_images = sorted(glob.glob(str(Path(data).parent / "images" / "val" / "*")))
    latency = None
    if bench and val_images:
        files = val_images[:bench]
        model.predict(files[0], imgsz=imgsz, device=device, verbose=False)  # warm-up
        ts = []
        for f in files:
            t0 = time.perf_counter()
            model.predict(f, imgsz=imgsz, conf=0.25, device=device, verbose=False)
            ts.append((time.perf_counter() - t0) * 1000)
        latency = {"device": device, "images": len(ts), "mean_ms": round(float(np.mean(ts)), 1),
                   "p50_ms": round(float(np.median(ts)), 1), "p95_ms": round(float(np.percentile(ts, 95)), 1)}

    result = {
        "weights": Path(weights).name,
        "train_model": train_args.get("model"),
        "train_epochs_arg": train_args.get("epochs"),
        "train_time_h": train_args.get("time"),
        "imgsz": imgsz,
        "params": int(sum(p.numel() for p in model.model.parameters())),
        "val_images": len(val_images),
        "val_label_class_counts": label_class_counts(Path(data).parent / "labels" / "val", names),
        "P": round(float(box.mp), 4),
        "R": round(float(box.mr), 4),
        "mAP50": round(float(box.map50), 4),
        "mAP50-95": round(float(box.map), 4),
        "best_conf_by_f1": round(float(box.px[best_i]), 3),
        "best_f1": round(float(f1_mean[best_i]), 4),
        "operating_points": [at(c) for c in (0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7, 0.8)],
        "per_class": per_class,
        "speed_ms_per_img_val": {k: round(v, 1) for k, v in m.speed.items()},
        "latency_single_image": latency,
        "evaluated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    txt = json.dumps(result, ensure_ascii=False, indent=2)
    if out:
        Path(out).write_text(txt, encoding="utf-8")
    if write_meta:
        mp = Path(weights).with_suffix(".meta.json")
        mp.write_text(txt, encoding="utf-8")
        print(f"meta written: {mp}")
    return result


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--weights", default=str(ROOT / "models" / "defect_yolov8s_best.pt"))
    ap.add_argument("--data", default=str(DEFAULT_DATA))
    ap.add_argument("--imgsz", type=int, default=0, help="0 — как при обучении (train_args.imgsz)")
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--device", default="cpu")
    ap.add_argument("--bench", type=int, default=30, help="сколько val-фото прогнать по одному для замера латентности")
    ap.add_argument("--out", default=None, help="куда сохранить JSON с метриками")
    ap.add_argument("--write-meta", action="store_true", help="записать <веса>.meta.json (его читает сервис)")
    args = ap.parse_args()
    res = evaluate(args.weights, args.data, args.imgsz, args.batch, args.device, args.bench, args.write_meta, args.out)
    print(json.dumps(res, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
