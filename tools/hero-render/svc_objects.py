"""Иллюстрации для карточек «Все сервисы платформы».
Запуск: /tmp/bvenv/bin/python svc_objects.py <out_dir> [name ...]
Каждый объект рендерится отдельно в прозрачный PNG с мягкой тенью."""
import sys, math, os
import bpy
from mathutils import Vector

OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/svc'
ONLY = sys.argv[2:]
os.makedirs(OUT, exist_ok=True)

def hexc(h, a=1.0):
    h = h.lstrip('#')
    r, g, b = (int(h[i:i+2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b), a)

MATS = {}
def mat(name, col, rough=0.45, metal=0.0, emit=None, emit_s=0.0, trans=0.0, coat=0.0):
    key = (name,)
    if key in MATS:
        return MATS[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = hexc(col)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if coat:
        b.inputs['Coat Weight'].default_value = coat
    if trans:
        b.inputs['Transmission Weight'].default_value = trans
    if emit:
        b.inputs['Emission Color'].default_value = hexc(emit)
        b.inputs['Emission Strength'].default_value = emit_s
    MATS[key] = m
    return m

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()

def setmat(o, m):
    o.data.materials.clear()
    o.data.materials.append(m)
    return o

def bevel(o, w=0.04, seg=4):
    md = o.modifiers.new('bv', 'BEVEL')
    md.width = w
    md.segments = seg
    md.limit_method = 'ANGLE'
    try:
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.shade_smooth()
    except Exception:
        pass
    return o

def attach(parent, o, local):
    bpy.context.view_layer.update()
    o.rotation_euler = parent.rotation_euler.copy()
    o.location = parent.matrix_world @ Vector(local)
    return o

def prism(w, d, h, loc, m):
    # двускатная крыша: ширина по x, глубина по y, высота h
    import bmesh
    me = bpy.data.meshes.new('roof'); o = bpy.data.objects.new('roof', me)
    bpy.context.collection.objects.link(o)
    bm = bmesh.new()
    v = [bm.verts.new(p) for p in [(-w/2,-d/2,0),(w/2,-d/2,0),(0,-d/2,h),(-w/2,d/2,0),(w/2,d/2,0),(0,d/2,h)]]
    for f in [(0,1,2),(5,4,3),(0,3,4,1),(1,4,5,2),(2,5,3,0)]:
        bm.faces.new([v[i] for i in f])
    bm.normal_update(); bm.to_mesh(me); bm.free()
    o.location = loc
    bpy.context.view_layer.objects.active = o
    for ob in bpy.context.selected_objects: ob.select_set(False)
    o.select_set(True)
    setmat(o, m); bevel(o, 0.02)
    return o

def box(size, loc, m, rot=(0, 0, 0), bv=0.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    setmat(o, m)
    if bv:
        bevel(o, bv)
    return o

def cyl(r, d, loc, m, rot=(0, 0, 0), v=64, bv=0.02):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d, location=loc, rotation=rot, vertices=v)
    o = bpy.context.object
    setmat(o, m)
    if bv:
        bevel(o, bv, 3)
    else:
        bpy.ops.object.shade_smooth()
    return o

def sphere(r, loc, m, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=64, ring_count=32)
    o = bpy.context.object
    o.scale = scale
    setmat(o, m)
    bpy.ops.object.shade_smooth()
    return o

def torus(R, r, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot,
                                     major_segments=96, minor_segments=32)
    o = bpy.context.object
    setmat(o, m)
    bpy.ops.object.shade_smooth()
    return o

# ---------- палитра ----------
P = dict(
    white='#F1EEF8', paper='#FAF8FF', violet='#7B5CF0', violet2='#A48BFF', deep='#2B2348',
    gold='#ECB44C', gold2='#F6CF7A', steel='#B9B6C8', dark='#1E1A30', brick='#C8673F',
    wood='#C79A62', concrete='#CFCBD8', blue='#4FA3FF', glass='#9FD4FF', green='#34D399',
)

# ---------- объекты ----------
def obj_estimate():
    W = mat('white', P['paper'], 0.6)
    # листы сметы
    for i, (dx, dy, rz) in enumerate([(0.25, 0.2, 0.18), (0.05, 0.05, -0.05)]):
        s = box((1.5, 2.0, 0.03), (dx, dy, 0.03 + i * 0.04), W, rot=(0, 0, rz), bv=0.01)
    # строки на верхнем листе
    G = mat('gold', P['gold'], 0.35, 0.2)
    L = mat('line', '#CFC8E6', 0.6)
    for k in range(6):
        y = 0.75 - k * 0.26
        box((0.85 if k % 2 else 1.05, 0.07, 0.012), (0.05 - (0.1 if k % 2 else 0), y, 0.1), L, rot=(0, 0, -0.05), bv=0.004)
        box((0.22, 0.07, 0.014), (0.62, y - 0.03, 0.1), G, rot=(0, 0, -0.05), bv=0.004)
    # телефон с камерой
    V = mat('violet', P['deep'], 0.3, 0.1, coat=0.6)
    ph = box((1.0, 1.95, 0.11), (-0.55, -0.85, 0.98), V, rot=(1.12, 0, 0.56), bv=0.09)
    box((0.5, 0.1, 0.5), (-0.4, -0.45, 0.25), V, rot=(0, 0, 0.56), bv=0.04)
    scr = mat('screen', '#3A2E70', 0.15, emit='#7B5CF0', emit_s=0.6)
    attach(ph, box((0.82, 1.6, 0.02), (0, 0, 0), scr, bv=0.05), (0, 0, 0.06))
    lens = mat('lens', '#111018', 0.1, 0.6, coat=1)
    ring = mat('ring', P['gold'], 0.25, 1.0)
    for cx, cy in [(-0.3, 0.6), (0.3, 0.6), (-0.3, -0.45), (0.3, -0.45)]:
        attach(ph, box((0.16, 0.03, 0.02), (0, 0, 0), ring, bv=0.006), (cx, cy + (0.065 if cy > 0 else -0.065), 0.075))
        attach(ph, box((0.03, 0.16, 0.02), (0, 0, 0), ring, bv=0.006), (cx + (-0.065 if cx < 0 else 0.065), cy, 0.075))
    attach(ph, cyl(0.15, 0.03, (0, 0, 0), ring, bv=0.008), (0, -0.75, 0.075))
    # домик в видоискателе
    attach(ph, box((0.36, 0.26, 0.012), (0, 0, 0), mat('hs', P['paper'], 0.5, emit='#FFFFFF', emit_s=0.3), bv=0.004), (0, -0.02, 0.07))
    attach(ph, box((0.44, 0.08, 0.012), (0, 0, 0), mat('gold', P['gold'], 0.3, 0.2), bv=0.004), (0, 0.17, 0.07))

def obj_defect():
    C = mat('concrete', P['concrete'], 0.85)
    blk = box((2.2, 1.0, 1.5), (0, 0, 0.75), C, bv=0.05)
    # трещина — зигзаг из тонких брусков на лицевой грани (y = -0.5)
    D = mat('crack', '#3A3150', 0.9)
    pts = [(-0.7, 1.35), (-0.45, 1.1), (-0.55, 0.85), (-0.2, 0.62), (-0.3, 0.38), (0.05, 0.15)]
    for (x1, z1), (x2, z2) in zip(pts, pts[1:]):
        L = math.hypot(x2 - x1, z2 - z1)
        a = math.atan2(z2 - z1, x2 - x1)
        box((L + 0.03, 0.04, 0.045), ((x1 + x2) / 2, -0.505, (z1 + z2) / 2), D, rot=(0, -a, 0), bv=0.008)
    # маркер-метки
    Rd = mat('mark', '#F87171', 0.5)
    for x, z in [(-0.75, 1.42), (0.1, 0.1)]:
        cyl(0.05, 0.02, (x, -0.52, z), Rd, rot=(math.pi / 2, 0, 0), bv=0.005)
    # лупа
    G = mat('gold', P['gold'], 0.25, 1.0)
    Gl = mat('glassl', P['glass'], 0.02, trans=0.9)
    ang = (math.pi / 2 - 0.15, 0, -0.25)
    torus(0.42, 0.07, (0.65, -0.95, 0.85), G, rot=ang)
    cyl(0.4, 0.035, (0.65, -0.95, 0.85), Gl, rot=ang, bv=0)
    Hd = mat('handle', P['deep'], 0.35, coat=0.5)
    cyl(0.075, 0.7, (0.65 + 0.6 * 0.82, -0.95, 0.85 - 0.8 * 0.82), Hd, rot=(0, math.atan2(0.6, -0.8), 0), bv=0.02)

def obj_materials():
    B = mat('brick', P['brick'], 0.8)
    Wd = mat('wood', P['wood'], 0.75)
    # поддон
    for x in (-0.75, 0, 0.75):
        box((0.18, 1.6, 0.14), (x, 0, 0.07), Wd, bv=0.01)
    for y in (-0.65, 0, 0.65):
        box((1.8, 0.28, 0.05), (0, y, 0.165), Wd, bv=0.01)
    # кирпичи 3 ряда
    bw, bd, bh = 0.56, 0.27, 0.17
    z = 0.19 + bh / 2
    for row in range(4):
        for i in range(3):
            for j in range(5):
                if row % 2 == 0:
                    box((bw, bd, bh), (-0.59 + i * 0.59, -0.6 + j * 0.3, z), B, bv=0.015)
                else:
                    pass
        if row % 2 == 1:
            for i in range(6):
                for j in range(3):
                    box((bd, bw, bh), (-0.75 + i * 0.3, -0.6 + j * 0.6, z), B, bv=0.015)
        z += bh + 0.01
    # мешок цемента
    S = mat('bag', '#E9E4F2', 0.9)
    bag = box((0.75, 1.1, 0.42), (1.45, -0.45, 0.23), S, rot=(0, 0, 0.35), bv=0.16)
    Lb = mat('label', P['violet'], 0.5)
    lab = attach(bag, box((0.5, 0.55, 0.02), (0, 0, 0), Lb, bv=0.01), (0, 0.05, 0.215))

def obj_equipment():
    Y = mat('yellow', '#F2B233', 0.35, coat=0.7)
    K = mat('track', '#2A2638', 0.7)
    S = mat('steel', P['steel'], 0.35, 0.9)
    Gl = mat('cabglass', '#6C8CC8', 0.05, 0.2, coat=1)
    # гусеницы
    for y in (-0.55, 0.55):
        box((2.0, 0.38, 0.42), (0, y, 0.21), K, bv=0.17)
        for x in (-0.65, 0, 0.65):
            cyl(0.13, 0.4, (x, y, 0.21), S, rot=(math.pi / 2, 0, 0), bv=0.01)
    box((0.9, 0.9, 0.18), (0, 0, 0.5), K, bv=0.03)
    # корпус и кабина
    box((1.6, 1.35, 0.5), (-0.15, 0, 0.84), Y, bv=0.07)
    box((0.7, 0.62, 0.75), (0.25, 0.32, 1.45), Y, bv=0.06)
    box((0.62, 0.64, 0.5), (0.3, 0.32, 1.5), Gl, bv=0.04)
    box((0.5, 1.2, 0.35), (-0.85, 0, 1.2), Y, bv=0.06)  # противовес
    # стрела
    box((1.35, 0.22, 0.24), (0.95, -0.25, 1.5), Y, rot=(0, -0.55, 0), bv=0.05)
    box((1.1, 0.2, 0.2), (1.75, -0.25, 1.35), Y, rot=(0, 0.9, 0), bv=0.05)
    cyl(0.05, 0.9, (1.0, -0.25, 1.2), S, rot=(0, math.pi / 2 - 0.55, 0), bv=0)
    # ковш
    bk = box((0.5, 0.55, 0.42), (2.1, -0.25, 0.62), K, rot=(0, 0.35, 0), bv=0.08)
    for k in range(4):
        box((0.06, 0.06, 0.14), (2.32, -0.47 + k * 0.15, 0.4), S, rot=(0, 0.35, 0), bv=0.01)

def obj_crews():
    G = mat('hat', '#F2B233', 0.28, coat=0.9)
    # каска
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.75, location=(0, 0, 0.3), segments=96, ring_count=48)
    h = bpy.context.object
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='DESELECT')
    bpy.ops.object.mode_set(mode='OBJECT')
    for v in h.data.vertices:
        v.select = v.co.z < -0.02
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.delete(type='VERT')
    bpy.ops.object.mode_set(mode='OBJECT')
    h.scale = (1.0, 1.12, 0.92)
    sol = h.modifiers.new('s', 'SOLIDIFY'); sol.thickness = 0.04
    setmat(h, G); bpy.ops.object.shade_smooth()
    h.scale = (1.0, 1.08, 0.86)
    rid = sphere(0.75, (0, 0, 0.3), G, scale=(0.16, 1.12, 0.97))
    brim = cyl(0.78, 0.045, (0.06, -0.14, 0.31), G, bv=0.02)
    brim.scale = (1.06, 1.3, 1)
    band = torus(0.74, 0.03, (0, 0, 0.33), mat('band', P['deep'], 0.4))
    band.scale = (1.0, 1.08, 1)
    # рулетка и уровень рядом
    V = mat('violet', P['violet'], 0.35, coat=0.5)
    lvl = box((2.3, 0.28, 0.2), (0.1, -1.05, 0.1), V, rot=(0, 0, -0.18), bv=0.04)
    Gl = mat('bubble', '#9BF0C8', 0.05, trans=0.6, emit='#34D399', emit_s=0.3)
    vb = attach(lvl, box((0.32, 0.1, 0.08), (0, 0, 0), Gl, bv=0.03), (0, -0.1, 0.06))
    D = mat('deep', P['deep'], 0.4)
    t = cyl(0.32, 0.22, (1.35, 0.35, 0.11), D, bv=0.04)
    cyl(0.14, 0.24, (1.35, 0.35, 0.12), mat('gold2', P['gold2'], 0.3, 0.6), bv=0.02)
    box((0.5, 0.17, 0.02), (1.35, 0.0, 0.01), mat('tape', P['gold2'], 0.4), rot=(0, 0, 0.4), bv=0.005)

