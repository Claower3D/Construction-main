"""Готовит модель «человек в кадре» для сервера QazGost (go-backend/pkg/vision).

Сервер написан на Go и работает без Python и без onnxruntime, поэтому сеть YOLO26n (COCO, 80 классов)
переводится в простой собственный формат: список операций + веса подряд. Читает его pkg/vision/net.go.

Запуск (нужны ultralytics и onnx):
    python ai-service/scripts/export_people_model.py
Результат: go-backend/pkg/vision/coco320.qzm и эталон для теста testdata/reference.bin
"""
import json
import struct
import sys
from pathlib import Path

import numpy as np
import onnx
from onnx import numpy_helper

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "go-backend" / "pkg" / "vision"
SIZE = 320
# входы-параметры (целые числа): номер входа у операции
INT_INPUTS = {"Reshape": {1}, "Split": {1}, "Slice": {1, 2, 3, 4}, "Resize": {3}}
OPS = {"Conv", "Sigmoid", "Mul", "Add", "Sub", "Div", "Split", "Concat", "MaxPool", "Reshape",
       "Transpose", "MatMul", "Softmax", "Resize", "Slice"}


def export_onnx(dst: Path) -> Path:
    from ultralytics import YOLO
    model = YOLO("yolo26n.pt")
    try:
        path = model.export(format="onnx", imgsz=SIZE, simplify=True, end2end=False, opset=17)
    except Exception:
        path = model.export(format="onnx", imgsz=SIZE, simplify=True, opset=17)
    Path(path).replace(dst)
    return dst


def synthetic_input() -> np.ndarray:
    """Тот же рисунок строит тест на Go (vision/net_test.go) — без случайных чисел."""
    i = np.arange(3 * SIZE * SIZE, dtype=np.int64)
    return (((i * 7919 + (i // SIZE) * 104729) % 1000) / 999.0).astype(np.float32).reshape(1, 3, SIZE, SIZE)


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else export_onnx(Path("coco320.onnx"))
    graph = onnx.load(str(src)).graph
    floats, ints = {}, {}
    for t in graph.initializer:
        a = numpy_helper.to_array(t)
        if a.dtype == np.int64:
            ints[t.name] = [int(v) for v in a.reshape(-1)]
        else:
            floats[t.name] = a.astype(np.float32)

    nodes, used_floats = [], set()
    for n in graph.node:
        if n.op_type not in OPS:
            raise SystemExit(f"операция {n.op_type} не поддержана сервером")
        attrs = {}
        for a in n.attribute:
            if a.type == onnx.AttributeProto.INT:
                attrs[a.name] = int(a.i)
            elif a.type == onnx.AttributeProto.INTS:
                attrs[a.name] = [int(v) for v in a.ints]
            elif a.type == onnx.AttributeProto.FLOAT:
                attrs[a.name] = float(a.f)
            elif a.type == onnx.AttributeProto.STRING:
                attrs[a.name] = a.s.decode()
        ins = list(n.input)
        for k, name in enumerate(ins):
            if name in ints:
                if k not in INT_INPUTS.get(n.op_type, set()):
                    raise SystemExit(f"{n.op_type}: целочисленный вход {k} не ожидался")
                attrs[f"int{k}"] = ints[name]
                ins[k] = ""
            elif name in floats:
                if n.op_type == "Resize":
                    if k == 2:
                        attrs["scales"] = [float(v) for v in floats[name].reshape(-1)]
                    ins[k] = ""
                else:
                    used_floats.add(name)
        nodes.append({"op": n.op_type, "in": ins, "out": list(n.output), "attrs": attrs})

    blob, tensors, off = [], {}, 0
    for name in sorted(used_floats):
        a = floats[name]
        tensors[name] = {"dims": list(a.shape), "off": off, "len": int(a.size)}
        blob.append(a.reshape(-1).tobytes())
        off += int(a.size)
    header = json.dumps({
        "input": graph.input[0].name, "output": graph.output[0].name, "size": SIZE,
        "tensors": tensors, "nodes": nodes,
    }, ensure_ascii=False, separators=(",", ":")).encode()
    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / "coco320.qzm", "wb") as f:
        f.write(b"QZM1")
        f.write(struct.pack("<I", len(header)))
        f.write(header)
        f.write(b"".join(blob))
    print(f"coco320.qzm: {len(nodes)} операций, {off} чисел, {(OUT / 'coco320.qzm').stat().st_size / 1e6:.1f} МБ")

    # эталон: ответ настоящего onnxruntime на синтетический кадр (рамки и оценка «человек»)
    import onnxruntime as ort
    out = ort.InferenceSession(str(src), providers=["CPUExecutionProvider"]).run(None, {graph.input[0].name: synthetic_input()})[0][0]
    (OUT / "testdata").mkdir(exist_ok=True)
    out[:6].astype("<f4").tofile(OUT / "testdata" / "reference.bin")
    print("reference.bin:", out.shape, "макс. оценка человека", float(out[4].max()))


if __name__ == "__main__":
    main()
