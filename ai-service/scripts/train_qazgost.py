#!/usr/bin/env python3
"""
QazGost AI — обучение своей модели дефектов, полный цикл одной командой.

Запуск:  TRAIN_QAZGOST.bat  (или: python scripts/train_qazgost.py из каталога ai-service)

Что делает:
  1. Пишет, на чём идёт обучение (видеокарта или процессор).
  2. Собирает набор dataset/qazgost_v3:
       - трещины из dataset/merged (уже есть в проекте);
       - свои примеры из dataset/own (images/ + labels/ в формате YOLO), если папка есть;
       - открытые наборы других дефектов с Roboflow Universe (лицензия CC BY 4.0) — сколы,
         оголённая арматура, коррозия, высолы. Если скачать не удалось, обучение идёт без них,
         а в отчёте это написано.
  3. Обучает YOLO26: на видеокарте — две модели (n для камеры в телефоне, s для точного разбора фото),
     на процессоре — только n с ограничением по времени.
  4. Проверяет на отложенных фото, которых модель не видела, и пишет метрики по каждому классу.
  5. Экспортирует в ONNX 512 px для сайта/приложений.

Результаты: runs/qazgost_v3/REPORT.json, журнал runs/qazgost_v3/train_log.txt,
модели models/export/ (боевые файлы сайта и сервиса НЕ перезаписываются — их ставят после проверки).

Параметры:
  --hours 8        лимит времени на процессоре (часов)
  --no-download    не скачивать открытые наборы
  --resume         продолжить прерванное обучение
  --models a,b     какие модели учить (по умолчанию: yolo26n.pt,yolo26s.pt на видеокарте; yolo26n.pt на процессоре)
  --smoke          быстрая проверка, что всё запускается (минута, без пользы для качества)
"""
import argparse
import hashlib
import json
import os
import random
import re
import shutil
import sys
import time
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATASET = ROOT / "dataset"
MERGED = DATASET / "merged"
OWN = DATASET / "own"
EXTRA_RAW = DATASET / "extra_raw"
BUILD = DATASET / "qazgost_v3"
RUNS = ROOT / "runs"
RUN_NAME = "qazgost_v3"
RUN_DIR = RUNS / RUN_NAME
EXPORT = ROOT / "models" / "export"

# Единые классы модели. Индекс 0 — трещина: сайт и приложения уже читают его.
# Первые шесть — как в v2 (на них же размечаются свои примеры с сайта); дальше — новые виды v3.
CLASS_NAMES = ["crack", "corrosion", "spalling", "efflorescence", "exposed_rebar", "stain", "pothole", "peeling", "mold", "knot"]
CLASS_RU = ["трещина", "коррозия", "скол / отслоение", "высолы", "оголённая арматура", "пятно / протечка",
            "выбоина", "отслоение отделки", "плесень", "сучок (дерево)"]
IGNORE = -1  # метка не наш дефект (кирпич, окно, смола…): её пропускаем, фото оставляем

# Как называются классы в чужих наборах → наш индекс. Чего здесь нет — не берём.
SYNONYMS = {
    0: ["crack", "cracks", "crack detection", "corrosion crack", "alligator crack", "acrack", "трещина"],
    1: ["corrosion", "rust", "ruststrain", "rust stain", "corrosion stain", "rebar rust", "corrosion corrosion"],
    2: ["spalling", "spall", "spall defect", "scaling", "spallation", "break", "delamination"],
    3: ["efflorescence"],
    4: ["exposed rebar", "exposed rebars", "exposed reinforcement", "rebar exposure", "exposedrebars", "rebar"],
    5: ["stain", "water stain", "wetspot", "wet spot", "leak"],
}

