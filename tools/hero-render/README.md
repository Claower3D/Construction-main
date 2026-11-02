# Рендер дома для первого экрана

Картинка `frontend/public/assets/landing/hero-house.webp` — 3D-рендер (Blender 5 / Cycles),
правая половина переходит в светящийся чертёж той же камеры.

```bash
python3.11 -m venv venv && venv/bin/pip install bpy numpy pillow
venv/bin/python house_scene.py /tmp/house 1920 160      # рендер, служебные проходы и рентген инженерии (~30 мин на 2 ядрах)
venv/bin/python house_scene.py /tmp/house 1920 16 meponly  # только слой инженерных систем (~15 с)
python3 compose.py /tmp/house hero-house.webp hero-house-m.webp
```

`compose.py` пишет `hero-house.json` с координатами точек для выносок —
их переносят в `frontend/src/components/HeroHouse.jsx` (`CALLOUTS`, `ASPECT`).

Инженерные системы (`SYSTEMS` в house_scene.py) моделируются трассами в метрах и в красивом
кадре скрыты; на чертеже видны «рентгеном»: электрика, холодная и горячая вода, отопление
с тёплым полом, канализация, газ, счётчики, щит, котёл. Цвета совпадают с легендой в HeroHouse.jsx.
