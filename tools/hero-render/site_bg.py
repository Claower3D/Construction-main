"""Единый фон сайта: ночная стройка — город, краны, строящаяся башня-чертёж.
/tmp/bvenv/bin/python site_bg.py out.png [W H samples]"""
import sys, math, random, bpy, bmesh
from mathutils import Vector

OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/site_bg.png'
RW = int(sys.argv[2]) if len(sys.argv) > 2 else 1280
RH = int(sys.argv[3]) if len(sys.argv) > 3 else 720
SPP = int(sys.argv[4]) if len(sys.argv) > 4 else 16
random.seed(11)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.samples = SPP
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 4
sc.render.resolution_x, sc.render.resolution_y = RW, RH
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'AgX - Medium High Contrast'

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c)

FOG = lin('#4a2a8a')

def fogged(m, strength=1.0, k=900.0):
    """Подмешивает к материалу фиолетовую дымку по расстоянию до камеры."""
    nt = m.node_tree
    out = nt.nodes['Material Output']
    bsdf_link = out.inputs['Surface'].links[0].from_socket
    cam = nt.nodes.new('ShaderNodeCameraData')
    div = nt.nodes.new('ShaderNodeMath'); div.operation = 'DIVIDE'; div.inputs[1].default_value = k
    ex = nt.nodes.new('ShaderNodeMath'); ex.operation = 'MULTIPLY'; ex.inputs[1].default_value = -1
    e2 = nt.nodes.new('ShaderNodeMath'); e2.operation = 'EXPONENT'
    inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1
    nt.links.new(cam.outputs['View Distance'], div.inputs[0]); nt.links.new(div.outputs[0], ex.inputs[0])
    nt.links.new(ex.outputs[0], e2.inputs[0]); nt.links.new(e2.outputs[0], inv.inputs[1])
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (*FOG, 1); em.inputs['Strength'].default_value = strength
    mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(inv.outputs[0], mix.inputs[0]); nt.links.new(bsdf_link, mix.inputs[1]); nt.links.new(em.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs['Surface'])
    return m

