"""LE LAGON V8 — grand drop ouest et modules rehaussés, Blender 4.5 LTS.

Dans Blender : Scripting > Open > le_lagon_v8.py > Run Script. F12 pour le rendu.
Crée une NOUVELLE scène, sans supprimer les scènes ou objets existants.
Base : plan V7. V8 : Anse symétrique, Dunes rehaussées, nouveau drop ouest.
Textures entièrement procédurales ; aucun fichier ou module externe requis.

En ligne de commande :
blender --background --python le_lagon_v8.py -- --save --render --output ./rendus-v8
Options : --preview (rapide), --top (vue de dessus), --validate.
"""

import argparse
import json
import math
import os
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector
from mathutils.geometry import tessellate_polygon

# ------------------------- Réglages artistiques -------------------------
PLAN_SCALE = 0.60                 # mètres par unité du dessin ; ~37 x 27 m
HEIGHTS = {"QA": 1.50, "QB": 1.10, "QC": 1.80, "QD": 1.15}
ORIGINAL_MAX_HEIGHT = 1.35
DROP_HEIGHT = 3.80                # > 2 × ancien maximum, et > 2 × nouvelle Anse
DROP_LIP_ANGLE = 75.0             # degrés au sommet, raccord circulaire au flat
DROP_Y_RANGE = (15.0, 29.0)       # entre les Dunes et les Palmiers, largeur 8,40 m
DROP_TOE_X = 10.5
DROP_LIP_X = 5.5                  # projection horizontale de la descente : 3 m
DROP_BACK_X = 3.5                 # plateforme de départ : profondeur 1,20 m
TABLETOP_HEIGHT = 0.95
LEDGE_HEIGHT = 0.38
SLAB_THICKNESS = 0.24
TRANSITION_STEPS = 32
ARC_STEP_DEGREES = 1.5
RENDER_SIZE = (2200, 1400)
RENDER_SAMPLES = 128
SEED = 17

OUTLINE = [
    ((7, 3), (15, -.5), (24, 2.2), (32, 2.4)),
    ((32, 2.4), (39, 2.4), (45, .5), (52, 1.7)),
    ((52, 1.7), (59, 2.6), (63, 8), (62.5, 16)),
    ((62.5, 16), (62.5, 20), (61, 22), (62, 27)),
    ((62, 27), (64, 35), (59, 40.5), (52, 42.3)),
    ((52, 42.3), (44, 44.4), (38, 42.8), (32, 44)),
    ((32, 44), (24, 46), (13, 44), (7, 40)),
    ((7, 40), (1.2, 36), (.6, 30), (2, 24)),
    ((2, 24), (3, 20), (1, 17), (2, 11)),
    ((2, 11), (2.8, 7.4), (4.4, 4.5), (7, 3)),
]
POCKETS = [
    ("QA", (15, 30), 90, 180, 1, 1, "Les Dunes"),
    ("QB", (15, 14), 180, 270, 1, 1, "Les Palmiers"),
    ("QC", (49, 14), 270, 450, 1, 1, "L'Anse du Large"),
    ("QD", (49, 30), 0, 90, 1, 1, "Le Retour du Soleil"),
]
SCENE = None
COLLECTIONS = {}
MATERIALS = {}


def xyz(p, z=0):
    """SVG : X vers la droite, Y vers le bas. Blender : nord vers +Y."""
    return ((p[0] - 32) * PLAN_SCALE, (23 - p[1]) * PLAN_SCALE, z)


def bezier(points, t):
    a, b, c, d = points
    return tuple((1-t)**3*a[k] + 3*(1-t)**2*t*b[k]
                 + 3*(1-t)*t*t*c[k] + t**3*d[k] for k in range(2))


def sample_path(segments, n=24):
    return [bezier(s, i/n) for s in segments for i in range(n)]


def mix2(a, b, t):
    return (a[0]*(1-t)+b[0]*t, a[1]*(1-t)+b[1]*t)


def collection(name):
    if name not in COLLECTIONS:
        c = bpy.data.collections.new(name)
        SCENE.collection.children.link(c)
        COLLECTIONS[name] = c
    return COLLECTIONS[name]


def node(mat, kind, name=None):
    n = mat.node_tree.nodes.new(kind)
    if name:
        n.label = name
    return n