def obj_orders():
    V = mat('board', '#5536C9', 0.35, coat=0.6)
    W = mat('paper', P['paper'], 0.6)
    S = mat('clip', P['steel'], 0.25, 1.0)
    G = mat('gold', P['gold'], 0.3, 0.3)
    L = mat('line2', '#8E86A8', 0.6)
    rot = (0.0, 0.0, 0.12)
    b = box((1.6, 2.15, 0.08), (0, 0, 0.04), V, rot=rot, bv=0.06)
    p = attach(b, box((1.36, 1.8, 0.02), (0, 0, 0), W, bv=0.01), (0, -0.1, 0.05))
    c = attach(b, box((0.62, 0.3, 0.12), (0, 0, 0), S, bv=0.04), (0, 0.95, 0.09))
    for k in range(4):
        y = 0.45 - k * 0.38
        ck = attach(b, box((0.17, 0.17, 0.03), (0, 0, 0), G if k < 3 else L, bv=0.02), (-0.45, y, 0.07))
        ln = attach(b, box((0.7, 0.06, 0.012), (0, 0, 0), L, bv=0.004), (0.12, y, 0.065))
    # карандаш
    pen = cyl(0.06, 1.5, (0.95, -0.4, 0.1), mat('pen', P['gold2'], 0.4), rot=(math.pi / 2, 0, 0.6), v=6, bv=0.005)