# Открытые наборы Roboflow Universe, на страницах которых указана лицензия CC BY 4.0
# (можно использовать в коммерческом продукте с указанием источника — см. ai-service/DATA_SOURCES.md).
# Третье поле — материал: одна общая база по бетону, кирпичу, асфальту, плитке, дереву, отделке, металлу.
EXTRA_DATASETS = [
    ("defect-detection-edbnh", "concrete-merge-632p6", "бетон"),
    ("defect-detection-0atjo", "concrete-defect-detection-zuym8", "бетон"),
    ("rebar-exposure-and-spalling", "aperi", "бетон"),
    ("new-workspace-yur70", "concrete_defect", "бетон"),
    # кирпич и кладка (в т.ч. ступенчатые трещины по швам)
    ("brick-detection-in-a-brick-wall", "masonry-hzess", "кирпич"),
    ("student-from-uminho", "crack-detection-brick", "кирпич"),
    ("bharati-vidhypeeth-college-of-engineering-pune", "brick-crack-detection-2", "кирпич"),
    ("buildscan", "buildscandamagedetection", "кирпич"),
    ("assess-mortar-cracks-by-using-image-and-machine-learning", "masonry-2-instance", "кирпич"),
    # асфальт: трещины и выбоины
    ("btp-project-l7tdo", "pothole-detection-bz8co", "асфальт"),
    ("vignesh-waran-wup7f", "road-cracks-detection-sinws", "асфальт"),
    ("own-data-label", "road-crack-detection-and-classification", "асфальт"),
    ("pothole-detection-zyupq", "pothole-and-crack-detection", "асфальт"),
    ("tsuisl", "pothole-detection-636sr", "асфальт"),
    ("road-crack-project", "road-crack-detection-combined-dataset", "асфальт"),
    # плитка и керамика
    ("manendrasinh", "tiles-defect-detection-pssvq", "плитка"),
    ("ceramic", "ceramic-defect-detection", "плитка"),
    # дерево
    ("omar-r6wdo", "wood-surface-defects-xzowk", "дерево"),
    ("detect-detect", "new-defects-in-wood", "дерево"),
    ("tunku-abdul-rahman-university-of-management-and-technology-ttt1n", "wood-defects-8lcdv", "дерево"),
    ("wood-detection-omca6", "detect-defect-of-wooden", "дерево"),
    # стены и отделка: отслоение краски, плесень, протечки
    ("technical-university-of-crete", "dipl-td5ld", "отделка"),
    ("elaas-workspace", "wall-defect-7fdkt-jpjpa", "отделка"),
    ("cuhk-ldjub", "indoor_apartment_defects", "отделка"),
    ("fardas-workspace", "peeling-paint-project", "отделка"),
    # металл
    ("corrosion-project", "rust-detection-final", "металл"),
]
REPEAT = {"кирпич": 2}   # фото кладки мало по сравнению с бетоном — в обучении каждое идёт дважды
VAL_SHARE = 0.3          # из чужих частей valid/test в проверку идёт 30%, остальное — в обучение
MAX_TRAIN_PER_SET = 2500  # чтобы один большой набор (дерево, дороги) не задавил остальные
MAX_VAL_PER_SET = 500

IMG_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