def link(mat, a, b):
    mat.node_tree.links.new(a, b)


def mathnode(mat, op, a, b=None):
    n = node(mat, 'ShaderNodeMath')
    n.operation = op
    for i, value in enumerate((a, b)):
        if value is None:
            continue
        if isinstance(value, (int, float)):
            n.inputs[i].default_value = value
        else:
            link(mat, value, n.inputs[i])
    return n.outputs[0]


def color_mix(mat, factor, a, b):
    n = node(mat, 'ShaderNodeMixRGB')
    link(mat, factor, n.inputs[0])
    for i, val in enumerate((a, b), 1):
        if isinstance(val, tuple):
            n.inputs[i].default_value = (*val, 1)
        else:
            link(mat, val, n.inputs[i])
    return n.outputs[0]


def concrete(name, low, high, rough=.73, bump=.012):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.diffuse_color = (*high, 1)
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = rough
    geo = node(m, 'ShaderNodeNewGeometry')
    coarse = node(m, 'ShaderNodeTexNoise', 'Nuages et variations de coulage')
    coarse.inputs['Scale'].default_value = 1.1
    coarse.inputs['Detail'].default_value = 4
    coarse.inputs['Roughness'].default_value = .72
    link(m, geo.outputs['Position'], coarse.inputs['Vector'])
    ramp = node(m, 'ShaderNodeValToRGB', 'Palette minérale')
    ramp.color_ramp.elements[0].position = .18
    ramp.color_ramp.elements[0].color = (*low, 1)
    ramp.color_ramp.elements[1].position = .83
    ramp.color_ramp.elements[1].color = (*high, 1)
    link(m, coarse.outputs['Fac'], ramp.inputs[0])
    link(m, ramp.outputs['Color'], bsdf.inputs['Base Color'])
    pores = node(m, 'ShaderNodeTexNoise', 'Micrograin du béton')
    pores.inputs['Scale'].default_value = 145
    pores.inputs['Detail'].default_value = 2
    link(m, geo.outputs['Position'], pores.inputs['Vector'])
    bn = node(m, 'ShaderNodeBump')
    bn.inputs['Strength'].default_value = .24
    bn.inputs['Distance'].default_value = bump
    link(m, pores.outputs['Fac'], bn.inputs['Height'])
    link(m, bn.outputs['Normal'], bsdf.inputs['Normal'])
    rm = node(m, 'ShaderNodeMapRange')
    rm.inputs['To Min'].default_value = rough-.10
    rm.inputs['To Max'].default_value = min(rough+.10, 1)
    link(m, coarse.outputs['Fac'], rm.inputs['Value'])
    link(m, rm.outputs['Result'], bsdf.inputs['Roughness'])
    return m