def obj_calc():
    D = mat('body', P['deep'], 0.35, coat=0.6)
    body = box((1.25, 1.85, 0.16), (0, 0, 0.08), D, rot=(0, 0, 0.2), bv=0.08)
    scr = mat('lcd', '#1C3B33', 0.2, emit='#34D399', emit_s=0.5)
    s = attach(body, box((1.0, 0.42, 0.02), (0, 0, 0), scr, bv=0.02), (0, 0.6, 0.085))
    K = mat('key', '#4A3F78', 0.4)
    G = mat('gold', P['gold'], 0.3, 0.2)
    for r in range(4):
        for c in range(4):
            m = G if (c == 3) else K
            k = attach(body, box((0.2, 0.18, 0.06), (0, 0, 0), m, bv=0.03), (-0.36 + c * 0.24, 0.17 - r * 0.24, 0.1))
    # труба-колено и кабель
    B = mat('pipe', P['blue'], 0.3, 0.1, coat=0.5)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.45, minor_radius=0.13, location=(1.25, 0.4, 0.13),
                                     rotation=(0, 0, 0), major_segments=96, minor_segments=32)
    t = bpy.context.object; setmat(t, B); bpy.ops.object.shade_smooth()
    # оставить четверть тора
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
    for v in t.data.vertices:
        v.select = not (v.co.x >= -0.01 and v.co.y <= 0.01)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.delete(type='VERT'); bpy.ops.object.mode_set(mode='OBJECT')
    S = mat('steelp', P['steel'], 0.3, 1.0)
    cyl(0.16, 0.12, (1.25 + 0.45, 0.4, 0.13), S, rot=(math.pi / 2, 0, 0), bv=0.01).location = (1.7, 0.43, 0.13)
    cyl(0.16, 0.12, (1.25, 0.4 - 0.45, 0.13), S, rot=(0, math.pi / 2, 0), bv=0.01).location = (1.22, -0.05, 0.13)
    Y = mat('cable', P['gold'], 0.45)
    for i in range(3):
        torus(0.38, 0.045, (-1.05, -0.75, 0.05 + i * 0.09), Y)

