"""
Сцена современного дома для первого экрана QazGost.
Рендер в Blender (bpy + Cycles): «красивый» кадр + служебные проходы
(нормали, глубина, id объектов) для чертёжных линий с той же камеры.

Запуск: python house_scene.py <out_dir> <width> <samples> [preview]
"""
import json
import math
import os
import random
import sys

import bpy
import bmesh
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/house'
WIDTH = int(sys.argv[2]) if len(sys.argv) > 2 else 1600
SAMPLES = int(sys.argv[3]) if len(sys.argv) > 3 else 96
PREVIEW = len(sys.argv) > 4 and sys.argv[4] == 'preview'
HEIGHT = int(WIDTH * 0.72)
os.makedirs(OUT, exist_ok=True)
random.seed(7)

# ── чистая сцена ──
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.render.resolution_x = WIDTH
scene.render.resolution_y = HEIGHT
scene.render.resolution_percentage = 100

FACADE = []  # объекты, которые попадут в чертёж (не деревья, не небо)


# ── материалы ──
def principled(name, color, rough=0.5, metal=0.0, **kw):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    for k, v in kw.items():
        b.inputs[k].default_value = v
    return m


def emissive(name, color, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    e = nt.nodes.new('ShaderNodeEmission')
    e.inputs['Color'].default_value = (*color, 1)
    e.inputs['Strength'].default_value = strength
    o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(e.outputs[0], o.inputs[0])
    return m


def textured(name, c1, c2, scale, rough, kind='noise', bump=0.15, stretch=(1, 1, 1)):
    """Материал с процедурной фактурой: штукатурка, бетон, дерево, газон."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = stretch
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    if kind == 'wave':
        t = nt.nodes.new('ShaderNodeTexWave')
        t.inputs['Scale'].default_value = scale
        t.inputs['Distortion'].default_value = 6
        t.inputs['Detail'].default_value = 4
        t.bands_direction = 'Z'
    else:
        t = nt.nodes.new('ShaderNodeTexNoise')
        t.inputs['Scale'].default_value = scale
        t.inputs['Detail'].default_value = 10
        t.inputs['Roughness'].default_value = 0.6
    nt.links.new(mp.outputs[0], t.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (*c1, 1)
    ramp.color_ramp.elements[1].color = (*c2, 1)
    nt.links.new(t.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    bp = nt.nodes.new('ShaderNodeBump')
    bp.inputs['Strength'].default_value = bump
    bp.inputs['Distance'].default_value = 0.02
    nt.links.new(t.outputs['Fac'], bp.inputs['Height'])
    nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m


M = {
    'stucco': textured('stucco', (0.80, 0.78, 0.75), (0.88, 0.87, 0.84), 40, 0.75, bump=0.05),
    'concrete': textured('concrete', (0.42, 0.41, 0.40), (0.55, 0.54, 0.52), 9, 0.8, bump=0.08),
    'charcoal': principled('charcoal', (0.035, 0.036, 0.04), 0.45),
    'frame': principled('frame', (0.02, 0.02, 0.022), 0.3, 0.6),
    'wood': textured('wood', (0.22, 0.10, 0.04), (0.42, 0.21, 0.09), 3.5, 0.55, kind='wave', bump=0.08, stretch=(1, 1, 0.08)),
    'glass': principled('glass', (0.9, 0.93, 0.95), 0.02, **{'Transmission Weight': 1.0, 'IOR': 1.45}),
    'railglass': principled('railglass', (0.8, 0.88, 0.92), 0.05, **{'Transmission Weight': 1.0, 'IOR': 1.3}),
    'paving': textured('paving', (0.36, 0.35, 0.34), (0.46, 0.45, 0.43), 6, 0.35, bump=0.04),
    'lawn': textured('lawn', (0.015, 0.035, 0.012), (0.03, 0.07, 0.02), 60, 0.9, bump=0.4),
    'soil': principled('soil', (0.025, 0.02, 0.015), 0.95),
    'leaf': textured('leaf', (0.01, 0.03, 0.012), (0.03, 0.08, 0.025), 14, 0.7, bump=0.6),
    'bark': principled('bark', (0.05, 0.035, 0.025), 0.9),
    'intwall': principled('intwall', (0.62, 0.52, 0.42), 0.8),
    'intfloor': textured('intfloor', (0.30, 0.17, 0.08), (0.45, 0.27, 0.13), 2.5, 0.35, kind='wave', bump=0.02, stretch=(1, 0.2, 1)),
    'sofa': principled('sofa', (0.55, 0.50, 0.44), 0.9),
    'dark': principled('dark', (0.05, 0.045, 0.04), 0.6),
    'lamp': emissive('lamp', (1.0, 0.72, 0.42), 14),
    'strip': emissive('strip', (1.0, 0.74, 0.45), 5),
    'water': principled('water', (0.02, 0.05, 0.07), 0.02, **{'Transmission Weight': 0.0}),
}


# ── примитивы ──
def box(name, x0, x1, y0, y1, z0, z1, mat, facade=True, bevel=0.0):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x = x0 + (v.co.x + 0.5) * (x1 - x0)
        v.co.y = y0 + (v.co.y + 0.5) * (y1 - y0)
        v.co.z = z0 + (v.co.z + 0.5) * (z1 - z0)
    bm.to_mesh(mesh)
    bm.free()
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat)
    if bevel:
        md = ob.modifiers.new('bev', 'BEVEL')
        md.width = bevel
        md.segments = 2
        md.limit_method = 'ANGLE'
    if facade:
        FACADE.append(ob)
    return ob


def ico(name, loc, radius, mat, scale=(1, 1, 1), sub=3, disp=0.0, facade=False):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=radius)
    bm.to_mesh(mesh)
    bm.free()
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(ob)
    ob.location = loc
    ob.scale = scale
    ob.data.materials.append(mat)
    for p in ob.data.polygons:
        p.use_smooth = True
    if disp:
        tex = bpy.data.textures.new(name + 't', 'CLOUDS')
        tex.noise_scale = 0.35
        md = ob.modifiers.new('d', 'DISPLACE')
        md.texture = tex
        md.strength = disp
    if facade:
        FACADE.append(ob)
    return ob


def cyl(name, loc, r, h, mat, facade=False):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=r, radius2=r * 0.7, depth=h)
    bm.to_mesh(mesh)
    bm.free()
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(ob)
    ob.location = (loc[0], loc[1], loc[2] + h / 2)
    ob.data.materials.append(mat)
    if facade:
        FACADE.append(ob)
    return ob


def glazing(prefix, axis, a0, a1, fixed, z0, z1, n, mullion_mat=M['frame']):
    """Остекление с импостами. axis='x' — фасад вдоль X на y=fixed; 'y' — на x=fixed."""
    t = 0.04
    if axis == 'x':
        box(prefix + 'g', a0, a1, fixed - 0.01, fixed + 0.01, z0, z1, M['glass'])
        box(prefix + 'fb', a0, a1, fixed - 0.06, fixed + 0.06, z0 - 0.06, z0, mullion_mat)
        box(prefix + 'ft', a0, a1, fixed - 0.06, fixed + 0.06, z1, z1 + 0.06, mullion_mat)
        for i in range(n + 1):
            x = a0 + (a1 - a0) * i / n
            box(f'{prefix}m{i}', x - t, x + t, fixed - 0.06, fixed + 0.06, z0, z1, mullion_mat)
    else:
        box(prefix + 'g', fixed - 0.01, fixed + 0.01, a0, a1, z0, z1, M['glass'])
        box(prefix + 'fb', fixed - 0.06, fixed + 0.06, a0, a1, z0 - 0.06, z0, mullion_mat)
        box(prefix + 'ft', fixed - 0.06, fixed + 0.06, a0, a1, z1, z1 + 0.06, mullion_mat)
        for i in range(n + 1):
            y = a0 + (a1 - a0) * i / n
            box(f'{prefix}m{i}', fixed - 0.06, fixed + 0.06, y - t, y + t, z0, z1, mullion_mat)


def area_light(name, loc, size, power, color=(1.0, 0.72, 0.45), rot=(0, 0, 0)):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.shape = 'RECTANGLE'
    ld.size, ld.size_y = size
    ld.energy = power
    ld.color = color
    ob = bpy.data.objects.new(name, ld)
    ob.location = loc
    ob.rotation_euler = rot
    bpy.context.collection.objects.link(ob)
    return ob


def spot(name, loc, power, angle_deg=70, rot=(0, 0, 0), color=(1.0, 0.75, 0.48), blend=0.7, radius=0.04):
    ld = bpy.data.lights.new(name, 'SPOT')
    ld.energy = power
    ld.spot_size = math.radians(angle_deg)
    ld.spot_blend = blend
    ld.color = color
    ld.shadow_soft_size = radius
    ob = bpy.data.objects.new(name, ld)
    ob.location = loc
    ob.rotation_euler = rot
    bpy.context.collection.objects.link(ob)
    return ob


# ════════════ Дом ════════════
# Первый этаж G: x 0..15, y 0..9, z 0.15..3.2 (цоколь 0..0.15)
box('plinth', -0.3, 15.3, -0.3, 9.3, 0.0, 0.15, M['concrete'], bevel=0.01)
box('G_floor', 0.0, 15.0, 0.0, 9.0, 0.15, 0.2, M['intfloor'], facade=False)
box('G_ceiling', 0.0, 15.0, 0.0, 9.0, 3.05, 3.2, M['intwall'], facade=False)
box('G_back', 0.0, 15.0, 8.8, 9.0, 0.15, 3.2, M['intwall'], facade=False)
box('G_right', 14.8, 15.0, 0.0, 9.0, 0.15, 3.2, M['stucco'])
# левая стена — штукатурка с узким окном
box('G_left_a', -0.2, 0.0, 0.0, 3.2, 0.15, 3.2, M['stucco'], bevel=0.01)
box('G_left_b', -0.2, 0.0, 4.0, 9.0, 0.15, 3.2, M['stucco'], bevel=0.01)
box('G_left_top', -0.2, 0.0, 3.2, 4.0, 2.8, 3.2, M['stucco'])
glazing('G_lw', 'y', 3.2, 4.0, -0.1, 0.25, 2.8, 1)
# фасад первого этажа: глухая часть слева, вход, витражи
box('G_front_a', 0.0, 2.6, -0.2, 0.0, 0.15, 3.2, M['stucco'], bevel=0.01)
box('G_door', 2.6, 3.8, -0.12, -0.02, 0.15, 2.6, M['wood'])
box('G_door_top', 2.6, 3.8, -0.2, 0.0, 2.6, 3.2, M['charcoal'])
glazing('G_f1', 'x', 3.8, 9.4, -0.1, 0.2, 3.05, 4)
box('G_pier', 9.4, 10.2, -0.2, 0.0, 0.15, 3.2, M['charcoal'], bevel=0.01)
glazing('G_f2', 'x', 10.2, 14.6, -0.1, 0.2, 3.05, 3)
box('G_front_c', 14.6, 15.0, -0.2, 0.0, 0.15, 3.2, M['stucco'])
box('G_band', 3.8, 14.6, -0.2, 0.0, 3.05, 3.2, M['charcoal'])

# второй этаж U (консоль вперёд и влево): x -1.6..10, y -1.6..8, z 3.4..6.5
box('slab_mid', -1.9, 10.3, -1.9, 8.3, 3.2, 3.42, M['stucco'], bevel=0.015)
box('U_floor', -1.6, 10.0, -1.6, 8.0, 3.42, 3.47, M['intfloor'], facade=False)
box('U_ceiling', -1.6, 10.0, -1.6, 8.0, 6.35, 6.5, M['intwall'], facade=False)
box('U_back', -1.6, 10.0, 7.8, 8.0, 3.42, 6.5, M['intwall'], facade=False)
box('U_right', 9.8, 10.0, -1.6, 8.0, 3.42, 6.5, M['wood'])
box('slab_top', -1.9, 10.3, -1.9, 8.3, 6.5, 6.82, M['stucco'], bevel=0.015)
# белая «рамка» фасада второго этажа
box('U_frame_l', -1.9, -1.6, -1.9, 8.3, 3.42, 6.5, M['stucco'], bevel=0.01)
box('U_frame_r', 9.7, 10.3, -1.9, -1.55, 3.42, 6.5, M['stucco'], bevel=0.01)
glazing('U_f1', 'x', -1.6, 5.4, -1.7, 3.55, 6.3, 4)
# деревянные ламели справа на фасаде второго этажа
box('U_slat_back', 5.4, 9.7, -1.62, -1.55, 3.42, 6.5, M['charcoal'])
for i in range(28):
    x = 5.5 + i * 0.152
    box(f'U_slat{i}', x, x + 0.07, -1.82, -1.66, 3.45, 6.45, M['wood'])
# левый фасад второго этажа: большое окно
glazing('U_l1', 'y', -1.3, 4.6, -1.75, 3.55, 6.3, 3)
box('U_left_wall', -1.9, -1.6, 4.6, 8.3, 3.42, 6.5, M['stucco'])

# стойка под консолью
box('column', -1.35, -1.15, -1.35, -1.15, 0.15, 3.2, M['frame'])

# терраса над правой частью первого этажа
box('T_slab', 10.0, 15.3, -0.35, 9.3, 3.2, 3.42, M['stucco'], bevel=0.015)
box('T_rail', 10.2, 15.1, -0.3, -0.26, 3.42, 4.45, M['railglass'])
box('T_rail_top', 10.2, 15.1, -0.32, -0.24, 4.45, 4.5, M['frame'])

# ════════════ Интерьер (виден через стекло) ════════════
box('sofa', 4.4, 7.2, 3.0, 3.9, 0.2, 0.75, M['sofa'], facade=False)
box('sofa_back', 4.4, 7.2, 3.7, 4.0, 0.2, 1.05, M['sofa'], facade=False)
box('table', 5.0, 6.4, 1.8, 2.5, 0.2, 0.55, M['dark'], facade=False)
box('island', 10.8, 13.8, 3.5, 4.5, 0.2, 1.1, M['stucco'], facade=False)
box('shelf', 4.0, 9.0, 8.6, 8.8, 0.2, 2.6, M['wood'], facade=False)
box('bed', 0.0, 3.0, 4.0, 6.5, 3.47, 4.0, M['sofa'], facade=False)
box('desk', 6.0, 8.5, 6.4, 7.2, 3.47, 4.2, M['wood'], facade=False)
for i, x in enumerate([11.2, 12.3, 13.4]):
    ico(f'pend{i}', (x, 4.0, 2.2), 0.16, M['lamp'], sub=2)
    box(f'cord{i}', x - 0.005, x + 0.005, 3.995, 4.005, 2.3, 3.05, M['dark'], facade=False)
ico('pend_l', (5.8, 2.2, 2.3), 0.22, M['lamp'], sub=2)
# светящиеся полосы в потолках
for i, (x0, x1, y, z) in enumerate([(0.5, 9.0, 1.2, 3.03), (0.5, 9.0, 5.5, 3.03), (10.4, 14.4, 1.4, 3.03), (-1.2, 9.4, -0.6, 6.33), (-1.2, 9.4, 4.0, 6.33)]):
    box(f'strip{i}', x0, x1, y, y + 0.08, z - 0.02, z, M['strip'], facade=False)
area_light('in_g1', (6.5, 3.5, 3.0), (6.0, 4.0), 380)
area_light('in_g2', (12.4, 3.5, 3.0), (3.5, 4.0), 260)
area_light('in_u1', (2.5, 2.5, 6.3), (7.0, 5.0), 380)
area_light('in_u2', (7.5, 2.5, 6.3), (3.0, 5.0), 180)
# растения внутри
ico('inplant', (8.6, 1.0, 0.9), 0.5, M['leaf'], scale=(1, 1, 1.4), disp=0.15)

# ════════════ Участок ════════════
ground = box('ground', -60, 60, -60, 60, -0.1, 0.0, M['lawn'], facade=False)
# мощение перед домом крупным форматом
for i in range(16):
    for j in range(5):
        x0 = -2.4 + i * 1.12
        y0 = -6.2 + j * 1.12
        if x0 > 15.5:
            continue
        box(f'pave{i}_{j}', x0, x0 + 1.1, y0, y0 + 1.1, 0.0, 0.03, M['paving'])
# дорожка к входу
for j in range(7):
    y0 = -13.6 + j * 1.05
    box(f'path{j}', 2.4, 4.0, y0, y0 + 0.6, 0.0, 0.03, M['paving'])
# бассейн-«зеркало» воды вдоль фасада справа
box('pool_edge', 9.8, 15.4, -6.4, -3.3, 0.0, 0.06, M['concrete'])
box('pool', 10.0, 15.2, -6.2, -3.5, 0.0, 0.065, M['water'])
# кусты вдоль цоколя
for i, x in enumerate([-0.6, 0.6, 1.6, 15.8, 16.6]):
    ico(f'bush{i}', (x, -0.9 if x < 3 else 1.0, 0.35), 0.55, M['leaf'], scale=(1.2, 1, 0.8), disp=0.25)
box('planter', -2.4, 2.4, -1.4, -0.4, 0.0, 0.35, M['charcoal'])
# деревья
def tree(name, x, y, h, r):
    cyl(name + 'trunk', (x, y, 0), 0.16, h * 0.55, M['bark'])
    for k in range(7):
        ico(f'{name}c{k}', (x + random.uniform(-r, r) * 0.6, y + random.uniform(-r, r) * 0.6, h * 0.55 + random.uniform(0, h * 0.4)),
            r * random.uniform(0.55, 0.8), M['leaf'], disp=0.5)
tree('t1', 19.0, 2.0, 7.5, 2.2)
tree('t2', 22.5, 7.0, 9.0, 2.6)
tree('t3', -7.5, 9.0, 8.0, 2.4)
tree('t4', 6.0, 15.0, 10.0, 3.0)
tree('t5', 26.0, -2.0, 6.0, 1.8)
# дальняя линия деревьев, чтобы горизонт не был пустым
for k in range(26):
    x = -40 + k * 3.4 + random.uniform(-1, 1)
    y = 34 + random.uniform(-4, 6)
    ico(f'far{k}', (x, y, random.uniform(2.5, 4.5)), random.uniform(2.6, 4.2), M['leaf'], scale=(1, 1, random.uniform(0.9, 1.4)), disp=0.8)

# ════════════ Свет снаружи ════════════
# даунлайты в софите консоли и над витражами
for i, x in enumerate([-0.9, 1.4, 3.7, 6.0, 8.3]):
    spot(f'dl{i}', (x, -0.95, 3.18), 160, 75)
for i, x in enumerate([11.0, 13.0, 14.8]):
    spot(f'dt{i}', (x, -0.25, 3.18), 110, 70)
# подсветка стены слева и деревьев снизу вверх
spot('wash_l', (-0.6, -0.8, 0.05), 220, 50, rot=(math.radians(-8), 0, 0))
spot('wash_slat', (7.5, -2.6, 0.05), 260, 40, rot=(math.radians(-14), 0, 0))
spot('up_t1', (19.0, 1.2, 0.05), 400, 55, rot=(math.radians(-6), 0, 0))
spot('up_t2', (22.5, 6.2, 0.05), 450, 55)
spot('up_t3', (-7.5, 8.2, 0.05), 350, 55)
# садовые столбики
for i, (x, y) in enumerate([(1.8, -9.0), (4.6, -9.0), (1.8, -12.0), (4.6, -12.0)]):
    box(f'bol{i}', x - 0.06, x + 0.06, y - 0.06, y + 0.06, 0.0, 0.6, M['frame'], facade=False)
    box(f'boll{i}', x - 0.055, x + 0.055, y - 0.07, y - 0.055, 0.45, 0.55, M['lamp'], facade=False)
    pl = bpy.data.lights.new(f'bp{i}', 'POINT')
    pl.energy = 12
    pl.color = (1.0, 0.75, 0.48)
    po = bpy.data.objects.new(f'bp{i}', pl)
    po.location = (x, y - 0.15, 0.5)
    bpy.context.collection.objects.link(po)

# лунный контровой свет
sun = bpy.data.lights.new('moon', 'SUN')
sun.energy = 0.35
sun.color = (0.62, 0.6, 1.0)
sun.angle = math.radians(2)
so = bpy.data.objects.new('moon', sun)
so.rotation_euler = (math.radians(58), math.radians(-12), math.radians(150))
bpy.context.collection.objects.link(so)

# ════════════ Небо: сумерки в фиолетово-розовых тонах ════════════
world = bpy.data.worlds.new('dusk')
scene.world = world
world.use_nodes = True
wt = world.node_tree
wt.nodes.clear()
tc = wt.nodes.new('ShaderNodeTexCoord')
sep = wt.nodes.new('ShaderNodeSeparateXYZ')
mr = wt.nodes.new('ShaderNodeMapRange')
mr.inputs['From Min'].default_value = -0.02
mr.inputs['From Max'].default_value = 0.55
ramp = wt.nodes.new('ShaderNodeValToRGB')
el = ramp.color_ramp.elements
el[0].position = 0.0
el[0].color = (0.55, 0.22, 0.30, 1)
el[1].position = 1.0
el[1].color = (0.006, 0.005, 0.02, 1)
e2 = el.new(0.12)
e2.color = (0.22, 0.08, 0.30, 1)
e3 = el.new(0.4)
e3.color = (0.04, 0.025, 0.10, 1)
bg = wt.nodes.new('ShaderNodeBackground')
bg.inputs['Strength'].default_value = 1.0
out = wt.nodes.new('ShaderNodeOutputWorld')
wt.links.new(tc.outputs['Generated'], sep.inputs[0])
wt.links.new(sep.outputs['Z'], mr.inputs['Value'])
wt.links.new(mr.outputs['Result'], ramp.inputs['Fac'])
wt.links.new(ramp.outputs['Color'], bg.inputs['Color'])
wt.links.new(bg.outputs[0], out.inputs['Surface'])

# ════════════ Камера: двухточечная перспектива ════════════
cam_d = bpy.data.cameras.new('cam')
cam_d.lens = 24
cam_d.sensor_width = 36
cam_d.shift_y = 0.07
cam_d.shift_x = -0.075
cam = bpy.data.objects.new('cam', cam_d)
cam.location = (-7.2, -12.2, 1.4)
target = Vector((6.8, 2.6, 1.45))
direction = target - cam.location
cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
bpy.context.collection.objects.link(cam)
scene.camera = cam

# ════════════ Качество ════════════
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 3
scene.cycles.glossy_bounces = 3
scene.cycles.transmission_bounces = 6
scene.cycles.transparent_max_bounces = 8
scene.cycles.blur_glossy = 1.0
scene.cycles.caustics_reflective = False
scene.cycles.caustics_refractive = False
scene.view_settings.view_transform = 'AgX'
try:
    scene.view_settings.look = 'AgX - Medium High Contrast'
except TypeError:
    pass
scene.view_settings.exposure = 0.8
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_depth = '8'
scene.render.film_transparent = False

# ── проекция опорных точек (для выносок и узлов чертежа) ──
bpy.context.view_layer.update()


def to2d(p):
    v = world_to_camera_view(scene, cam, Vector(p))
    return [round(v.x, 4), round(1 - v.y, 4)]

anchors = {
    'bom': to2d((10.3, -1.9, 6.82)),
    'price': to2d((-1.9, -1.9, 6.82)),
    'defect': to2d((-1.0, -0.2, 1.6)),
    'export': to2d((14.0, -0.4, 4.0)),
}
nodes = []
for p in [(-1.9, -1.9, 6.82), (10.3, -1.9, 6.82), (10.3, 8.3, 6.82), (-1.9, -1.9, 3.2), (10.3, -1.9, 3.2),
          (15.3, -0.35, 3.42), (15.3, 9.3, 3.42), (15.0, -0.2, 0.15), (10.2, -0.2, 0.15), (9.4, -0.2, 3.2), (-1.9, 8.3, 6.82)]:
    nodes.append(to2d(p))
with open(os.path.join(OUT, 'anchors.json'), 'w') as f:
    json.dump({'anchors': anchors, 'nodes': nodes, 'w': WIDTH, 'h': HEIGHT}, f)
if len(sys.argv) > 4 and sys.argv[4] == 'anchors':
    sys.exit(0)

# ════════════ Рендер красивого кадра ════════════
scene.render.filepath = os.path.join(OUT, 'beauty.png')
bpy.ops.render.render(write_still=True)
print('beauty done', flush=True)

if PREVIEW:
    sys.exit(0)

# ════════════ Служебные проходы для чертежа ════════════
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.view_settings.exposure = 0.0
scene.cycles.samples = 4
scene.cycles.use_denoising = False
scene.cycles.pixel_filter_type = 'BOX'
scene.cycles.filter_width = 1.0
scene.render.image_settings.color_depth = '16'
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.0
for ob in list(scene.objects):
    if ob.type == 'LIGHT':
        ob.hide_render = True
for ob in scene.objects:
    if ob.type == 'MESH' and ob not in FACADE:
        ob.hide_render = True


def pass_mat(name, kind):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    e = nt.nodes.new('ShaderNodeEmission')
    o = nt.nodes.new('ShaderNodeOutputMaterial')
    if kind == 'normal':
        g = nt.nodes.new('ShaderNodeNewGeometry')
        vm = nt.nodes.new('ShaderNodeVectorMath')
        vm.operation = 'MULTIPLY_ADD'
        vm.inputs[1].default_value = (0.5, 0.5, 0.5)
        vm.inputs[2].default_value = (0.5, 0.5, 0.5)
        nt.links.new(g.outputs['Normal'], vm.inputs[0])
        nt.links.new(vm.outputs[0], e.inputs['Color'])
    elif kind == 'depth':
        cd = nt.nodes.new('ShaderNodeCameraData')
        mr2 = nt.nodes.new('ShaderNodeMapRange')
        mr2.inputs['From Min'].default_value = 5
        mr2.inputs['From Max'].default_value = 60
        nt.links.new(cd.outputs['View Distance'], mr2.inputs['Value'])
        nt.links.new(mr2.outputs['Result'], e.inputs['Color'])
    else:
        oi = nt.nodes.new('ShaderNodeObjectInfo')
        nt.links.new(oi.outputs['Random'], e.inputs['Color'])
    nt.links.new(e.outputs[0], o.inputs[0])
    return m


for kind in ('normal', 'depth', 'id'):
    scene.view_layers[0].material_override = pass_mat('pass_' + kind, kind)
    scene.render.filepath = os.path.join(OUT, f'pass_{kind}.png')
    bpy.ops.render.render(write_still=True)
    print(kind, 'done', flush=True)