def mural():
    m = concrete('Lagon | fresque vagues turquoise et soleil',
                 (.55, .49, .36), (.82, .76, .60), .76, .005)
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    uv = node(m, 'ShaderNodeTexCoord')
    sep = node(m, 'ShaderNodeSeparateXYZ')
    link(m, uv.outputs['UV'], sep.inputs[0])
    u, v = sep.outputs['X'], sep.outputs['Y']
    # U en mètres le long du mur, V en fraction de sa hauteur.
    phase = mathnode(m, 'MULTIPLY', u, 1.25)
    wave = mathnode(m, 'SINE', phase)
    edge = mathnode(m, 'ADD', mathnode(m, 'MULTIPLY', wave, .15), .40)
    edge2 = mathnode(m, 'ADD', mathnode(m, 'MULTIPLY',
                    mathnode(m, 'SINE', mathnode(m, 'ADD', phase, 1.4)), .16), .60)
    mask = mathnode(m, 'LESS_THAN', v, edge)
    mask2 = mathnode(m, 'LESS_THAN', v, edge2)
    cream = (.77, .70, .53)
    col = color_mix(m, mask2, cream, (.11, .44, .46))
    col = color_mix(m, mask, col, (.015, .23, .29))
    # Disques ocre répétés, dans la partie haute de la fresque.
    xx = mathnode(m, 'SUBTRACT', mathnode(m, 'PINGPONG', u, 4.5), 2.25)
    yy = mathnode(m, 'MULTIPLY', mathnode(m, 'SUBTRACT', v, .72), 1.25)
    dist = mathnode(m, 'ADD', mathnode(m, 'MULTIPLY', xx, xx),
                    mathnode(m, 'MULTIPLY', yy, yy))
    sun = mathnode(m, 'LESS_THAN', dist, .072)
    sun = mathnode(m, 'MULTIPLY', sun, mathnode(m, 'GREATER_THAN', v, edge2))
    col = color_mix(m, sun, col, (.88, .43, .10))
    # Un léger grain de peinture laisse la matière visible sans salir le dessin.
    noise = node(m, 'ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 70
    link(m, uv.outputs['UV'], noise.inputs['Vector'])
    wear = mathnode(m, 'MULTIPLY', noise.outputs['Fac'], .08)
    col = color_mix(m, wear, col, cream)
    link(m, col, bsdf.inputs['Base Color'])
    return m


def make_materials():
    MATERIALS['sand'] = concrete('Lagon | béton sable fin', (.49, .43, .32), (.72, .65, .51))
    MATERIALS['deck'] = concrete('Lagon | couronnement ivoire', (.62, .56, .44), (.84, .77, .62))
    MATERIALS['blue'] = concrete('Lagon | béton bleu lagon poli', (.17, .34, .41), (.40, .60, .65), .55, .006)
    MATERIALS['side'] = concrete('Lagon | béton des chants', (.36, .35, .30), (.56, .52, .43))
    MATERIALS['mural'] = mural()
    for key, name, color, metal, rough in [
        ('steel', 'acier bleu nuit', (.045, .10, .13), .80, .28),
        ('edge', 'acier poli des arêtes', (.36, .46, .48), .88, .24),
        ('joint', 'joints de coulage', (.24, .23, .19), 0, .9),
        ('line', 'liseré turquoise', (.035, .27, .31), .1, .57),
    ]:
        m = bpy.data.materials.new('Lagon | '+name)
        m.use_nodes = True
        m.diffuse_color = (*color, 1)
        p = m.node_tree.nodes.get('Principled BSDF')
        p.inputs['Base Color'].default_value = (*color, 1)
        p.inputs['Metallic'].default_value = metal
        p.inputs['Roughness'].default_value = rough
        MATERIALS[key] = m


def mesh_object(name, verts, faces, group, mats, indices=None, uv=None, smooth=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    obj = bpy.data.objects.new(name, me)
    collection(group).objects.link(obj)
    for m in mats:
        me.materials.append(MATERIALS[m])
    if uv:
        layer = me.uv_layers.new(name='Lagon_UV')
        for poly in me.polygons:
            for li in poly.loop_indices:
                layer.data[li].uv = uv[me.loops[li].vertex_index]
    for i, poly in enumerate(me.polygons):
        poly.material_index = indices[i] if indices else 0
        poly.use_smooth = smooth[i] if smooth else False
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(me)
    bm.free()
    me.update()
    # Empêche les abouts plans de fausser les normales des surfaces courbes.
    me.set_sharp_from_angle(angle=math.radians(35))
    return obj


def bevel(obj, width=.018, segments=3):
    mod = obj.modifiers.new('Arêtes adoucies', 'BEVEL')
    mod.width, mod.segments = width, segments
    mod.limit_method = 'ANGLE'
    mod.angle_limit = math.radians(35)


def extrude_polygon(name, points, z, group, top='deck', side='side', base=-.012):
    n = len(points)
    verts = [xyz(p, zz) for zz in (base, z) for p in points]
    # Triangulation explicite : le contour du parc est concave.
    flat = [Vector((p[0], p[1], 0)) for p in points]
    lookup = {(round(v.x, 5), round(v.y, 5)): i for i, v in enumerate(flat)}
    tris = [[v if isinstance(v, int) else lookup[(round(v.x, 5), round(v.y, 5))] for v in t]
            for t in tessellate_polygon([flat])]
    faces = [tuple(i+n for i in t) for t in tris] + [tuple(reversed(t)) for t in tris]
    idx = [0]*len(tris)+[1]*len(tris)
    uv = [(0, 0)]*(2*n)
    for i in range(n):
        j = (i+1) % n
        faces.append((i, j, j+n, i+n))
        idx.append(1)
    obj = mesh_object(name, verts, faces, group, [top, side], idx, uv)
    return obj


def box(name, x, y, w, d, h, group, top='deck', side='side', base=-.01, edge=.018):
    o = extrude_polygon(name, [(x,y), (x+w,y), (x+w,y+d), (x,y+d)], h, group, top, side, base)
    if edge:
        bevel(o, edge)
    return o


def tube(name, points, radius, group, material='steel', cyclic=False):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.resolution_u = 2
    cu.bevel_depth = radius
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    sp = cu.splines.new('POLY')
    sp.points.add(len(points)-1)
    for p, co in zip(sp.points, points):
        p.co = (*co, 1)
    sp.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, cu)
    collection(group).objects.link(obj)
    cu.materials.append(MATERIALS[material])
    return obj


def steep_profile(width, height, lip_angle, steps):
    """Profil monotone : arc tangent au sol, puis pente droite tangente à l'arc.

    Contrairement à un arc unique très haut, cette forme ne se retourne pas
    au-dessus du flat. La pente haute est explicitement limitée à lip_angle.
    Les deux extrémités ont exactement les coordonnées pied / sommet demandées.
    """
    a = math.radians(lip_angle)
    radius = (width-height/math.tan(a))/(math.sin(a)-(1-math.cos(a))/math.tan(a))
    straight = (height-radius*(1-math.cos(a)))/math.sin(a)
    if radius <= 0 or straight < 0:
        raise ValueError('Largeur/hauteur incompatibles avec cet angle de drop')
    arc_length = radius*a
    total = arc_length+straight
    result=[]
    for j in range(steps+1):
        s=total*j/steps
        if s <= arc_length:
            theta=s/radius
            x,z=radius*math.sin(theta),radius*(1-math.cos(theta))
        else:
            x=radius*math.sin(a)+(s-arc_length)*math.cos(a)
            z=radius*(1-math.cos(a))+(s-arc_length)*math.sin(a)
        result.append((x/width,z))
    result[0]=(0.0,0.0)
    result[-1]=(1.0,height)
    return result


def strip(name, rows, height, group, u_start=0, lip_angle=None):
    """Solide balayé : transition circulaire, deck, façade, dessous, abouts.

    Chaque row = (pied, coping, bord extérieur) dans les coordonnées du plan.
    La transition est tangente au flat ; sa largeur XY reste exactement celle du plan.
    """
    verts, uv, faces, indices, smooth = [], [], [], [], []
    count = TRANSITION_STEPS
    cols = count+4
    length = u_start
    for i, (toe, lip, outer) in enumerate(rows):
        if i:
            length += math.dist(xyz(rows[i-1][2]), xyz(outer))
        width = math.dist(xyz(toe), xyz(lip))
        if lip_angle is not None:
            cross_section=steep_profile(width,height,lip_angle,count)
        else:
            angle = 2*math.atan2(height, width)
            if angle > math.pi/2+1e-7:
                raise ValueError('Quarter trop haut pour son emprise : élargir la transition')
            radius = (width*width+height*height)/(2*height)
            cross_section=[(radius*math.sin(angle*j/count)/width,
                            radius*(1-math.cos(angle*j/count))) for j in range(count+1)]
        profile=[(mix2(toe,lip,t),z) for t,z in cross_section]
        profile.extend([(outer, height), (outer, -.014), (toe, -.014)])
        for p, z in profile:
            verts.append(xyz(p, z))
            uv.append((length, max(0, z/height)))
    for i in range(len(rows)-1):
        for j in range(cols):
            k = (j+1) % cols
            faces.append((i*cols+j, (i+1)*cols+j, (i+1)*cols+k, i*cols+k))
            # Matériaux : transition / deck / fresque / dessous.
            indices.append(0 if j<count else 1 if j==count else 2 if j==count+1 else 3)
            smooth.append(j<count or j==count+1)
    faces.extend([tuple(reversed(range(cols))), tuple((len(rows)-1)*cols+j for j in range(cols))])
    indices.extend([3, 3])
    smooth.extend([False, False])
    obj = mesh_object(name, verts, faces, group, ['blue','deck','mural','side'], indices, uv, smooth)
    tube(name+' | coping', [xyz(r[1], height+.014) for r in rows], .028, group)
    # Ligne de coulage très fine au pied, et joints radiaux espacés.
    tube(name+' | joint au pied', [xyz(r[0], .003) for r in rows], .0035, group, 'joint')
    for ri in range(10, len(rows)-5, 22):
        p = [tuple(verts[ri*cols+j][k]+(.002 if k==2 else 0) for k in range(3))
             for j in range(count+1)]
        tube(name+f' | joint {ri:03}', p, .0022, group, 'joint')
    obj['hauteur_m'] = height
    obj['mural_u_end'] = length
    obj['source'] = 'Plan V7 : rayons pied 5.5 / coping 8.5 / deck 10.2'
    return obj


def build_high_drop():
    rows=[]
    for i in range(57):
        y=DROP_Y_RANGE[0]+(DROP_Y_RANGE[1]-DROP_Y_RANGE[0])*i/56
        rows.append(((DROP_TOE_X,y),(DROP_LIP_X,y),(DROP_BACK_X,y)))
    obj=strip('E | grand drop ouest',rows,DROP_HEIGHT,'E — Grand drop ouest',
              lip_angle=DROP_LIP_ANGLE)
    obj['source']='Ajout V8 : ouverture entre les Dunes et les Palmiers'
    obj['pente_haute_degres']=DROP_LIP_ANGLE
    obj['direction_descente']='Est, vers le centre du parc'
    obj['ancien_max_m']=ORIGINAL_MAX_HEIGHT
    obj['rapport_ancien_max']=DROP_HEIGHT/ORIGINAL_MAX_HEIGHT


def build_quarters():
    endings = {}
    for code, center, a, b, sx, sy, label in POCKETS:
        steps = math.ceil((b-a)/ARC_STEP_DEGREES)
        rows = []
        for i in range(steps+1):
            theta = math.radians(a+(b-a)*i/steps)
            rows.append(tuple((center[0]+r*sx*math.cos(theta),
                               center[1]+r*sy*math.sin(theta)) for r in (5.5,8.5,10.2)))
        obj = strip(code+' | '+label, rows, HEIGHTS[code], code+' — '+label)
        if code=='QC':
            obj['source']='V8 : demi-cercle 180 degrés, rayons identiques, ouverture vers ouest'
        endings[code] = obj['mural_u_end']
    # QB, prolongement EXACT des trois courbes du dessin.
    rows = []
    for i in range(41):
        t = i/40
        rows.append((bezier(((15,8.5),(17,8.5),(20,8),(22,8.5)),t),
                     bezier(((15,5.5),(17,5.5),(20,5),(22,5.5)),t),
                     bezier(((15,3.8),(17,3.4),(20,3.9),(22,3.8)),t)))
    strip('QB | prolongement vers les marches', rows, HEIGHTS['QB'], 'QB — Les Palmiers', endings['QB'])
    # QD, retour long en vague : pied, coping et terrasse suivent le plan.
    rows = []
    for i in range(51):
        t = i/50
        rows.append((bezier(((49,35.5),(45.5,35.5),(43,34.6),(41,33.7)),t),
                     bezier(((49,38.5),(44.5,38.5),(42.5,37.6),(39,36.7)),t),
                     bezier(((49,40.2),(44,40.2),(40.5,39.4),(37.6,38.1)),t)))
    strip('QD | retour en vague', rows, HEIGHTS['QD'], 'QD — Le Retour du Soleil', endings['QD'])


def ramp(name, x, y, w, d, heights, group, top='blue', side='side'):
    """Prisme à quatre hauteurs, ordre NW NE SE SW du plan."""
    points = [(x,y),(x+w,y),(x+w,y+d),(x,y+d)]
    verts = [xyz(p,-.014) for p in points]+[xyz(p,z) for p,z in zip(points,heights)]
    faces = [(4,5,6,7),(3,2,1,0),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    # UV par face pour que la fresque ne soit pas dégénérée sur les côtés.
    o = mesh_object(name,verts,faces,group,[top,side],[0,1,1,1,1,1])
    return o


def build_street():
    g = 'QA — Les Dunes'
    h = HEIGHTS['QA']
    ramp('A | bank droit 8 × 3 unités',15,35.5,8,3,(0,0,h,h),g)
    pts = [(15,38.5),(23,38.5)]
    pts += [bezier(((23,38.5),(24,39),(23.5,40.8),(22.2,40.8)),i/20) for i in range(1,21)]
    pts += [(16,40.7)]
    pts += [bezier(((16,40.7),(15.33,40.7),(15,40.53),(15,40.2)),i/12) for i in range(1,13)]
    o = extrude_polygon('A | terrasse arrondie',pts,h,g,'deck','mural')
    wall_uv(o, h)
    tube('A | seuil du bank',[xyz((15,38.5),h+.007),xyz((23,38.5),h+.007)],.018,g,'edge')

    g = 'QB — Les Palmiers'
    h = HEIGHTS['QB']
    pts = sample_path([((22,3.8),(25,3.2),(27,3.4),(29.5,3.8)),
                       ((29.5,3.8),(32,3.7),(33.7,4.6),(33,7))],24)
    pts += [(33,7),(22,7)]
    o=extrude_polygon('B | terrasse des marches',pts,h,g,'deck','mural')
    wall_uv(o,h)
    # Quatre contremarches : la première descend depuis la terrasse.
    for i in range(4):
        z = h*(3-i)/4
        if z>0:
            box(f'M | marche {i+1}',25,7+.9*i,4,.9,z,g,edge=.008)
        tube(f'M | nez {i+1}',[xyz((25,7+.9*i),h*(4-i)/4+.003),
                              xyz((29,7+.9*i),h*(4-i)/4+.003)],.008,g,'edge')
    ramp('M | bank adjacent',30.5,7,2.5,3.6,(h,h,0,0),g)
    ramp('M | hubba',24.4,7,.45,3.6,(h+.26,h+.26,.26,.26),g,'deck')
    tube('M | arête acier du hubba',[xyz((24.85,7),h+.27),xyz((24.85,10.6),.27)],.022,g,'edge')
    a,b = xyz((29.6,6.8),h+.60),xyz((29.6,10.8),.60)
    tube('M | main courante', [a,b], .026,g)
    for i,t in enumerate((.05,.5,.95)):
        y = 6.8+4*t
        z = h*(1-t)
        tube(f'M | support main courante {i+1}',[xyz((29.6,y),max(.01,z-.04)),
             tuple(a[k]*(1-t)+b[k]*t for k in range(3))],.022,g)
    # Les supports traversent un petit socle incliné relié à la plateforme.
    ramp('M | muret sous main courante',29.4,7,.4,3.6,(h,h,0,0),g,'sand')

    g = 'Street — rail, ledge et tabletop'
    tube('R | rail bas 14 unités',[xyz((24,17),.42),xyz((38,17),.42)],.032,g)
    for i in range(5):
        x=24+i*3.5
        tube(f'R | pied {i+1}',[xyz((x,17),.02),xyz((x,17),.42)],.025,g)
        box(f'R | platine {i+1}',x-.13,16.87,.26,.26,.018,g,'steel','steel',edge=.004)
        for dx in (-.085,.085):
            for dy in (-.085,.085):
                tube('R | boulon',[xyz((x+dx,17+dy),.018),xyz((x+dx,17+dy),.027)],.008,g,'edge')
    box('L | ledge long 13 × 1.2 unités',23,29,13,1.2,LEDGE_HEIGHT,g)
    for y in (29.02,30.18):
        tube('L | cornière de grind',[xyz((23.06,y),LEDGE_HEIGHT+.004),
             xyz((35.94,y),LEDGE_HEIGHT+.004)],.018,g,'edge')
    h=TABLETOP_HEIGHT
    ramp('P | bank ouest',33.5,21,2.5,6,(0,h,h,0),g)
    box('P | plateau plein',36,21,7,6,h,g,edge=.008)
    ramp('P | bank est',43,21,2.5,6,(h,0,0,h),g)
    # Les arêtes suivent les pentes, sans barre suspendue au-dessus des banks.
    tube('P | arête nord', [xyz((33.5,21.04),.012),xyz((36,21.04),h+.008),
         xyz((43,21.04),h+.008),xyz((45.5,21.04),.012)],.018,g,'edge')
    for x in (36,43):
        tube('P | raccord bank plateau',[xyz((x,21.05),h+.002),xyz((x,26.95),h+.002)],.006,g,'joint')


def wall_uv(obj, height):
    """Déroulage des chants des terrasses, avec U mesuré le long de chaque bord."""
    me = obj.data
    uv = me.uv_layers.active or me.uv_layers.new(name='Lagon_UV')
    offset=0
    for p in me.polygons:
        if p.material_index != 1 or len(p.vertices)!=4:
            continue
        coords=[me.vertices[vi].co for vi in p.vertices]
        # Projection horizontale sur le bord du quad.
        a=coords[0]
        axis=next((c-a for c in coords if (Vector((c.x-a.x,c.y-a.y,0))).length>.0001),Vector((1,0,0)))
        axis.z=0
        axis.normalize()
        for li in p.loop_indices:
            co=me.vertices[me.loops[li].vertex_index].co
            uv.data[li].uv=(offset+(co-a).dot(axis),max(0,co.z/height))
        offset+=max((c-a).dot(axis) for c in coords)


def point_inside(p, poly):
    x,y=p
    inside=False
    j=len(poly)-1
    for i,(xi,yi) in enumerate(poly):
        xj,yj=poly[j]
        if (yi>y)!=(yj>y) and x<(xj-xi)*(y-yi)/(yj-yi)+xi:
            inside=not inside
        j=i
    return inside


def build_floor():
    outline=sample_path(OUTLINE,32)
    obj=extrude_polygon('Socle | contour organique V7',outline,0,'Sol — contour V7',
                        'sand','side',-SLAB_THICKNESS)
    # Liseré noyé dans le bord, pas de trottoir ni décor autour du parc.
    tube('Socle | liseré périphérique',[xyz(p,.004) for p in outline],.018,
         'Sol — contour V7','line',True)
    # Joints de retrait fins, découpés strictement au contour.
    for horizontal in (True,False):
        for level in range(6,61 if not horizontal else 43,6):
            run=[]
            for i in range(641):
                t=i*.1
                p=(t,level) if horizontal else (level,t)
                if point_inside(p,outline):
                    run.append(xyz(p,.001))
                elif run:
                    if len(run)>1:
                        tube('Sol | joint de retrait',run,.003,'Sol — joints','joint')
                    run=[]
            if len(run)>1:
                tube('Sol | joint de retrait',run,.003,'Sol — joints','joint')
    obj['plan_scale_m_per_unit']=PLAN_SCALE
    return outline


def aim(obj, target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()


def camera(name, location, target, ortho):
    data=bpy.data.cameras.new(name)
    data.type='ORTHO'
    data.ortho_scale=ortho
    data.lens=50
    data.clip_end=500
    obj=bpy.data.objects.new(name,data)
    collection('Studio — caméras et lumières').objects.link(obj)
    obj.location=location
    aim(obj,target)
    return obj


def light(name, kind, location, energy, color, size=10):
    d=bpy.data.lights.new(name,kind)
    d.energy=energy
    d.color=color
    if kind=='AREA':
        d.shape='DISK'
        d.size=size
    elif kind=='SUN':
        d.angle=.13
    obj=bpy.data.objects.new(name,d)
    collection('Studio — caméras et lumières').objects.link(obj)
    obj.location=location
    aim(obj,(0,0,0))
    return obj


def setup_scene(preview=False, top=False):
    global SCENE
    SCENE=bpy.data.scenes.new('LE LAGON | V8')
    if bpy.context.window:
        bpy.context.window.scene=SCENE
    SCENE.unit_settings.system='METRIC'
    SCENE.unit_settings.length_unit='METERS'
    SCENE.render.engine='CYCLES'
    SCENE.cycles.samples=24 if preview else RENDER_SAMPLES
    SCENE.cycles.use_denoising=True
    SCENE.cycles.seed=SEED
    SCENE.cycles.max_bounces=6
    SCENE.render.resolution_x=1100 if preview else RENDER_SIZE[0]
    SCENE.render.resolution_y=(850 if preview else 1700) if top else (700 if preview else RENDER_SIZE[1])
    SCENE.render.resolution_percentage=100
    SCENE.render.image_settings.file_format='PNG'
    SCENE.render.image_settings.color_mode='RGBA'
    SCENE.render.image_settings.color_depth='8'
    SCENE.render.film_transparent=True
    SCENE.view_settings.view_transform='AgX'
    SCENE.view_settings.look='AgX - Medium High Contrast'
    SCENE.view_settings.exposure=.35
    world=bpy.data.worlds.new('Lagon | lumière ambiante invisible')
    world.use_nodes=True
    world.node_tree.nodes['Background'].inputs['Color'].default_value=(.70,.81,1,1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value=.45
    SCENE.world=world
    hero=camera('Camera | vue illustrée',(19,-32,30),(0,0,.1),47)
    front=camera('Camera | face fidèle au dessin',(2,-38,31),(0,0,.1),44)
    overhead=camera('Camera | plan de dessus',(0,0,60),(0,0,0),43)
    overhead.rotation_euler=(0,0,0)
    camera('Camera | détail marches',(-2,1,10),xyz((27,8),.5),13)
    camera('Camera | grand drop ouest',(-1,-10,15),xyz((6.5,22),1.4),19)
    SCENE.camera=overhead if top else front
    light('Soleil doux','SUN',(-20,-15,30),2.3,(1,.89,.72))
    light('Grande boîte à lumière','AREA',(-12,-8,24),1800,(1,.91,.77),18)
    light('Rebond bleu','AREA',(16,12,18),1300,(.68,.84,1),14)
    SCENE['source']='V8 — base V7 ; grand drop ouest, Anse symétrique à 1.80 m, Dunes à 1.50 m'
    SCENE['background']='Transparent RGBA ; aucun décor extérieur'
    SCENE['version_script']='2.0'
    return SCENE


def validate():
    errors=[]
    meshes=[o for o in SCENE.objects if o.type=='MESH']
    for o in meshes:
        bm=bmesh.new()
        bm.from_mesh(o.data)
        bad=[e for e in bm.edges if not e.is_manifold]
        deg=[f for f in bm.faces if f.calc_area()<1e-10]
        if bad:
            errors.append(f'{o.name}: {len(bad)} arêtes non manifold')
        if deg:
            errors.append(f'{o.name}: {len(deg)} faces dégénérées')
        bm.free()
    expected={'QA':(15,30),'QB':(15,14),'QC':(49,14),'QD':(49,30)}
    for code,center,*_ in POCKETS:
        assert tuple(center)==expected[code]
    assert SCENE.render.film_transparent
    assert DROP_HEIGHT >= 2*ORIGINAL_MAX_HEIGHT
    assert DROP_HEIGHT >= 2*max(HEIGHTS.values())
    report={'blender':bpy.app.version_string,'objects':len(SCENE.objects),
            'meshes':len(meshes),'vertices':sum(len(o.data.vertices) for o in meshes),
            'transparent':True,'errors':errors,
            'note':'Volumes fermés vérifiés séparément ; raccords entre pièces non fusionnés.'}
    if errors:
        raise RuntimeError(json.dumps(report,ensure_ascii=False,indent=2))
    return report


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--save',action='store_true')
    parser.add_argument('--render',action='store_true')
    parser.add_argument('--preview',action='store_true')
    parser.add_argument('--top',action='store_true')
    parser.add_argument('--validate',action='store_true')
    parser.add_argument('--output',default='')
    argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    args=parser.parse_args(argv)
    setup_scene(args.preview,args.top)
    make_materials()
    build_floor()
    build_quarters()
    build_street()
    build_high_drop()
    SCENE.view_layers[0].update()
    # Vue caméra prête dès l'exécution dans l'éditeur de texte.
    if bpy.context.screen:
        for area in bpy.context.screen.areas:
            if area.type=='VIEW_3D':
                area.spaces.active.region_3d.view_perspective='CAMERA'
                area.spaces.active.clip_end=500
    report=validate()
    print('LE LAGON :',json.dumps(report,ensure_ascii=False))
    if args.output:
        out=Path(args.output).expanduser().resolve()
    elif '__file__' in globals() and os.path.isfile(__file__):
        out=Path(__file__).resolve().parent/'rendus-v8'
    else:
        out=Path(bpy.app.tempdir)/'le-lagon-v8'
    # L'exécution dans l'interface n'écrit aucun fichier automatiquement.
    if args.save or args.render or args.validate:
        out.mkdir(parents=True,exist_ok=True)
    if args.validate:
        (out/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    SCENE.render.filepath=str(out/('le-lagon-v8-plan.png' if args.top else 'le-lagon-v8-perspective.png'))
    if args.save:
        bpy.ops.wm.save_as_mainfile(filepath=str(out/'le-lagon-v8.blend'))
    if args.render:
        bpy.ops.render.render(write_still=True,scene=SCENE.name)
    return SCENE


if __name__=='__main__':
    main()