def obj_psd():
    Bl = mat('blueprint', '#3B5BDB', 0.55)
    Ln = mat('bpline', '#C9D6FF', 0.5, emit='#C9D6FF', emit_s=0.15)
    # развёрнутый чертёж
    sh = box((2.1, 1.45, 0.02), (-0.15, -0.1, 0.01), Bl, rot=(0, 0, -0.12), bv=0.006)
    for k in range(5):
        l = attach(sh, box((1.6 if k % 2 else 1.1, 0.025, 0.006), (0, 0, 0), Ln, bv=0), (-0.1, 0.5 - k * 0.24, 0.013))
    for x in (-0.6, 0.35):
        l = attach(sh, box((0.025, 1.1, 0.006), (0, 0, 0), Ln, bv=0), (x, 0, 0.013))
    # рулон
    cyl(0.17, 1.7, (-0.2, 0.85, 0.17), Bl, rot=(0, math.pi / 2, -0.12), bv=0.01)
    cyl(0.07, 1.74, (-0.2, 0.85, 0.17), mat('core', P['paper'], 0.6), rot=(0, math.pi / 2, -0.12), bv=0.005)
    # макет дома
    W = mat('housew', P['white'], 0.55)
    G = mat('roof', P['gold'], 0.4, coat=0.4)
    Gl = mat('win', '#6C8CC8', 0.1, emit='#F6CF7A', emit_s=0.6)
    hx, hy = 0.45, -0.25
    box((0.95, 0.75, 0.6), (hx, hy, 0.32), W, bv=0.02)
    prism(1.12, 0.9, 0.42, (hx, hy, 0.62), G)
    for x in (-0.22, 0.22):
        box((0.18, 0.02, 0.2), (hx + x, hy - 0.38, 0.38), Gl, bv=0.005)
    box((0.16, 0.02, 0.3), (hx, hy - 0.38, 0.16), mat('door', P['deep'], 0.4), bv=0.005)
    # циркуль/карандаш
    cyl(0.04, 1.0, (-0.75, -0.55, 0.06), mat('pen', P['gold2'], 0.4), rot=(math.pi / 2, 0, 1.1), v=6, bv=0.004)

