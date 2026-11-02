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
MODE = sys.argv[4] if len(sys.argv) > 4 else ''
PREVIEW = MODE == 'preview'
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
    'rug': textured('rug', (0.32, 0.29, 0.26), (0.42, 0.38, 0.33), 30, 0.95, bump=0.2),
    'steel': principled('steel', (0.55, 0.55, 0.56), 0.25, 1.0),
    'cabinet': principled('cabinet', (0.12, 0.11, 0.105), 0.35),
    'art1': principled('art1', (0.55, 0.25, 0.12), 0.6),
    'art2': principled('art2', (0.12, 0.18, 0.32), 0.6),
    'grass': principled('grass', (0.02, 0.06, 0.018), 0.6),
    'fabric': principled('fabric', (0.70, 0.66, 0.60), 0.95),
    'glow_fascia': emissive('glow_fascia', (1.0, 0.70, 0.40), 6),
}


def stone_mat(name, axes):
    # облицовка камнем: кирпичная раскладка с неровным тоном и тёмным швом;
    # axes — какие оси объекта дают горизонталь и вертикаль плитки
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    br = nt.nodes.new('ShaderNodeTexBrick')
    br.inputs['Scale'].default_value = 2.2
    br.inputs['Mortar Size'].default_value = 0.012
    br.inputs['Brick Width'].default_value = 0.9
    br.inputs['Row Height'].default_value = 0.18
    br.inputs['Color1'].default_value = (0.42, 0.40, 0.38, 1)
    br.inputs['Color2'].default_value = (0.30, 0.29, 0.28, 1)
    br.inputs['Mortar'].default_value = (0.06, 0.06, 0.065, 1)
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 25
    mix = nt.nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.blend_type = 'MULTIPLY'
    mix.inputs['Factor'].default_value = 0.35
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    comb = nt.nodes.new('ShaderNodeCombineXYZ')
    nt.links.new(tc.outputs['Object'], sep.inputs[0])
    nt.links.new(sep.outputs[axes[0]], comb.inputs['X'])
    nt.links.new(sep.outputs[axes[1]], comb.inputs['Y'])
    nt.links.new(comb.outputs[0], br.inputs['Vector'])
    nt.links.new(comb.outputs[0], nz.inputs['Vector'])
    nt.links.new(br.outputs['Color'], mix.inputs['A'])
    nt.links.new(nz.outputs['Color'], mix.inputs['B'])
    nt.links.new(mix.outputs['Result'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.85
    bp = nt.nodes.new('ShaderNodeBump')
    bp.inputs['Strength'].default_value = 0.35
    nt.links.new(br.outputs['Fac'], bp.inputs['Height'])
    nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m


M['stone'] = stone_mat('stone_front', ('X', 'Z'))
M['stone_l'] = stone_mat('stone_left', ('Y', 'Z'))

# ── инженерные системы: цвет линии на схеме (sRGB) ──
SYSTEMS = {
    'el': '#FFC34D',   # электрика
    'cw': '#4FC3FF',   # холодная вода
    'hw': '#FF5C7A',   # горячая вода
    'ht': '#FF8A3D',   # отопление
    'sw': '#2EE6C5',   # канализация
    'gs': '#D4F25A',   # газ
    'fx': '#E9E2FF',   # сантехприборы
}


def srgb_to_lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


MEP_MAT = {k: emissive('mep_' + k, srgb_to_lin(v), 1.0) for k, v in SYSTEMS.items()}
MEP = []


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
box('G_left_a', -0.2, 0.0, 0.0, 3.2, 0.15, 3.2, M['stone_l'], bevel=0.01)
box('G_left_b', -0.2, 0.0, 4.0, 9.0, 0.15, 3.2, M['stone_l'], bevel=0.01)
box('G_left_top', -0.2, 0.0, 3.2, 4.0, 2.8, 3.2, M['stone_l'])
glazing('G_lw', 'y', 3.2, 4.0, -0.1, 0.25, 2.8, 1)
# фасад первого этажа: глухая часть слева, вход, витражи
box('G_front_a', 0.0, 2.6, -0.2, 0.0, 0.15, 3.2, M['stone'], bevel=0.01)
box('G_door', 2.6, 3.8, -0.12, -0.02, 0.15, 2.6, M['wood'])
box('G_door_top', 2.6, 3.8, -0.2, 0.0, 2.6, 3.2, M['charcoal'])
glazing('G_f1', 'x', 3.8, 9.4, -0.1, 0.2, 3.05, 4)
box('G_pier', 9.4, 10.2, -0.2, 0.0, 0.15, 3.2, M['charcoal'], bevel=0.01)
glazing('G_f2', 'x', 10.2, 13.6, -0.1, 0.2, 3.05, 3)
box('G_front_c', 13.6, 15.0, -0.2, 0.0, 0.15, 3.2, M['stucco'], bevel=0.01)
box('G_band', 3.8, 13.6, -0.2, 0.0, 3.05, 3.2, M['charcoal'])
# шкаф учёта электроэнергии на фасаде
box('meter_cab', 13.95, 14.65, -0.34, -0.2, 1.1, 2.0, M['cabinet'], bevel=0.01)
box('meter_win', 14.1, 14.5, -0.35, -0.34, 1.6, 1.85, M['glass'])
# дверная ручка, ступени, козырёк
box('door_handle', 3.55, 3.59, -0.2, -0.16, 0.8, 2.0, M['steel'])
box('step1', 2.3, 4.1, -0.9, -0.2, 0.0, 0.08, M['concrete'], bevel=0.005)
box('canopy', 2.2, 4.2, -1.2, 0.0, 3.0, 3.06, M['frame'])

# второй этаж U (консоль вперёд и влево): x -1.6..10, y -1.6..8, z 3.4..6.5
box('slab_mid', -1.9, 10.3, -1.9, 8.3, 3.2, 3.42, M['stucco'], bevel=0.015)
box('U_floor', -1.6, 10.0, -1.6, 8.0, 3.42, 3.47, M['intfloor'], facade=False)
box('U_ceiling', -1.6, 10.0, -1.6, 8.0, 6.35, 6.5, M['intwall'], facade=False)
box('U_back', -1.6, 10.0, 7.8, 8.0, 3.42, 6.5, M['intwall'], facade=False)
box('U_right', 9.8, 10.0, -1.6, 8.0, 3.42, 6.5, M['wood'])
box('slab_top', -1.9, 10.3, -1.9, 8.3, 6.5, 6.82, M['stucco'], bevel=0.015)
# парапет с металлическим отливом
box('coping', -1.95, 10.35, -1.95, 8.35, 6.82, 6.86, M['frame'])
# светодиодная линия под консолью (подсветка торца)
box('fascia_led', -1.85, 10.25, -1.9, -1.86, 3.18, 3.2, M['glow_fascia'], facade=False)
box('fascia_led_l', -1.9, -1.86, -1.85, 8.25, 3.18, 3.2, M['glow_fascia'], facade=False)
# водосточная труба
box('downpipe', 10.31, 10.39, -1.8, -1.72, 0.0, 6.8, M['frame'])
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
for i, x in enumerate([10.2, 12.65, 15.06]):
    box(f'T_post{i}', x, x + 0.04, -0.33, -0.23, 3.42, 4.45, M['steel'])
# мебель на террасе
box('T_chair1', 11.0, 11.7, 0.6, 1.3, 3.42, 3.85, M['fabric'], facade=False)
box('T_chair2', 12.6, 13.3, 0.6, 1.3, 3.42, 3.85, M['fabric'], facade=False)
box('T_table', 11.8, 12.5, 0.7, 1.2, 3.42, 3.82, M['wood'], facade=False)

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
box('inpot', 8.35, 8.85, 0.75, 1.25, 0.2, 0.6, M['concrete'], facade=False)
ico('inplant2', (0.8, 1.0, 4.4), 0.45, M['leaf'], scale=(1, 1, 1.5), disp=0.15)
box('inpot2', 0.55, 1.05, 0.75, 1.25, 3.47, 3.85, M['concrete'], facade=False)
# ковёр, ТВ-стена, картины, торшер
box('rug', 3.9, 7.8, 1.2, 4.2, 0.2, 0.215, M['rug'], facade=False)
box('tvwall', 3.6, 8.2, 8.55, 8.62, 0.6, 2.4, M['cabinet'], facade=False)
box('tv', 4.9, 6.9, 8.5, 8.55, 1.1, 2.2, M['dark'], facade=False)
box('art_a', 1.0, 2.2, 8.75, 8.79, 1.2, 2.2, M['art1'], facade=False)
box('art_b', 2.4, 3.2, 8.75, 8.79, 1.4, 2.0, M['art2'], facade=False)
box('floorlamp', 7.6, 7.65, 3.6, 3.65, 0.2, 1.7, M['steel'], facade=False)
ico('floorlamp_shade', (7.62, 3.62, 1.75), 0.18, M['lamp'], sub=2)
# кухня: нижние и верхние шкафы, техника, барные стулья
box('k_base', 10.4, 14.6, 8.2, 8.8, 0.2, 1.1, M['cabinet'], facade=False)
box('k_top', 10.4, 14.6, 8.18, 8.8, 1.1, 1.14, M['stucco'], facade=False)
box('k_upper', 10.4, 14.6, 8.45, 8.8, 1.7, 2.6, M['cabinet'], facade=False)
box('k_hood', 12.0, 12.8, 8.3, 8.8, 1.9, 2.5, M['steel'], facade=False)
box('k_led', 10.4, 14.6, 8.44, 8.46, 1.68, 1.7, M['strip'], facade=False)
box('island_top', 10.75, 13.85, 3.45, 4.55, 1.1, 1.15, M['concrete'], facade=False)
for i, x in enumerate([11.2, 12.0, 12.8, 13.5]):
    box(f'stool{i}', x - 0.18, x + 0.18, 2.9, 3.26, 0.2, 0.8, M['dark'], facade=False)
# лестница на второй этаж (парящие ступени)
for i in range(15):
    z = 0.2 + i * 0.215
    y = 7.9 - i * 0.28
    box(f'stair{i}', 8.2, 9.3, y - 0.3, y, z, z + 0.06, M['wood'], facade=False)
box('stair_rail', 9.28, 9.3, 3.7, 7.9, 0.9, 4.2, M['railglass'], facade=False)
# второй этаж: кровать с изголовьем, шкаф, книжные полки
box('headboard', -0.2, 3.2, 6.6, 6.7, 3.47, 4.5, M['wood'], facade=False)
box('bedding', 0.1, 2.9, 4.2, 6.5, 4.0, 4.12, M['fabric'], facade=False)
box('wardrobe', 3.6, 5.6, 7.1, 7.8, 3.47, 5.8, M['cabinet'], facade=False)
for i in range(4):
    zb = 3.9 + i * 0.5
    box(f'bshelf{i}', 6.2, 9.4, 7.3, 7.75, zb, zb + 0.03, M['wood'], facade=False)
    xb = 6.25
    while xb < 9.3:
        wb = random.uniform(0.04, 0.09)
        hb = random.uniform(0.25, 0.42)
        col = random.choice([M['art1'], M['art2'], M['fabric'], M['cabinet'], M['sofa']])
        box(f'book{i}_{xb:.2f}', xb, xb + wb, 7.35, 7.7, zb + 0.03, zb + 0.03 + hb, col, facade=False)
        xb += wb + 0.005
area_light('in_u_shelf', (7.8, 6.9, 6.2), (3.0, 1.0), 60)

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
    cyl(name + 'trunk', (x, y, 0), 0.16, h * 0.6, M['bark'])
    for k in range(4):
        a = random.uniform(0, 6.28)
        cyl(f'{name}br{k}', (x + math.cos(a) * 0.3, y + math.sin(a) * 0.3, h * 0.45), 0.06, h * 0.3, M['bark'])
    # крона из множества мелких «облаков» листвы — живой силуэт
    for k in range(34):
        u = random.uniform(0, 6.28)
        v = random.uniform(-0.6, 1.0)
        rr = r * random.uniform(0.35, 1.0)
        ico(f'{name}c{k}', (x + math.cos(u) * rr, y + math.sin(u) * rr, h * 0.62 + v * r * 0.9),
            r * random.uniform(0.22, 0.42), M['leaf'], sub=2, disp=0.22)
tree('t1', 19.0, 2.0, 7.5, 2.2)
tree('t2', 22.5, 7.0, 9.0, 2.6)
tree('t3', -7.5, 9.0, 8.0, 2.4)
tree('t4', 6.0, 15.0, 10.0, 3.0)
tree('t5', 26.0, -2.0, 6.0, 1.8)
tree('t6', -12.0, -2.0, 7.0, 2.2)
# лежаки и столик у бассейна
for i, x in enumerate([10.4, 11.7]):
    box(f'lounger{i}', x, x + 0.75, -8.4, -6.6, 0.0, 0.32, M['fabric'], facade=False)
    box(f'lounger_b{i}', x, x + 0.75, -6.75, -6.55, 0.3, 0.75, M['fabric'], facade=False)
box('pool_table', 13.0, 13.5, -8.0, -7.5, 0.0, 0.45, M['wood'], facade=False)
# низкая ограда участка с подсветкой
box('fence', -14, 30, 20.0, 20.25, 0.0, 1.1, M['concrete'], facade=False)
# живая изгородь вдоль левой границы
for k in range(9):
    ico(f'hedge{k}', (-6.5, 0.5 + k * 2.1, 0.55), 0.95, M['leaf'], scale=(0.8, 1.3, 0.7), sub=2, disp=0.25)
# газон из травинок (вокруг дома, без мощения, бассейна и дорожки)
def free_of_hardscape(x, y):
    if -2.6 <= x <= 15.6 and -6.5 <= y <= 9.5:
        return False
    if 2.2 <= x <= 4.2 and -14 <= y <= -6:
        return False
    if 9.6 <= x <= 15.6 and -8.6 <= y <= -3.2:
        return False
    return True

tm = bpy.data.meshes.new('turf')
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=96, y_segments=84, size=1.0)
for v in bm.verts:
    v.co.x = 8 + v.co.x * 24
    v.co.y = 2 + v.co.y * 21
    v.co.z = 0.001
bm.to_mesh(tm)
bm.free()
turf = bpy.data.objects.new('turf', tm)
bpy.context.collection.objects.link(turf)
turf.data.materials.append(M['lawn'])
turf.data.materials.append(M['grass'])
vg = turf.vertex_groups.new(name='density')
for v in tm.vertices:
    vg.add([v.index], 1.0 if free_of_hardscape(v.co.x, v.co.y) else 0.0, 'REPLACE')
ps = turf.modifiers.new('grass', 'PARTICLE_SYSTEM').particle_system
pset = ps.settings
pset.type = 'HAIR'
pset.count = 26000 if not PREVIEW else 6000
pset.hair_length = 0.11
pset.use_advanced_hair = False
pset.material_slot = 'grass'
pset.child_type = 'INTERPOLATED'
pset.rendered_child_count = 9 if not PREVIEW else 3
pset.child_length = 1.0
pset.child_length_threshold = 0.4
pset.roughness_1 = 0.015
pset.roughness_endpoint = 0.02
pset.roughness_2 = 0.01
pset.radius_scale = 0.004
pset.root_radius = 1.0
pset.tip_radius = 0.0
ps.vertex_group_density = 'density'
# дальняя линия деревьев, чтобы горизонт не был пустым
for k in range(26):
    x = -40 + k * 3.4 + random.uniform(-1, 1)
    y = 34 + random.uniform(-4, 6)
    ico(f'far{k}', (x, y, random.uniform(2.5, 4.5)), random.uniform(2.6, 4.2), M['leaf'], scale=(1, 1, random.uniform(0.9, 1.4)), disp=0.8)

# ════════════ Инженерные системы (видны только на схеме) ════════════
def run(name, sys_key, pts, r=0.03):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = 2
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (*p, 1)
    ob = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(MEP_MAT[sys_key])
    MEP.append(ob)
    return ob


def wirebox(name, sys_key, x0, x1, y0, y1, z0, z1, r=0.014):
    P = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    for k, (i, j) in enumerate([(0, 1), (1, 2), (2, 3), (3, 0), (4, 5), (5, 6), (6, 7), (7, 4), (0, 4), (1, 5), (2, 6), (3, 7)]):
        run(f'{name}_{k}', sys_key, [P[i], P[j]], r)


def dot(name, sys_key, p, r=0.07):
    ob = ico(name, p, r, MEP_MAT[sys_key], sub=2)
    MEP.append(ob)


# — электрика: ввод → счётчик на фасаде → щит → линии освещения и розеток
wirebox('m_el', 'el', 13.95, 14.65, -0.34, -0.2, 1.1, 2.0, 0.016)
dot('m_el_dial', 'el', (14.3, -0.36, 1.72), 0.09)
run('el_in', 'el', [(14.3, -4.0, -0.6), (14.3, -0.6, -0.6), (14.3, -0.6, 1.1)], 0.03)
run('el_feed', 'el', [(14.3, -0.2, 1.55), (14.3, 0.05, 1.55), (14.3, 0.05, 2.95), (14.7, 0.05, 2.95), (14.7, 6.3, 2.95), (14.7, 6.3, 2.1)], 0.025)
wirebox('panel', 'el', 14.6, 14.78, 6.0, 6.7, 1.2, 2.1, 0.016)
run('el_trunk', 'el', [(14.7, 6.4, 2.1), (14.7, 6.4, 2.98), (14.7, 4.5, 2.98), (0.4, 4.5, 2.98)], 0.022)
for i, x in enumerate([1.2, 3.6, 6.0, 8.0, 11.0, 13.2]):
    run(f'el_s{i}', 'el', [(x, 4.5, 2.98), (x, 8.72, 2.98), (x, 8.72, 0.35)], 0.016)
    wirebox(f'sock{i}', 'el', x - 0.07, x + 0.07, 8.66, 8.76, 0.28, 0.42, 0.01)
    dot(f'lamp_pt{i}', 'el', (x, 4.5, 2.95), 0.08)
run('el_sw', 'el', [(2.2, 4.5, 2.98), (2.2, 0.06, 2.98), (2.2, 0.06, 1.0)], 0.016)
wirebox('switch', 'el', 2.13, 2.27, 0.03, 0.1, 0.93, 1.07, 0.01)
run('el_riser', 'el', [(9.6, 4.5, 2.98), (9.6, 7.6, 2.98), (9.6, 7.6, 6.3), (9.6, 3.0, 6.3), (-1.3, 3.0, 6.3)], 0.022)
for i, x in enumerate([-0.6, 2.2, 5.0, 7.6]):
    run(f'el_us{i}', 'el', [(x, 3.0, 6.3), (x, 7.72, 6.3), (x, 7.72, 3.75)], 0.016)
    wirebox(f'usock{i}', 'el', x - 0.07, x + 0.07, 7.66, 7.76, 3.68, 3.82, 0.01)
    dot(f'ulamp{i}', 'el', (x, 3.0, 6.27), 0.08)
# — холодная вода: ввод с улицы → колодец с водомером → котельная → кухня, санузлы
run('cw_main', 'cw', [(12.8, -5.0, -1.2), (12.8, -3.0, -1.2)], 0.055)
wirebox('m_water', 'cw', 12.4, 13.2, -3.0, -2.2, -1.5, -0.6, 0.016)
dot('m_water_dial', 'cw', (12.8, -2.6, -1.15), 0.12)
run('cw_in', 'cw', [(12.8, -2.2, -1.0), (12.8, -2.2, -0.35), (12.8, 8.4, -0.35), (12.8, 8.4, 0.45), (14.05, 8.4, 0.45), (14.05, 8.4, 1.0)], 0.05)
run('cw_dist', 'cw', [(12.8, 8.55, 0.45), (6.6, 8.55, 0.45)], 0.045)
run('cw_riser', 'cw', [(9.2, 8.55, 0.45), (9.2, 7.6, 0.45), (9.2, 7.6, 4.0), (7.4, 7.6, 4.0), (7.4, 7.4, 3.75)], 0.045)
run('cw_shower', 'cw', [(8.5, 7.6, 4.0), (8.5, 7.6, 5.6)], 0.035)
run('cw_kitchen', 'cw', [(12.0, 8.55, 0.45), (12.0, 8.55, 0.12), (12.0, 4.1, 0.12), (12.0, 4.1, 0.95)], 0.04)
run('cw_wc', 'cw', [(7.4, 8.55, 0.45), (7.4, 8.3, 0.3)], 0.035)
run('cw_basin', 'cw', [(6.6, 8.55, 0.45), (6.6, 8.4, 0.75)], 0.035)

# — горячая вода: от котла параллельно холодной
run('hw_main', 'hw', [(14.3, 8.25, 1.9), (13.6, 8.25, 1.9), (13.6, 8.25, 0.62), (6.75, 8.25, 0.62)], 0.045)
run('hw_riser', 'hw', [(8.75, 8.25, 0.62), (8.75, 7.3, 0.62), (8.75, 7.3, 4.25), (8.65, 7.3, 4.25), (8.65, 7.3, 5.6)], 0.05)
run('hw_kitchen', 'hw', [(12.15, 8.25, 0.62), (12.15, 8.25, 0.15), (12.15, 4.1, 0.15), (12.15, 4.1, 0.95)], 0.04)
run('hw_basin', 'hw', [(6.75, 8.25, 0.62), (6.75, 8.4, 0.75)], 0.035)

# — котёл, коллектор, тёплый пол, внутрипольные конвекторы
wirebox('boiler', 'ht', 14.0, 14.6, 8.25, 8.75, 1.0, 2.0, 0.018)
dot('boiler_flame', 'ht', (14.3, 8.24, 1.35), 0.09)
run('ht_supply', 'ht', [(14.0, 8.68, 1.4), (10.0, 8.68, 1.4), (10.0, 8.68, 0.75)], 0.045)
wirebox('collector', 'ht', 9.6, 10.4, 8.6, 8.75, 0.35, 0.75, 0.014)
def floor_loop(name, x0, x1, y0, y1, step, z, start):
    pts = [start]
    y = y1
    left = False
    pts.append((x1, y1, z))
    while y >= y0:
        pts.append((x0 if not left else x1, y, z))
        y -= step
        if y < y0:
            break
        pts.append((x0 if not left else x1, y, z))
        left = not left
    run(name, 'ht', pts, 0.018)
floor_loop('ufh_living', 0.8, 9.0, 0.8, 8.0, 0.5, 0.18, (9.7, 8.6, 0.18))
floor_loop('ufh_kitchen', 10.6, 14.4, 0.8, 7.6, 0.5, 0.18, (10.3, 8.6, 0.18))
run('ht_riser', 'ht', [(10.2, 8.68, 0.75), (9.7, 7.7, 0.75), (9.7, 7.7, 3.38), (9.7, -1.32, 3.38), (-1.3, -1.32, 3.38), (-1.3, 4.4, 3.38)], 0.035)
for i, (x0, x1) in enumerate([(-1.2, 1.4), (1.7, 4.3), (4.6, 7.2)]):
    wirebox(f'conv{i}', 'ht', x0, x1, -1.45, -1.2, 3.28, 3.42, 0.012)
wirebox('conv_l', 'ht', -1.48, -1.28, -1.0, 4.2, 3.28, 3.42, 0.012)

# — канализация: стояк из санузла 2-го этажа, выпуск в септик
run('sw_stack', 'sw', [(9.5, 7.9, 7.4), (9.5, 7.9, -0.8), (9.5, 13.0, -1.0), (7.5, 13.0, -1.2)], 0.075)
run('sw_up', 'sw', [(7.4, 7.4, 3.55), (9.5, 7.4, 3.5), (9.5, 7.9, 3.5)], 0.06)
run('sw_shower', 'sw', [(8.5, 7.25, 3.5), (8.5, 7.9, 3.5)], 0.05)
run('sw_wc', 'sw', [(7.4, 8.3, 0.3), (7.4, 8.3, -0.4), (9.5, 8.3, -0.6)], 0.06)
run('sw_kitchen', 'sw', [(12.0, 4.3, 0.6), (12.0, 4.3, -0.4), (12.0, 9.6, -0.5), (12.0, 13.0, -0.9), (7.5, 13.0, -1.2)], 0.06)
wirebox('septic', 'sw', 5.0, 7.5, 12.0, 14.5, -2.4, -0.6, 0.02)

# — газ: ввод с улицы → счётчик на стене → котёл
run('gs_main', 'gs', [(15.9, -4.5, -1.0), (15.9, 1.3, -1.0), (15.9, 1.3, 0.9), (15.22, 1.3, 0.9)], 0.045)
wirebox('m_gas', 'gs', 15.02, 15.25, 1.0, 1.6, 0.9, 1.5, 0.014)
dot('m_gas_dial', 'gs', (15.27, 1.3, 1.28), 0.08)
run('gs_boiler', 'gs', [(15.12, 1.3, 1.5), (15.12, 1.3, 2.6), (15.12, 8.5, 2.6), (14.5, 8.5, 2.6), (14.5, 8.5, 2.0)], 0.04)

# — сантехприборы (контуры)
wirebox('wc1', 'fx', 7.2, 7.6, 8.0, 8.7, 0.2, 0.6, 0.014)
wirebox('basin1', 'fx', 6.3, 7.0, 8.3, 8.75, 0.75, 0.9, 0.014)
wirebox('shower2', 'fx', 8.0, 9.0, 6.8, 7.75, 3.47, 3.55, 0.014)
wirebox('shower2_head', 'fx', 8.4, 8.7, 7.55, 7.7, 5.55, 5.65, 0.012)
wirebox('wc2', 'fx', 7.2, 7.6, 7.1, 7.75, 3.47, 3.85, 0.014)
wirebox('sink_k', 'fx', 11.8, 12.4, 3.75, 4.25, 0.95, 1.12, 0.012)

for ob in MEP:
    ob.hide_render = True  # в красивом кадре инженерия скрыта

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
    'm_el': to2d((14.3, -0.36, 1.72)),
    'm_water': to2d((12.8, -2.6, -1.0)),
    'm_gas': to2d((15.27, 1.3, 1.28)),
    'boiler': to2d((14.3, 8.5, 1.5)),
    'panel': to2d((14.7, 6.35, 1.65)),
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

# ════════════ Рентген инженерных систем ════════════
def render_mep():
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0.0
    scene.cycles.use_denoising = False
    scene.view_layers[0].material_override = None
    scene.render.film_transparent = True
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.cycles.samples = 16
    scene.cycles.pixel_filter_type = 'BLACKMAN_HARRIS'
    scene.cycles.filter_width = 1.5
    for ob in scene.objects:
        if ob.type in ('MESH', 'CURVE'):
            ob.hide_render = ob not in MEP
        if ob.type == 'LIGHT':
            ob.hide_render = True
    scene.render.filepath = os.path.join(OUT, 'pass_mep.png')
    bpy.ops.render.render(write_still=True)
    print('mep done', flush=True)



if MODE == 'meponly':
    render_mep()
    sys.exit(0)

# ════════════ Рендер красивого кадра ════════════
scene.render.filepath = os.path.join(OUT, 'beauty.png')
bpy.ops.render.render(write_still=True)
print('beauty done', flush=True)

if PREVIEW and not os.environ.get('MEP_PREVIEW'):
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
    if ob.type in ('MESH', 'CURVE') and ob not in FACADE:
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



render_mep()