def principled(name, col, rough=0.7, metal=0.0, emit=None, es=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = es
    return m

def emission(name, col, s):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.remove(nt.nodes['Principled BSDF'])
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*col, 1); e.inputs['Strength'].default_value = s
    nt.links.new(e.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    return m

def tower_mat(name, seed):
    """Тёмный фасад с горящими окнами (часть окон светится тёплым, часть — холодным)."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin('#14112a'), 1); b.inputs['Roughness'].default_value = 0.55
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'], sep.inputs[0])
    add = nt.nodes.new('ShaderNodeMath'); add.operation = 'ADD'
    nt.links.new(sep.outputs[0], add.inputs[0]); nt.links.new(sep.outputs[1], add.inputs[1])
    com = nt.nodes.new('ShaderNodeCombineXYZ'); nt.links.new(add.outputs[0], com.inputs[0]); nt.links.new(sep.outputs[2], com.inputs[1])
    off = nt.nodes.new('ShaderNodeVectorMath'); off.operation = 'ADD'; off.inputs[1].default_value = (seed * 13.1, seed * 7.7, 0)
    nt.links.new(com.outputs[0], off.inputs[0])
    br = nt.nodes.new('ShaderNodeTexBrick')
    br.inputs['Scale'].default_value = 1.0; br.inputs['Mortar Size'].default_value = 0.6
    br.inputs['Brick Width'].default_value = 2.2; br.inputs['Row Height'].default_value = 3.3
    br.inputs['Color1'].default_value = (0, 0, 0, 1); br.inputs['Color2'].default_value = (1, 1, 1, 1)
    br.offset = 0.0
    nt.links.new(off.outputs[0], br.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.86; ramp.color_ramp.elements[1].position = 0.875
    nt.links.new(br.outputs['Color'], ramp.inputs['Fac'])
    inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1
    nt.links.new(br.outputs['Fac'], inv.inputs[1])
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
    nt.links.new(ramp.outputs['Color'], mul.inputs[0]); nt.links.new(inv.outputs[0], mul.inputs[1])
    warm = lin('#ffc36a') if seed % 3 else lin('#9fd8ff')
    b.inputs['Emission Color'].default_value = (*warm, 1)
    nt.links.new(mul.outputs[0], b.inputs['Emission Strength'])
    sc_ = nt.nodes.new('ShaderNodeMath'); sc_.operation = 'MULTIPLY'; sc_.inputs[1].default_value = 2.2
    nt.links.new(mul.outputs[0], sc_.inputs[0]); nt.links.new(sc_.outputs[0], b.inputs['Emission Strength'])
    return m

def box(size, loc, m, rot=(0, 0, 0), name='b'):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(m); return o

def lattice(size, loc, cuts, m, thick=0.12, rot=(0, 0, 0)):
    """Решётчатая конструкция: ящик с разрезами + wireframe."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs((e.verts[0].co - e.verts[1].co).normalized().dot(Vector(cuts[1]))) > 0.9], cuts=cuts[0], use_grid_fill=True)
    bm.to_mesh(o.data); bm.free()
    w = o.modifiers.new('w', 'WIREFRAME'); w.thickness = thick; w.use_replace = True
    o.data.materials.append(m); return o

# ── Мир: небо от тёмного индиго к фиолетовому, тёплое зарево у горизонта, звёзды ──
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
wn = world.node_tree; bg = wn.nodes['Background']
tc = wn.nodes.new('ShaderNodeTexCoord'); sep = wn.nodes.new('ShaderNodeSeparateXYZ')
wn.links.new(tc.outputs['Generated'], sep.inputs[0])
ramp = wn.nodes.new('ShaderNodeValToRGB'); cr = ramp.color_ramp
cr.elements[0].position = 0.0; cr.elements[0].color = (*lin('#ff9f5a'), 1)
cr.elements[1].position = 0.55; cr.elements[1].color = (*lin('#05041a'), 1)
e = cr.elements.new(0.04); e.color = (*lin('#b04ae0'), 1)
e = cr.elements.new(0.13); e.color = (*lin('#5223a8'), 1)
e = cr.elements.new(0.27); e.color = (*lin('#211268'), 1)
e = cr.elements.new(0.42); e.color = (*lin('#0c0934'), 1)
wn.links.new(sep.outputs[2], ramp.inputs['Fac'])
# звёзды
vor = wn.nodes.new('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = 260
vor.feature = 'F1'
wn.links.new(tc.outputs['Generated'], vor.inputs['Vector'])
st = wn.nodes.new('ShaderNodeMath'); st.operation = 'LESS_THAN'; st.inputs[1].default_value = 0.03
wn.links.new(vor.outputs['Distance'], st.inputs[0])
hz = wn.nodes.new('ShaderNodeMath'); hz.operation = 'GREATER_THAN'; hz.inputs[1].default_value = 0.14
wn.links.new(sep.outputs[2], hz.inputs[0])
sm = wn.nodes.new('ShaderNodeMath'); sm.operation = 'MULTIPLY'; wn.links.new(st.outputs[0], sm.inputs[0]); wn.links.new(hz.outputs[0], sm.inputs[1])
sm2 = wn.nodes.new('ShaderNodeMath'); sm2.operation = 'MULTIPLY'; sm2.inputs[1].default_value = 0.9; wn.links.new(sm.outputs[0], sm2.inputs[0])
addc = wn.nodes.new('ShaderNodeMix'); addc.data_type = 'RGBA'; addc.blend_type = 'ADD'
wn.links.new(sm2.outputs[0], addc.inputs[0]); wn.links.new(ramp.outputs['Color'], addc.inputs[6]); addc.inputs[7].default_value = (1, 0.95, 0.9, 1)
nz = wn.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 2.2; nz.inputs['Detail'].default_value = 6; nz.inputs['Roughness'].default_value = 0.6
wn.links.new(tc.outputs['Generated'], nz.inputs['Vector'])
nr = wn.nodes.new('ShaderNodeValToRGB'); nr.color_ramp.elements[0].position = 0.5; nr.color_ramp.elements[0].color = (0, 0, 0, 1)
nr.color_ramp.elements[1].position = 0.82; nr.color_ramp.elements[1].color = (*lin('#2c1466'), 1)
ne = nr.color_ramp.elements.new(0.68); ne.color = (*lin('#16154a'), 1)
wn.links.new(nz.outputs['Fac'], nr.inputs['Fac'])
hz2 = wn.nodes.new('ShaderNodeMath'); hz2.operation = 'MULTIPLY'; hz2.inputs[1].default_value = 1.6
wn.links.new(sep.outputs[2], hz2.inputs[0])
mixn = wn.nodes.new('ShaderNodeMix'); mixn.data_type = 'RGBA'; mixn.blend_type = 'ADD'
cl = wn.nodes.new('ShaderNodeClamp'); wn.links.new(hz2.outputs[0], cl.inputs[0])
wn.links.new(cl.outputs[0], mixn.inputs[0]); wn.links.new(addc.outputs[2], mixn.inputs[6]); wn.links.new(nr.outputs['Color'], mixn.inputs[7])
wn.links.new(mixn.outputs[2], bg.inputs['Color']); bg.inputs['Strength'].default_value = 1.0

# ── Земля: мокрый асфальт, отражает огни ──
bpy.ops.mesh.primitive_plane_add(size=8000, location=(0, 0, 0))
g = bpy.context.object; g.data.materials.append(fogged(principled('ground', lin('#0d0b18'), 0.32), 1.0, 1400))

# ── Дальний город ──
for i in range(300):
    d = random.uniform(950, 3200)
    ang = random.uniform(-1.0, 1.0)
    x = math.sin(ang) * d; y = math.cos(ang) * d
    w = random.uniform(18, 46); dp = random.uniform(18, 46)
    h = random.choice([random.uniform(15, 45), random.uniform(30, 80), random.uniform(60, 150)])
    box((w, dp, h), (x, y, h / 2), fogged(tower_mat(f't{i}', i), 1.0, 700))
# несколько тонких шпилей с красными огнями
red = emission('red', lin('#ff3b4a'), 40)
for x, y, h in [(-700, 1900, 240), (-260, 2400, 200), (1100, 2300, 270)]:
    box((16, 16, h), (x, y, h / 2), fogged(tower_mat('sp', 5), 1.0, 700))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.6, location=(x, y, h + 2)); bpy.context.object.data.materials.append(red)

# ── Стройплощадка: строящаяся башня в центре ──
concrete = fogged(principled('conc', lin('#4a4462'), 0.85), 1.0, 1600)
gold = emission('gold', lin('#ffb84a'), 2.6)
cyan = emission('cyan', lin('#4fc3ff'), 2.4)
rose = emission('rose', lin('#ff5c8a'), 2.4)
mint = emission('mint', lin('#2ee6c5'), 2.4)
TX, TY = 62, 250
FL = 3.6; NF = 26; BUILT = 14
core = box((10, 10, FL * BUILT + 4), (TX, TY, (FL * BUILT + 4) / 2), concrete)
for f in range(BUILT + 1):
    box((34, 26, 0.45), (TX, TY, f * FL), concrete)
    for cx in (-16, -8, 0, 8, 16):
        for cy in (-12, 12):
            if f < BUILT:
                box((0.7, 0.7, FL), (TX + cx, TY + cy, f * FL + FL / 2), concrete)
# тёплые окна-«работы» на нескольких этажах
work = emission('work', lin('#ffd08a'), 6)
for f in random.sample(range(2, BUILT), 5):
    box((random.uniform(6, 14), 0.2, 2.2), (TX + random.uniform(-10, 10), TY - 12.8, f * FL + 1.5), work)
# верх — светящийся чертёж: перекрытия-контуры и колонны линиями
for f in range(BUILT + 1, NF + 1):
    z = f * FL
    t = (f - BUILT) / (NF - BUILT)
    m = gold if f % 4 else cyan
    for (sx, sy, px, py) in [(34, 0.18, 0, -13), (34, 0.18, 0, 13), (0.18, 26, -17, 0), (0.18, 26, 17, 0)]:
        box((sx, sy, 0.18), (TX + px, TY + py, z), m)
for cx in (-17, -8, 0, 8, 17):
    for cy in (-13, 13):
        box((0.16, 0.16, FL * (NF - BUILT)), (TX + cx, TY + cy, FL * BUILT + FL * (NF - BUILT) / 2), gold)
# инженерные сети внутри чертежа: вертикальные стояки систем
for i, mm in enumerate([cyan, rose, mint, gold]):
    box((0.35, 0.35, FL * NF), (TX - 4 + i * 2.6, TY - 2, FL * NF / 2), mm)

# ── Башенные краны ──
crane = fogged(principled('crane', lin('#3a3058'), 0.5, 0.5, emit=lin('#6a4aa8'), es=0.35), 1.0, 1600)
def tower_crane(x, y, h, jib, rot):
    lattice((2.2, 2.2, h), (x, y, h / 2), (int(h / 2.6), (0, 0, 1)), crane, 0.16)
    r = math.radians(rot)
    dx, dy = math.cos(r), math.sin(r)
    lattice((jib, 1.8, 1.8), (x + dx * jib * 0.38, y + dy * jib * 0.38, h + 1.5), (int(jib / 2.4), (1, 0, 0)), crane, 0.14, rot=(0, 0, r))
    box((jib * 0.3, 2.4, 1.6), (x - dx * jib * 0.22, y - dy * jib * 0.22, h + 1.4), crane, rot=(0, 0, r))
    box((4, 3, 3.6), (x - dx * jib * 0.33, y - dy * jib * 0.33, h - 0.6), crane, rot=(0, 0, r))
    lattice((1.6, 1.6, 9), (x, y, h + 6.5), (4, (0, 0, 1)), crane, 0.12)
    box((3, 2.6, 2.6), (x + dx * 2.5, y + dy * 2.5, h - 1.8), emission('cab', lin('#ffd890'), 3), rot=(0, 0, r))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.6, location=(x, y, h + 11.5)); bpy.context.object.data.materials.append(red)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(x + dx * jib * 0.85, y + dy * jib * 0.85, h + 2.6)); bpy.context.object.data.materials.append(red)
    # трос и груз
    hx, hy = x + dx * jib * 0.55, y + dy * jib * 0.55
    box((0.08, 0.08, h * 0.45), (hx, hy, h - h * 0.225), crane)
    box((5, 2, 1.2), (hx, hy, h * 0.55 - 1), gold)
tower_crane(TX - 26, TY + 22, 122, 72, 170)
tower_crane(-120, 430, 100, 62, 15)
tower_crane(300, 820, 108, 66, 200)

# прожекторы площадки
for (x, y, z, c, e) in [(TX - 30, TY - 40, 14, '#ffd59a', 90000), (TX + 50, TY - 30, 12, '#ffd59a', 70000), (TX, TY + 30, 60, '#c9a2ff', 60000)]:
    bpy.ops.object.light_add(type='POINT', location=(x, y, z)); L = bpy.context.object
    L.data.energy = e; L.data.color = lin(c); L.data.shadow_soft_size = 3

# ── Камера: низко, широко, горизонт в нижней трети ──
bpy.ops.object.camera_add(location=(0, -60, 14)); cam = bpy.context.object
cam.rotation_euler = (math.radians(90), 0, 0)
cam.data.lens = 22; cam.data.shift_y = 0.15; cam.data.clip_end = 6000
sc.camera = cam
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print('ok')
