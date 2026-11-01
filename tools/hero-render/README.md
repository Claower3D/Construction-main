# Рендер дома для первого экрана

Картинка `frontend/public/assets/landing/hero-house.webp` — 3D-рендер (Blender 5 / Cycles),
правая половина переходит в светящийся чертёж той же камеры.

```bash
python3.11 -m venv venv && venv/bin/pip install bpy numpy pillow
venv/bin/python house_scene.py /tmp/house 1600 128      # рендер и служебные проходы (~8 мин на 2 ядрах)
python3 compose.py /tmp/house hero-house.webp hero-house-m.webp
```

`compose.py` пишет `hero-house.json` с координатами точек для выносок —
их переносят в `frontend/src/components/HeroHouse.jsx` (`CALLOUTS`, `ASPECT`).
