"""
Склейка первого экрана: слева — рендер дома, справа — светящийся
чертёж (линии из проходов нормалей/глубины/id той же камеры).
python compose.py <dir> <out.webp> <out_mobile.webp>
"""
import json
import sys

import numpy as np
from PIL import Image, ImageFilter

D = sys.argv[1]
OUT = sys.argv[2]
OUT_M = sys.argv[3]

beauty = np.asarray(Image.open(f'{D}/beauty.png').convert('RGB')).astype(np.float32) / 255
H, W = beauty.shape[:2]


def load16(name):
    im = Image.open(f'{D}/pass_{name}.png')
    a = np.asarray(im).astype(np.float32)
    return a / (65535.0 if a.max() > 255 else 255.0)


nrm = load16('normal')[..., :3]
dep = load16('depth')[..., 0]
oid = load16('id')[..., 0]
mask_obj = (nrm.sum(-1) > 0.01)


def grad(a):
    gx = np.zeros_like(a)
    gy = np.zeros_like(a)
    gx[:, 1:-1] = a[:, 2:] - a[:, :-2]
    gy[1:-1, :] = a[2:, :] - a[:-2, :]
    return np.hypot(gx, gy)


en = sum(grad(nrm[..., c]) for c in range(3))
ed = grad(np.log(np.clip(dep, 1e-4, 1)) )
ei = grad(oid)
edge = np.clip((en > 0.25) * 1.0 + (ed > 0.035) * 1.0 + (ei > 0.004) * 1.0, 0, 1)
# контур силуэта (объект/фон)
edge = np.maximum(edge, grad(mask_obj.astype(np.float32)) > 0.5)
edge_img = Image.fromarray((edge * 255).astype(np.uint8))
# утоньшаем двойные линии: лёгкий min-фильтр после размытия
line = np.asarray(edge_img.filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
line = np.clip(line * 1.6, 0, 1)
# там, где линий слишком густо (ламели), приглушаем, чтобы не было белого пятна
dens = np.asarray(edge_img.filter(ImageFilter.BoxBlur(9))).astype(np.float32) / 255
damp = 1 / (1 + np.clip(dens - 0.12, 0, None) * 9)
line = line * damp

glow1 = np.asarray(edge_img.filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255 * damp
glow2 = np.asarray(edge_img.filter(ImageFilter.GaussianBlur(10))).astype(np.float32) / 255 * damp

# сетка «земли» и тонкая сетка листа для чертёжной части
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
grid = (((xx % 48) < 1) | ((yy % 48) < 1)).astype(np.float32) * 0.06

# чертёжная половина: тёмный индиго + линии сирени
base = beauty * np.array([0.10, 0.08, 0.16]) + np.array([0.035, 0.025, 0.08])
lilac = np.array([0.80, 0.70, 1.0])
violet = np.array([0.55, 0.30, 1.0])
wire = base + grid[..., None] * violet
wire = wire + glow2[..., None] * violet * 1.3 + glow1[..., None] * violet * 1.2 + line[..., None] * lilac * 1.5
# окна в чертеже — лёгкая заливка там, где в рендере тёплый свет
warm = np.clip((beauty[..., 0] - beauty[..., 2]) * 2.2, 0, 1) * (beauty.mean(-1) > 0.35)
wire = wire + warm[..., None] * np.array([0.25, 0.14, 0.45]) * 0.6

# рентген инженерных систем: электрика, вода, отопление, канализация, газ
try:
    mep = np.asarray(Image.open(f'{D}/pass_mep.png').convert('RGBA')).astype(np.float32) / 255
    mep_rgb = mep[..., :3] * mep[..., 3:4]
except FileNotFoundError:
    mep_rgb = np.zeros_like(beauty)
def blur_rgb(a, r):
    return np.stack([np.asarray(Image.fromarray((a[..., c] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255 for c in range(3)], -1)
mep_glow = blur_rgb(mep_rgb, 5) * 1.1 + blur_rgb(mep_rgb, 16) * 0.7
# под трассами линии корпуса чуть приглушаем, чтобы инженерия читалась
mep_mask = np.clip(blur_rgb(mep_rgb, 3).max(-1) * 3, 0, 1)
wire = wire * (1 - 0.35 * mep_mask[..., None])
wire = wire + mep_glow + mep_rgb * 1.25

# узлы каркаса
meta = json.load(open(f'{D}/anchors.json'))
nodes_layer = np.zeros((H, W), np.float32)
for nx, ny in meta['nodes']:
    cx, cy = nx * W, ny * H
    r2 = (xx - cx) ** 2 + (yy - cy) ** 2
    nodes_layer = np.maximum(nodes_layer, np.exp(-r2 / (2 * 4.5 ** 2)))
wire = wire + nodes_layer[..., None] * np.array([1.0, 0.95, 1.0]) * 1.2

# переход: диагональ слева направо, слегка наклонённая
t = (xx / W - 0.47 - (yy / H - 0.5) * 0.10)
blend = np.clip((t + 0.06) / 0.16, 0, 1)
blend = blend * blend * (3 - 2 * blend)
img = beauty * (1 - blend[..., None]) + wire * blend[..., None]
# линии слегка проступают и на «фото» у стыка
img = img + line[..., None] * lilac * 0.25 * np.clip((t + 0.2) / 0.2, 0, 1)[..., None] * (1 - blend[..., None])
# светящаяся линия сканирования по стыку
scan = (np.exp(-(t ** 2) / (2 * 0.0025 ** 2)) * 0.22 + np.exp(-(t ** 2) / (2 * 0.018 ** 2)) * 0.08) * mask_obj.astype(np.float32)
img = img + scan[..., None] * np.array([0.75, 0.55, 1.0])

# мягкая виньетка к фону сайта (#0b0a1c)
bg = np.array([11, 10, 28], np.float32) / 255
vx = np.clip(np.minimum(xx / (W * 0.04), (W - xx) / (W * 0.04)), 0, 1)
vy = np.clip(np.minimum(yy / (H * 0.04), (H - yy) / (H * 0.18)), 0, 1)
v = (vx * vy) ** 0.8
img = img * v[..., None] + bg * (1 - v[..., None])

img = np.clip(img, 0, 1)
out = Image.fromarray((img * 255).astype(np.uint8))
# обрезаем пустое небо, газон и левый край: дом крупнее в кадре
X0, Y0, X1, Y1 = int(W * 0.10), int(H * 0.07), W, int(H * 0.84)
out = out.crop((X0, Y0, X1, Y1))
cw, ch = out.size
out.save(OUT, 'WEBP', quality=86, method=6)
out.resize((cw // 2, ch // 2), Image.LANCZOS).save(OUT_M, 'WEBP', quality=82, method=6)

# координаты выносок в долях итогового кадра
anch = {k: [round((v2[0] * W - X0) / cw, 4), round((v2[1] * H - Y0) / ch, 4)] for k, v2 in meta['anchors'].items()}
json.dump({'anchors': anch, 'aspect': round(cw / ch, 4), 'size': [cw, ch]}, open(OUT.rsplit('.', 1)[0] + '.json', 'w'), indent=1)
print('saved', out.size, anch, round(cw / ch, 4))