class Tee:
    """Печатает в консоль и в файл журнала одновременно."""

    def __init__(self, path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.f = open(path, "a", encoding="utf-8", buffering=1)
        self.out = sys.stdout

    def write(self, s):
        try:
            self.out.write(s)
        except Exception:
            pass
        self.f.write(s)

    def flush(self):
        try:
            self.out.flush()
        except Exception:
            pass
        self.f.flush()


def norm_name(s):
    return re.sub(r"\s+", " ", re.sub(r"[-_]+", " ", str(s).strip().lower()))


def class_index(name):
    n = norm_name(name)
    for idx, names in SYNONYMS.items():
        if n in names:
            return idx
    return None


def has(n, *words):
    return any(w in n for w in words)


def map_class(name):
    """Название класса чужого набора → наш индекс, IGNORE (метку пропустить) или None (класс непонятен:
    фото с такой меткой в обучение не берём, иначе настоящий дефект попал бы в «чистый фон»)."""
    n = norm_name(name)
    idx = class_index(name)
    if idx is not None:
        return idx
    if n in ("unlabeled", "background", "images", "object", "normal", "good") or has(n, "no defect", "no crack", "non corroded", "no corrosion"):
        return IGNORE
    if has(n, "knot"):
        return 9
    if has(n, "crack", "retak", "crocodile", "alligator", "longitudinal", "transverse", "fissure"):
        return 0
    if has(n, "pothole", "pot hole", "lubang"):
        return 6
    if has(n, "rust", "corros"):
        return 1
    if has(n, "rebar", "reinforcement"):
        return 4
    if has(n, "efflorescence"):
        return 3
    if has(n, "peel", "paint", "blister", "tile delamination", "glaze detachment", "glazedetachment"):
        return 7
    if has(n, "mold", "mould", "algae", "moss"):
        return 8
    if has(n, "blue stain"):
        return None
    if has(n, "stain", "seepage", "damp", "leak", "wetspot", "wet spot", "moist", "water"):
        return 5
    if has(n, "spall", "scaling", "chip", "broken", "brick damage", "delamination"):
        return 2
    # не дефекты и то, чего у нас нет: метку пропускаем, фото остаётся
    if has(n, "brick", "window", "plant", "marrow", "resin", "quartzity", "overgrown", "hole", "glaze", "scratch",
           "wiring", "electrical", "patch", "settlement", "other corruption"):
        return IGNORE
    return None


def status(report, stage, **extra):
    report["stage"] = stage
    report["updated"] = datetime.now().isoformat(timespec="seconds")
    report.update(extra)
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    (RUN_DIR / "REPORT.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")


def to_box_line(parts, cls):
    """Строка разметки YOLO (рамка или многоугольник) → рамка 'cls cx cy w h'. None, если строка плохая."""
    try:
        v = [float(x) for x in parts]
    except ValueError:
        return None
    if len(v) == 4:
        cx, cy, w, h = v
    elif len(v) >= 6 and len(v) % 2 == 0:
        xs, ys = v[0::2], v[1::2]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        cx, cy, w, h = (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0
    else:
        return None
    x0, x1 = max(0.0, cx - w / 2), min(1.0, cx + w / 2)
    y0, y1 = max(0.0, cy - h / 2), min(1.0, cy + h / 2)
    w, h = x1 - x0, y1 - y0
    if w <= 0.002 or h <= 0.002:
        return None
    return f"{cls} {(x0 + x1) / 2:.6f} {(y0 + y1) / 2:.6f} {w:.6f} {h:.6f}"


def val_bucket(stem):
    """Постоянное (не случайное) деление: одно и то же исходное фото всегда попадает в одну часть."""
    base = stem.split(".rf.")[0]
    return int(hashlib.md5(base.encode("utf-8")).hexdigest()[:8], 16) / 0xFFFFFFFF < VAL_SHARE


def add_source(tag, img_dir, lbl_dir, split, cmap, counts, limit=None, files=None, strict=False):
    """Копирует фото и разметку одного источника в общий набор. cmap: индекс класса источника → наш индекс."""
    if files is None:
        if not img_dir.is_dir():
            return 0
        files = sorted(p for p in img_dir.iterdir() if p.suffix.lower() in IMG_EXT)
    if limit:
        files = list(files)
        random.Random(7).shuffle(files)
        files = files[:limit]
    n = 0
    for img in files:
        lines = []
        drop = False
        lbl = lbl_dir / (img.stem + ".txt")
        if lbl.is_file():
            for raw in lbl.read_text(encoding="utf-8", errors="ignore").splitlines():
                parts = raw.split()
                if len(parts) < 5:
                    continue
                try:
                    src_cls = int(float(parts[0]))
                except ValueError:
                    continue
                cls = cmap.get(src_cls)
                if cls is None:
                    if strict:
                        drop = True
                        break
                    continue
                if cls == IGNORE:
                    continue
                line = to_box_line(parts[1:], cls)
                if line:
                    lines.append(line)
        if drop:
            continue
        for ln in lines:
            counts[split][int(ln.split()[0])] += 1
        name = f"{tag}_{img.stem}"[:150]
        dst_img = BUILD / "images" / split / (name + img.suffix.lower())
        try:
            os.link(img, dst_img)  # жёсткая ссылка: быстро и без лишнего места
        except OSError:
            shutil.copy2(img, dst_img)
        (BUILD / "labels" / split / (name + ".txt")).write_text("\n".join(lines), encoding="utf-8")
        n += 1
    return n


def read_names(yaml_path):
    import yaml
    try:
        d = yaml.safe_load(yaml_path.read_text(encoding="utf-8", errors="ignore")) or {}
    except Exception:
        return []
    names = d.get("names") or []
    if isinstance(names, dict):
        names = [names[k] for k in sorted(names)]
    return [str(x) for x in names]


def download_extra(report):
    """Скачивает открытые наборы. Возвращает [(tag, путь, cmap)]. Любая ошибка — пропускаем набор."""
    got = []
    try:
        from roboflow import Roboflow
    except ImportError:
        report["extra_note"] = "пакет roboflow не установлен — открытые наборы не скачаны"
        print("! Пакет roboflow не установлен — открытые наборы пропущены.")
        return got
    key = os.getenv("ROBOFLOW_API_KEY", "")
    if not key:
        try:  # ключ проекта, уже прописанный в scripts/train_defects.py
            sys.path.insert(0, str(Path(__file__).resolve().parent))
            from train_defects import RF_API_KEY as key  # noqa: N811
        except Exception:
            key = ""
    if not key:
        report["extra_note"] = "нет ключа Roboflow (переменная ROBOFLOW_API_KEY) — открытые наборы не скачаны"
        print("! Нет ключа Roboflow — открытые наборы пропущены.")
        return got
    try:
        rf = Roboflow(api_key=key)
    except Exception as e:
        report["extra_note"] = f"Roboflow недоступен: {str(e)[:120]}"
        print(f"! Roboflow недоступен: {e}")
        return got
    EXTRA_RAW.mkdir(parents=True, exist_ok=True)
    for i, (ws, pj, mode) in enumerate(EXTRA_DATASETS):
        tag = f"x{i}"
        dst = EXTRA_RAW / f"{ws}__{pj}"
        entry = {"source": f"https://universe.roboflow.com/{ws}/{pj}", "license": "CC BY 4.0"}
        try:
            if not (dst / "data.yaml").is_file():
                print(f"\n== Скачиваю {ws}/{pj} ...")
                project = rf.workspace(ws).project(pj)
                versions = project.versions()
                if not versions:
                    raise RuntimeError("у набора нет опубликованных версий")
                ver = max(versions, key=lambda v: int(str(getattr(v, "version", "0")).split("/")[-1] or 0))
                ver.download("yolov8", location=str(dst))
            names = read_names(dst / "data.yaml")
            cmap = {j: map_class(n) for j, n in enumerate(names)}
            cmap = {j: c for j, c in cmap.items() if c is not None}
            if not any(c != IGNORE for c in cmap.values()) and len(names) == 1:
                # единственный класс назван «0» или «object» — смотрим на название набора
                pn = norm_name(pj)
                if "crack" in pn:
                    cmap = {0: 0}
                elif "rust" in pn or "corros" in pn:
                    cmap = {0: 1}
            if not any(c != IGNORE for c in cmap.values()):
                raise RuntimeError(f"нет подходящих классов среди {names}")
            entry["material"] = mode
            entry["classes_used"] = {names[j]: CLASS_NAMES[c] for j, c in cmap.items() if c != IGNORE}
            entry["classes_ignored"] = [names[j] for j, c in cmap.items() if c == IGNORE]
            entry["classes_unknown_photos_dropped"] = [n for j, n in enumerate(names) if j not in cmap]
            got.append((tag, dst, cmap, mode))
            entry["ok"] = True
        except Exception as e:
            entry["ok"] = False
            entry["error"] = str(e)[:200]
            print(f"! {ws}/{pj}: не удалось — {e}")
        report.setdefault("extra_datasets", []).append(entry)
    return got


def build_dataset(report, extra, smoke=False):
    if BUILD.exists():
        shutil.rmtree(BUILD)
    for split in ("train", "val"):
        (BUILD / "images" / split).mkdir(parents=True)
        (BUILD / "labels" / split).mkdir(parents=True)
    counts = {s: [0] * len(CLASS_NAMES) for s in ("train", "val")}
    images = {"train": 0, "val": 0}

    # 1. трещины, уже собранные в проекте (класс 0)
    lim = {"train": 80, "val": 24} if smoke else {"train": None, "val": None}
    for split in ("train", "val"):
        images[split] += add_source("crk", MERGED / "images" / split, MERGED / "labels" / split, split, {0: 0}, counts, lim[split])

    # 2. свои примеры: dataset/own/images + dataset/own/labels (классы — как в CLASS_NAMES); каждое 7-е фото — в проверку
    if (OWN / "images").is_dir():
        own_imgs = sorted(p for p in (OWN / "images").iterdir() if p.suffix.lower() in IMG_EXT)
        ident = {i: i for i in range(len(CLASS_NAMES))}
        for split, files in (("val", own_imgs[6::7]), ("train", [p for k, p in enumerate(own_imgs) if k % 7 != 6])):
            images[split] += add_source("own", OWN / "images", OWN / "labels", split, ident, counts, files=files)
        report["own_images"] = len(own_imgs)

    # 3. открытые наборы других дефектов
    if not smoke:
        for tag, path, cmap, mode in extra:
            reps = REPEAT.get(mode, 1)
            n_before = dict(images)
            tr_dir = path / "train" / "images"
            tr_files = sorted(p for p in tr_dir.iterdir() if p.suffix.lower() in IMG_EXT) if tr_dir.is_dir() else []
            random.Random(7).shuffle(tr_files)
            tr_files = tr_files[:MAX_TRAIN_PER_SET]
            for r in range(reps):
                rtag = tag if r == 0 else f"{tag}r{r}"
                images["train"] += add_source(rtag, tr_dir, path / "train" / "labels", "train", cmap, counts, files=tr_files, strict=True)
            room = max(0, MAX_TRAIN_PER_SET - len(tr_files))
            val_room = MAX_VAL_PER_SET
            # В чужих наборах части valid/test бывают больше обучающей. Они не содержат размноженных
            # копий обучающих фото, поэтому большую долю можно отдать в обучение без подглядывания.
            for src_split in ("valid", "test"):
                d = path / src_split / "images"
                if not d.is_dir():
                    continue
                files = sorted(p for p in d.iterdir() if p.suffix.lower() in IMG_EXT)
                to_val = [p for p in files if val_bucket(p.stem)][:val_room]
                to_train = [p for p in files if not val_bucket(p.stem)][:room]
                val_room -= len(to_val)
                room -= len(to_train)
                images["val"] += add_source(tag, d, path / src_split / "labels", "val", cmap, counts, files=to_val, strict=True)
                for r in range(reps):
                    rtag = tag if r == 0 else f"{tag}r{r}"
                    images["train"] += add_source(rtag, d, path / src_split / "labels", "train", cmap, counts, files=to_train, strict=True)
            report.setdefault("by_material", {}).setdefault(mode, {"train": 0, "val": 0})
            report["by_material"][mode]["train"] += images["train"] - n_before["train"]
            report["by_material"][mode]["val"] += images["val"] - n_before["val"]

    yaml_text = "path: " + str(BUILD).replace("\\", "/") + "\ntrain: images/train\nval: images/val\nnc: %d\nnames:\n" % len(CLASS_NAMES)
    yaml_text += "".join(f"  {i}: {n}\n" for i, n in enumerate(CLASS_NAMES))
    (BUILD / "data.yaml").write_text(yaml_text, encoding="utf-8")
    report["dataset"] = {
        "images": images,
        "labels_train": dict(zip(CLASS_NAMES, counts["train"])),
        "labels_val": dict(zip(CLASS_NAMES, counts["val"])),
    }
    print("\n== Набор собран:", json.dumps(report["dataset"], ensure_ascii=False))
    if images["train"] == 0 or images["val"] == 0:
        raise SystemExit("В наборе нет фото: проверьте папку dataset/merged")
    return BUILD / "data.yaml"


def train_one(weights, data_yaml, device, args, report):
    from ultralytics import YOLO
    tag = Path(weights).stem  # yolo26n / yolo26s
    name = f"{RUN_NAME}/{tag}"
    last = RUNS / name / "weights" / "last.pt"
    gpu = device != "cpu"
    if args.resume and last.is_file():
        print(f"\n== Продолжаю обучение {tag} с {last}")
        model = YOLO(str(last))
        model.train(resume=True)
    else:
        prev = EXPORT / f"qazgost_defects_{tag}.pt"
        if prev.is_file() and not args.smoke and not args.fresh:
            # дообучение: начинаем с весов прошлой версии своей модели, а не с нуля
            keep = EXPORT / f"qazgost_defects_{tag}_prev.pt"
            shutil.copy2(prev, keep)
            print(f"\n== {tag}: дообучение от прошлой версии ({prev.name})")
            report.setdefault("started_from", {})[tag] = prev.name
            model = YOLO(str(keep))
        else:
            model = YOLO(weights)
        kw = dict(
            data=str(data_yaml), project=str(RUNS), name=name, exist_ok=True, device=device,
            patience=30, cos_lr=True, close_mosaic=10, plots=True, verbose=True, seed=0,
        )
        if args.smoke:
            kw.update(epochs=1, imgsz=256, batch=8, workers=0, plots=False)
        elif gpu:
            kw.update(epochs=80, imgsz=640, batch=-1, workers=4, patience=20)
        else:
            cpus = os.cpu_count() or 2
            kw.update(epochs=100, imgsz=512, batch=16, workers=min(4, max(1, cpus // 2)), time=args.hours)
        print(f"\n== Обучение {tag}: " + ", ".join(f"{k}={v}" for k, v in kw.items() if k in ("epochs", "imgsz", "batch", "device", "time")))
        model.train(**kw)
    best = RUNS / name / "weights" / "best.pt"
    if not best.is_file():
        raise RuntimeError(f"нет файла {best}")

    # Проверка на отложенных фото
    model = YOLO(str(best))
    imgsz = 256 if args.smoke else (640 if gpu else 512)
    m = model.val(data=str(data_yaml), imgsz=imgsz, device=device, plots=False, verbose=False, workers=0)
    per_class = {}
    try:
        for j, ci in enumerate(m.box.ap_class_index):
            per_class[CLASS_NAMES[int(ci)]] = {
                "precision": round(float(m.box.p[j]), 3), "recall": round(float(m.box.r[j]), 3), "mAP50": round(float(m.box.ap50[j]), 3),
            }
    except Exception as e:  # форма метрик может отличаться в другой версии библиотеки
        per_class = {"error": str(e)[:120]}
    metrics = {
        "precision": round(float(m.box.mp), 3), "recall": round(float(m.box.mr), 3),
        "mAP50": round(float(m.box.map50), 3), "mAP50_95": round(float(m.box.map), 3), "per_class": per_class,
    }

    # Экспорт для сайта и приложений: ONNX 512, «сырой» выход [1, 4+классы, 5376]
    EXPORT.mkdir(parents=True, exist_ok=True)
    onnx_path = None
    try:
        try:
            onnx_path = model.export(format="onnx", imgsz=512, simplify=True, end2end=False)
        except Exception:  # в новых версиях библиотеки параметр может называться иначе
            onnx_path = model.export(format="onnx", imgsz=512, simplify=True)
        dst = EXPORT / f"qazgost-defects-{tag[-1]}-512.onnx"
        shutil.copy2(onnx_path, dst)
        onnx_path = dst
        try:  # сайт ждёт выход [1, 4 + число классов, 5376]
            import onnxruntime as ort
            shape = ort.InferenceSession(str(dst), providers=["CPUExecutionProvider"]).get_outputs()[0].shape
            report.setdefault("onnx_shapes", {})[tag] = list(shape)
            if list(shape) != [1, 4 + len(CLASS_NAMES), 5376]:
                print(f"! Выход ONNX {shape} отличается от ожидаемого сайтом [1, {4 + len(CLASS_NAMES)}, 5376]")
        except Exception as e:
            print(f"  (форму выхода ONNX проверить не удалось: {e})")
    except Exception as e:
        print(f"! Экспорт ONNX не удался: {e}")
    shutil.copy2(best, EXPORT / f"qazgost_defects_{tag}.pt")
    out = {"weights": str(EXPORT / f"qazgost_defects_{tag}.pt"), "onnx": str(onnx_path) if onnx_path else None, "val": metrics}
    report.setdefault("models", {})[tag] = out
    print(f"\n== {tag}: точность {metrics['precision']}, полнота {metrics['recall']}, mAP50 {metrics['mAP50']}")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hours", type=float, default=8.0)
    ap.add_argument("--no-download", action="store_true")
    ap.add_argument("--resume", action="store_true")
    ap.add_argument("--models", type=str, default="")
    ap.add_argument("--smoke", action="store_true")
    ap.add_argument("--fresh", action="store_true", help="не дообучать прошлую версию, а учить с нуля")
    args = ap.parse_args()

    RUN_DIR.mkdir(parents=True, exist_ok=True)
    sys.stdout = Tee(RUN_DIR / "train_log.txt")
    sys.stderr = sys.stdout
    t0 = time.time()
    report = {"started": datetime.now().isoformat(timespec="seconds"), "classes": CLASS_NAMES, "classes_ru": CLASS_RU, "smoke": args.smoke}

    import torch
    gpu = torch.cuda.is_available()
    device = "0" if gpu else "cpu"
    report["device"] = torch.cuda.get_device_name(0) if gpu else f"процессор ({os.cpu_count()} ядер)"
    if gpu:
        report["gpu_memory_gb"] = round(torch.cuda.get_device_properties(0).total_memory / 2**30, 1)
    print(f"== Устройство: {report['device']}; torch {torch.__version__}")
    if not gpu:
        print(f"   Видеокарта не используется — обучение на процессоре, лимит {args.hours} ч. Качество будет ниже.")
    status(report, "сбор набора")

    extra = [] if (args.no_download or args.smoke) else download_extra(report)
    data_yaml = build_dataset(report, extra, smoke=args.smoke)
    status(report, "обучение")

    models = [m.strip() for m in args.models.split(",") if m.strip()] or (["yolo26n.pt", "yolo26s.pt"] if gpu and not args.smoke else ["yolo26n.pt"])
    for w in models:
        try:
            train_one(w, data_yaml, device, args, report)
        except Exception as e:
            report.setdefault("errors", []).append(f"{w}: {str(e)[:300]}")
            print(f"! Обучение {w} не завершилось: {e}")
        status(report, f"обучена {Path(w).stem}")

    report["minutes"] = round((time.time() - t0) / 60, 1)
    ok = bool(report.get("models"))
    status(report, "готово" if ok else "ошибка", finished=datetime.now().isoformat(timespec="seconds"))
    print("\n" + "=" * 62)
    print("ГОТОВО." if ok else "НЕ УДАЛОСЬ ОБУЧИТЬ НИ ОДНОЙ МОДЕЛИ.", f"Отчёт: {RUN_DIR / 'REPORT.json'}")
    print("Модели: models/export/. Боевые файлы сайта не тронуты — их заменяют после проверки.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