OBJECTS = dict(estimate=obj_estimate, defect=obj_defect, materials=obj_materials, equipment=obj_equipment,
               crews=obj_crews, orders=obj_orders, calc=obj_calc, psd=obj_psd)

def scene_setup(res=(800, 600), samples=int(os.environ.get('SAMPLES', 96))):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Punchy'
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs[0].default_value = hexc('#8C80B8'); bg.inputs[1].default_value = 0.35
    # пол — ловец теней
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
    fl = bpy.context.object; fl.is_shadow_catcher = True
    # свет
    def area(loc, size, energy, col='#FFFFFF'):
        bpy.ops.object.light_add(type='AREA', location=loc)
        l = bpy.context.object; l.data.size = size; l.data.energy = energy; l.data.color = hexc(col)[:3]
        d = Vector((0, 0, 0.5)) - l.location
        l.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    area((-4, -5, 7), 5, 1400, '#FFF4E6')
    area((6, -2, 3), 4, 450, '#B9A6FF')
    area((1, 6, 4), 4, 600, '#E7B6FF')

def frame_camera():
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.is_shadow_catcher]
    bpy.context.view_layer.update()
    pts = []
    for o in objs:
        for c in o.bound_box:
            pts.append(o.matrix_world @ Vector(c))
    bpy.ops.object.camera_add()
    cam = bpy.context.object
    bpy.context.scene.camera = cam
    cam.data.type = 'ORTHO'
    cam.rotation_euler = (math.radians(58), 0, math.radians(32))
    bpy.context.view_layer.update()
    inv = cam.matrix_world.inverted()
    loc = [inv @ p for p in pts]
    xs = [p.x for p in loc]; ys = [p.y for p in loc]
    cx = (max(xs) + min(xs)) / 2; cy = (max(ys) + min(ys)) / 2
    w = max(xs) - min(xs); h = max(ys) - min(ys)
    ar = bpy.context.scene.render.resolution_x / bpy.context.scene.render.resolution_y
    cam.data.ortho_scale = max(w, h * ar) * 1.26
    cam.location = cam.matrix_world @ Vector((cx, cy, 20))

for name, fn in OBJECTS.items():
    if ONLY and name not in ONLY:
        continue
    reset()
    scene_setup()
    fn()
    frame_camera()
    bpy.context.scene.render.filepath = os.path.join(OUT, f'svc-{name}.png')
    bpy.ops.render.render(write_still=True)
    print('done', name)
