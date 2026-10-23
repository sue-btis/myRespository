"""Piezas 3D conceptuales para el portafolio.

blender -b --python-exit-code 1 --python modelos/piezas.py -- [--solo a,b] [--muestras N] [--resolucion PCT] [--sin-render] [--conceptos]
"""
import argparse
import json
import math
import random
import sys
import time
from math import cos, pi, radians, sin, sqrt
from pathlib import Path

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

RAIZ = Path(__file__).resolve().parent
SALIDA = RAIZ / 'render'
ROLES = ('cuerpo', 'secundario', 'metal', 'acento', 'vidrio', 'crema', 'azul', 'frambuesa', 'luz')

# Paletas fijadas por el dueño en src/styles/tokens.css, una por cara.
PALETAS = {
    'neutral_b': dict(cuerpo='#ECECEC', secundario='#16324A', metal='#90CCF4', acento='#F3D250'),
    'fullstack': dict(cuerpo='#3B8BEB', secundario='#14264A', metal='#C2CBDA', acento='#B23850', vidrio='#DCEBF5'),
    'ai': dict(cuerpo='#304C64', secundario='#26425A', metal='#A4CCD4', acento='#E2480C'),
    'data': dict(cuerpo='#EDE8F5', secundario='#26346B', metal='#ADBBDA', acento='#7091E6'),
    'design': dict(cuerpo='#273DB4', secundario='#141414', metal='#C9C4C0', acento='#F95CA4', vidrio='#CFE3F2'),
    # Conceptos Full-stack: "Snowy Yet Warm" completa, con crema y azul pintados y luz azul emisiva.
    'conceptos': dict(cuerpo='#C4DBF6', secundario='#14264A', metal='#8590AA', acento='#B23850', vidrio='#C4DBF6',
                      crema='#E7E3D4', azul='#3B8BEB', frambuesa='#B23850', luz='#3B8BEB'),
}
# rugosidad, metalico, emision
ACABADO = dict(cuerpo=(0.38, 0.0, 0.0), secundario=(0.55, 0.15, 0.0), metal=(0.34, 0.85, 0.0), acento=(0.4, 0.0, 4.0), vidrio=(0.04, 0.0, 0.0),
                crema=(0.42, 0.0, 0.0), azul=(0.32, 0.1, 0.0), frambuesa=(0.38, 0.0, 0.0), luz=(0.4, 0.0, 5.0))


def lineal(hexa):
    c = int(hexa.lstrip('#'), 16)
    f = lambda v: v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return tuple(f(((c >> s) & 255) / 255) for s in (16, 8, 0))


def material(nombre, hexa, rugosidad=0.5, metalico=0.0, emision=0.0):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lineal(hexa), 1)
    b.inputs['Roughness'].default_value = rugosidad
    b.inputs['Metallic'].default_value = metalico
    if emision:
        b.inputs['Emission Color'].default_value = (*lineal(hexa), 1)
        b.inputs['Emission Strength'].default_value = emision
    return m


def anillo_perfil(r0, r1, z0, z1, c=0.0):
    if c == 0:
        return [(r0, z0), (r1, z0), (r1, z1), (r0, z1)]
    return [(r0 + c, z0), (r1 - c, z0), (r1, z0 + c), (r1, z1 - c), (r1 - c, z1), (r0 + c, z1), (r0, z1 - c), (r0, z0 + c)]


def disco_perfil(r, z0, z1, c=0.0):
    if c == 0:
        return [(0, z0), (r, z0), (r, z1), (0, z1)]
    return [(0, z0), (r - c, z0), (r, z0 + c), (r, z1 - c), (r - c, z1), (0, z1)]


class Parte:
    def __init__(self, pieza, nombre, loc, rot, explota):
        self.pieza, self.nombre = pieza, nombre
        self.loc, self.rot, self.explota = Vector(loc), rot, Vector(explota)
        self.bm = bmesh.new()

    @staticmethod
    def _base(pos, rot, M):
        B = Matrix.Translation(pos) @ Euler(rot).to_matrix().to_4x4()
        return M @ B if M is not None else B

    def _marca(self):
        bm = self.bm
        return set(bm.verts), set(bm.edges), set(bm.faces)

    def _cierra(self, n0, rol, bev, seg, filtro=None, despues=None):
        # bmesh reutiliza huecos tras un bevel: los elementos nuevos no son una cola contigua, se detectan por diferencia.
        bm = self.bm
        idx = ROLES.index(rol)
        for f in bm.faces:
            if f not in n0[2]:
                f.material_index = idx
        if bev:
            ed = [e for e in bm.edges if e not in n0[1] and len(e.link_faces) == 2 and e.calc_face_angle(0) > 0.6 and (filtro is None or filtro(e))]
            if ed:
                bmesh.ops.bevel(bm, geom=ed, offset=bev, segments=seg, profile=0.5, affect='EDGES', clamp_overlap=True)
        if despues is not None:
            bmesh.ops.transform(bm, matrix=despues, verts=[v for v in bm.verts if v not in n0[0]])

    def caja(self, size, pos=(0, 0, 0), rot=(0, 0, 0), rol='cuerpo', bev=0.012, seg=2, M=None):
        n0 = self._marca()
        bmesh.ops.create_cube(self.bm, size=1.0, matrix=self._base(pos, rot, M) @ Matrix.Diagonal((*size, 1)))
        self._cierra(n0, rol, bev, seg)

    def bloque(self, w0, d0, w1, d1, h, pos=(0, 0, 0), rot=(0, 0, 0), dx=0.0, dy=0.0, rol='cuerpo', bev=0.012, seg=2, M=None):
        """Prisma truncado: base w0 x d0 abajo, tapa w1 x d1 (desplazada dx, dy) arriba, alto h sobre Z."""
        n0 = self._marca()
        v = bmesh.ops.create_cube(self.bm, size=1.0)['verts']
        for a in v:
            top = a.co.z > 0
            w, d = (w1, d1) if top else (w0, d0)
            a.co = Vector((math.copysign(w / 2, a.co.x) + (dx if top else 0), math.copysign(d / 2, a.co.y) + (dy if top else 0), h / 2 if top else -h / 2))
        bmesh.ops.transform(self.bm, matrix=self._base(pos, rot, M), verts=v)
        self._cierra(n0, rol, bev, seg)

    def cil(self, r, h, pos=(0, 0, 0), eje='Z', seg=24, rol='metal', bev=0.0, r2=None, M=None, rot=(0, 0, 0)):
        n0 = self._marca()
        ej = {'Z': Matrix.Identity(4), 'X': Matrix.Rotation(pi / 2, 4, 'Y'), 'Y': Matrix.Rotation(-pi / 2, 4, 'X')}[eje]
        bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h,
                              matrix=self._base(pos, rot, M) @ ej, calc_uvs=False)
        self._cierra(n0, rol, bev, 1)

    def esf(self, r, pos=(0, 0, 0), seg=20, rol='acento', M=None):
        n0 = self._marca()
        bmesh.ops.create_uvsphere(self.bm, u_segments=seg, v_segments=max(seg // 2, 6), radius=r, matrix=self._base(pos, (0, 0, 0), M), calc_uvs=False)
        self._cierra(n0, rol, 0, 1)

    def ico(self, r, pos=(0, 0, 0), sub=2, rol='acento', M=None):
        n0 = self._marca()
        bmesh.ops.create_icosphere(self.bm, subdivisions=sub, radius=r, matrix=self._base(pos, (0, 0, 0), M), calc_uvs=False)
        self._cierra(n0, rol, 0, 1)

    def torno(self, perfil, seg=32, pos=(0, 0, 0), rot=(0, 0, 0), rol='cuerpo', bev=0.0, seg_bev=2, M=None, fase=0.0):
        """Revolución de un perfil cerrado (r, z) alrededor de Z."""
        bm = self.bm
        n0 = self._marca()
        filas = []
        for i in range(seg):
            a = 2 * pi * i / seg + fase
            fila = []
            for j, (r, z) in enumerate(perfil):
                if r < 1e-6:
                    fila.append(filas[0][j] if i else bm.verts.new((0, 0, z)))
                else:
                    fila.append(bm.verts.new((r * cos(a), r * sin(a), z)))
            filas.append(fila)
        n = len(perfil)
        for i in range(seg):
            a, b = filas[i], filas[(i + 1) % seg]
            for j in range(n):
                k = (j + 1) % n
                u = []
                for v in (a[j], b[j], b[k], a[k]):
                    if v not in u:
                        u.append(v)
                if len(u) >= 3:
                    bm.faces.new(u)
        bmesh.ops.transform(bm, matrix=self._base(pos, rot, M), verts=[v for v in bm.verts if v not in n0[0]])
        self._cierra(n0, rol, bev, seg_bev)

    def varilla(self, a, b, r, seg=10, rol='metal', bev=0.0):
        a, b = Vector(a), Vector(b)
        d = b - a
        q = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        self.cil(r, d.length, seg=seg, rol=rol, bev=bev, M=Matrix.Translation((a + b) / 2) @ q)

    def engranaje(self, N, m, h, r_hueco, pos=(0, 0, 0), fase=0.0, rol='metal', M=None, bev=0.004):
        rp = m * N / 2
        rt, rr = rp + 0.9 * m, rp - 1.2 * m
        paso = 2 * pi / N
        pts = []
        for k in range(N):
            a = k * paso + fase
            pts += [(a - 0.46 * paso, rr), (a - 0.20 * paso, rt), (a + 0.20 * paso, rt), (a + 0.46 * paso, rr)]
        n = len(pts)
        bm = self.bm
        n0 = self._marca()
        capas = []
        for z in (-h / 2, h / 2):
            fuera = [bm.verts.new((r * cos(a), r * sin(a), z)) for a, r in pts]
            dentro = [bm.verts.new((r_hueco * cos(a), r_hueco * sin(a), z)) for a, _ in pts]
            capas.append((fuera, dentro))
        for i in range(n):
            j = (i + 1) % n
            for fuera, dentro in capas:
                bm.faces.new((fuera[i], fuera[j], dentro[j], dentro[i]))
            bm.faces.new((capas[0][0][i], capas[0][0][j], capas[1][0][j], capas[1][0][i]))
            bm.faces.new((capas[0][1][i], capas[0][1][j], capas[1][1][j], capas[1][1][i]))
        self._cierra(n0, rol, bev, 1, filtro=lambda e: abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-6,
                     despues=self._base(pos, (0, 0, 0), M))

    def tornillos(self, lista, r=0.018, h=0.014, eje='Z', rol='metal', M=None):
        for pos in lista:
            self.cil(r, h, pos=pos, eje=eje, seg=8, rol=rol, M=M)

    def texto(self, txt, size, pos=(0, 0, 0), rot=(0, 0, 0), alto=0.006, rol='cuerpo'):
        """Rotulo en relieve: texto de Blender convertido a malla, centrado en pos."""
        cv = bpy.data.curves.new('rot', 'FONT')
        cv.body, cv.size, cv.extrude, cv.align_x, cv.align_y = txt, size, alto / 2, 'CENTER', 'CENTER'
        ob = bpy.data.objects.new('rot', cv)
        bpy.context.scene.collection.objects.link(ob)
        me = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        bpy.data.objects.remove(ob)
        n0 = self._marca()
        self.bm.from_mesh(me)
        bmesh.ops.transform(self.bm, matrix=Matrix.Translation(pos) @ Euler(rot).to_matrix().to_4x4(), verts=[v for v in self.bm.verts if v not in n0[0]])
        self._cierra(n0, rol, 0, 1)

    def fin(self):
        bm = self.bm
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        for f in bm.faces:
            f.smooth = True
        for e in bm.edges:
            if len(e.link_faces) == 2:
                e.smooth = e.calc_face_angle(0) < 0.7
        nombre = f'{self.pieza.clave}__{self.nombre}'
        me = bpy.data.meshes.new(nombre)
        bm.to_mesh(me)
        bm.free()
        usados = sorted({p.material_index for p in me.polygons})
        for i in usados:
            me.materials.append(self.pieza.mats[ROLES[i]])
        for p in me.polygons:
            p.material_index = usados.index(p.material_index)
        ob = bpy.data.objects.new(nombre, me)
        self.pieza.col.objects.link(ob)
        ob.location, ob.rotation_euler = self.loc, self.rot
        ob['explota'] = tuple(self.explota)
        self.pieza.partes.append(ob)
        return ob


class Pieza:
    def __init__(self, clave, titulo, paleta, gap=0.0, emision=None):
        self.clave, self.titulo, self.gap = clave, titulo, gap
        self.col = bpy.data.collections.new(clave)
        bpy.context.scene.collection.children.link(self.col)
        self.mats = {r: material(f'{r}.{clave}', PALETAS[paleta][r], *ACABADO[r]) for r in ROLES if r in PALETAS[paleta]}
        if 'vidrio' in self.mats:
            self.mats['vidrio'].node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.18
        if emision:
            self.mats['acento'].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = emision
        self.partes = []

    def parte(self, nombre, loc=(0, 0, 0), rot=(0, 0, 0), explota=(0, 0, 0)):
        return Parte(self, nombre, loc, rot, explota)


def triangulos(pieza):
    return sum(sum(len(p.vertices) - 2 for p in ob.data.polygons) for ob in pieza.partes)


# ---------------------------------------------------------------- piezas

def reactor():
    P = Pieza('neutral', 'Reactor', 'neutral_b', emision=7.0)
    zc = 1.3
    cols = (15, 135, 255)  # fuera del eje de la camara 3/4 para no tapar el nucleo

    p = P.parte('base', explota=(0, 0, -0.9))
    p.torno([(0, 0), (1.3, 0), (1.3, 0.1), (1.2, 0.16), (1.2, 0.26), (1.0, 0.3), (0, 0.3)], seg=16, rol='secundario', bev=0.01)
    p.torno(anillo_perfil(1.195, 1.215, 0.17, 0.2), seg=16, rol='acento')
    p.torno(anillo_perfil(0.52, 0.56, 0.29, 0.312), seg=32, rol='metal')
    p.torno(anillo_perfil(0.78, 0.8, 0.29, 0.305), seg=32, rol='metal')
    p.tornillos([(0.9 * cos(radians(a)), 0.9 * sin(radians(a)), 0.305) for a in range(0, 360, 30)], r=0.03, h=0.03)
    p.fin()

    p = P.parte('consola', loc=(0, -0.62, 0.3), explota=(0, -0.9, 0))
    p.caja((0.5, 0.25, 0.1), pos=(0, 0, 0.05), rol='cuerpo', bev=0.015)
    p.caja((0.4, 0.14, 0.012), pos=(0, 0, 0.102), rol='acento', bev=0.002, seg=1)
    p.caja((0.06, 0.06, 0.02), pos=(-0.19, 0.0, 0.107), rol='metal', bev=0.004, seg=1)
    p.texto('R-18', 0.05, pos=(0.14, -0.045, 0.106), rol='metal')
    p.fin()

    for k, a in enumerate(cols):
        th = radians(a)
        d = Vector((cos(th), sin(th), 0))
        p = P.parte(f'columna_{k + 1}', loc=d * 1.22 + Vector((0, 0, 0.26)), rot=(0, 0, th), explota=tuple(d * 0.9))
        p.caja((0.11, 0.11, 2.09), pos=(0, 0, 1.045), rol='cuerpo', bev=0.015)
        p.caja((0.012, 0.05, 1.3), pos=(-0.056, 0, 1.0), rol='acento', bev=0.002, seg=1)
        for z in (0.6, 1.2, 1.8):
            p.caja((0.13, 0.13, 0.02), pos=(0, 0, z), rol='secundario', bev=0.004, seg=1)
        p.caja((0.2, 0.05, 0.1), pos=(0, 0, 0.1), rol='secundario', bev=0.01, seg=1)
        p.fin()
        p = P.parte(f'abrazadera_{k + 1}', loc=d * 1.22 + Vector((0, 0, 1.45)), rot=(0, 0, th), explota=tuple(d * 1.1 + Vector((0, 0, 0.2))))
        p.caja((0.18, 0.18, 0.07), rol='metal', bev=0.012)
        p.tornillos([(-0.092, 0.05, 0.0), (-0.092, -0.05, 0.0)], r=0.014, h=0.012, eje='X')
        p.fin()

    for k in range(4):
        d = Vector((cos(radians(90 * k)), sin(radians(90 * k)), 0))
        p = P.parte(f'bobina_{k + 1}', loc=d * 1.12 + Vector((0, 0, 0.27)), explota=tuple(d * 0.8 + Vector((0, 0, -0.25))))
        p.cil(0.13, 0.5, pos=(0, 0, 0.25), seg=20, rol='cuerpo', bev=0.008)
        for z in (0.1, 0.25, 0.4):
            p.torno(anillo_perfil(0.125, 0.15, z - 0.02, z + 0.02, 0.006), seg=20, rol='metal')
        p.cil(0.09, 0.03, pos=(0, 0, 0.515), seg=16, rol='acento')
        p.fin()

    for i, (R, tx, sz, dz) in enumerate(((0.8, 20, 0, 0.45), (1.0, -58, 35, 0.9), (1.18, 35, -25, 1.35))):
        p = P.parte(f'anillo_{i + 1}', loc=(0, 0, zc), rot=(radians(tx), 0, radians(sz)), explota=(0, 0, dz))
        p.torno(anillo_perfil(R - 0.03, R + 0.03, -0.03, 0.03, 0.01), seg=48, rol='metal' if i == 1 else 'cuerpo')
        p.torno(anillo_perfil(R + 0.028, R + 0.04, -0.012, 0.012), seg=48, rol='acento')
        for a in range(0, 360, 60):
            ar = radians(a)
            p.caja((0.05, 0.08, 0.012), pos=(R * cos(ar), R * sin(ar), 0.034), rot=(0, 0, ar), rol='secundario', bev=0.003, seg=1)
        for s in (-1, 1):
            p.cil(0.03, 0.08, eje='X', pos=(s * (R + 0.07), 0, 0), seg=12, rol='metal')
        p.fin()

    p = P.parte('corazon', loc=(0, 0, zc), explota=(0, 0, 0.1))
    p.ico(0.4, sub=3)
    p.fin()
    p = P.parte('jaula', loc=(0, 0, zc), explota=(0, 0, -0.35))
    for rot in ((0, 0, 0), (pi / 2, 0, 0), (0, pi / 2, 0)):
        p.torno(anillo_perfil(0.545, 0.565, -0.012, 0.012), seg=40, rot=rot, rol='metal')
    for ax in ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)):
        p.caja((0.06, 0.06, 0.06), pos=tuple(0.555 * c for c in ax), rol='cuerpo', bev=0.01, seg=1)
    p.fin()

    p = P.parte('tapa', loc=(0, 0, 2.35), explota=(0, 0, 1.4))
    p.torno(anillo_perfil(0.98, 1.32, 0, 0.18, 0.03), seg=16, rol='cuerpo', bev=0.008)
    p.torno(anillo_perfil(0.32, 0.55, 0, 0.18, 0.03), seg=16, rol='cuerpo', bev=0.008)
    for a in range(45, 360, 90):
        p.caja((0.5, 0.16, 0.12), pos=(0.76 * cos(radians(a)), 0.76 * sin(radians(a)), 0.06), rot=(0, 0, radians(a)), rol='secundario', bev=0.012, seg=1)
    p.torno(anillo_perfil(0.55, 0.57, 0.17, 0.19), seg=32, rol='acento')
    p.tornillos([(1.15 * cos(radians(a)), 1.15 * sin(radians(a)), 0.18) for a in range(15, 360, 30)], r=0.03, h=0.03)
    p.fin()

    p = P.parte('inyector_superior', loc=(0, 0, 1.95), explota=(0, 0, 1.9))
    p.torno([(0, 0), (0.2, 0), (0.3, 0.12), (0.3, 0.32), (0.22, 0.5), (0.14, 0.6), (0, 0.6)], seg=24, rol='metal', bev=0.008)
    p.torno(anillo_perfil(0.295, 0.315, 0.17, 0.2), seg=24, rol='acento')
    p.fin()
    p = P.parte('inyector_inferior', loc=(0, 0, 0.3), explota=(0, 0, -0.45))
    p.torno([(0, 0), (0.4, 0), (0.4, 0.06), (0.22, 0.3), (0.1, 0.45), (0, 0.45)], seg=24, rol='metal', bev=0.008)
    p.torno(anillo_perfil(0.395, 0.415, 0.0, 0.025), seg=24, rol='acento')
    p.fin()
    return P


def red_neuronal():
    P = Pieza('ai', 'Red neuronal', 'ai')
    rnd = random.Random(18)
    th = radians(8)
    u, v = Vector((cos(th), sin(th), 0)), Vector((-sin(th), cos(th), 0))
    zc = 1.55
    centro = Vector((0, 0, zc))
    capas_a = (-1.65, -0.55, 0.55, 1.65)
    capas = (  # (b a lo largo de v, z) por nodo
        ((-0.55, 1.3), (0.05, 1.95), (0.6, 1.15)),
        ((-0.6, 1.85), (0.1, 1.2), (0.55, 1.85)),
        ((-0.62, 1.3), (-0.15, 1.85), (0.3, 1.2), (0.62, 1.7)),
        ((-0.3, 1.4), (0.3, 1.8)),
    )
    radio_capa = (0.17, 0.17, 0.17, 0.21)
    nodos = []
    for c, lista in enumerate(capas):
        for b, z in lista:
            nodos.append(dict(capa=c, r=radio_capa[c], pos=u * (capas_a[c] + rnd.uniform(-0.12, 0.12)) + v * b + Vector((0, 0, z))))
    aristas = ((1, 4), (1, 5), (2, 4), (2, 6), (3, 5), (3, 6), (2, 5),
               (4, 7), (4, 8), (5, 8), (5, 9), (6, 9), (6, 10),
               (7, 11), (8, 11), (9, 12), (10, 12), (8, 12))

    def explota_nodo(n):
        return (n['pos'] - centro) * 0.7 + Vector((0, 0, 0.35 + 0.15 * n['capa']))

    for i, a in enumerate(capas_a):
        loc = u * a + centro
        p = P.parte(f'marco_{i + 1}', loc=loc, explota=tuple(u * a * 0.25 + Vector((0, 0, 0.2 + 0.1 * i))))
        eje = (Matrix.Rotation(th, 4, 'Z') @ Matrix.Rotation(pi / 2, 4, 'Y')).to_euler()
        Mz = Matrix.Rotation(th, 4, 'Z')
        p.torno(anillo_perfil(0.9, 0.95, -0.03, 0.03, 0.01), seg=8, fase=radians(22.5), rot=eje, rol='cuerpo')
        p.torno(anillo_perfil(0.885, 0.9, -0.012, 0.012), seg=8, fase=radians(22.5), rot=eje, rol='acento')
        for z in (0.88, -0.88):
            p.caja((0.09, 0.09, 0.06), pos=(0, 0, z), rol='metal', bev=0.006, seg=1, M=Mz)
        p.fin()
    for k, n in enumerate(nodos):
        p = P.parte(f'nodo_{k + 1:02d}', loc=n['pos'], rot=(0, 0, 0), explota=tuple(explota_nodo(n)))
        r = n['r']
        p.esf(r, seg=16, rol='metal')
        tilt = (radians(25 + 17 * (k % 4)), radians(12 * k % 40), 0)
        p.torno(anillo_perfil(r * 0.98, r * 1.2, -0.022, 0.022), seg=20, rot=tilt, rol='cuerpo')
        p.torno(anillo_perfil(r * 1.0, r * 1.06, -0.008, 0.008), seg=20, rot=tilt, pos=(0, 0, 0), rol='acento')
        p.torno(anillo_perfil(0.03, 0.055, r - 0.015, r + 0.012), seg=10, rol='cuerpo')
        p.esf(0.032, pos=(0, 0, r + 0.004), seg=12, rol='acento')
        if n['capa'] == 3:
            p.torno(anillo_perfil(r * 1.25, r * 1.32, -0.012, 0.012), seg=32, rot=(pi / 2, 0, 0), rol='acento')
        p.fin()['capa'] = n['capa'] + 1
    for k, (i, j) in enumerate(aristas):
        a, b = nodos[i - 1], nodos[j - 1]
        eje = b['pos'] - a['pos']
        L = eje.length
        rot = Vector((0, 0, 1)).rotation_difference(eje.normalized()).to_euler()
        p = P.parte(f'arista_{k + 1:02d}', loc=a['pos'], rot=rot, explota=tuple((explota_nodo(a) + explota_nodo(b)) / 2))
        t0, t1 = a['r'] + 0.012, L - b['r'] - 0.012
        p.cil(0.016, t1 - t0, pos=(0, 0, (t0 + t1) / 2), seg=8, rol='metal')
        for t in (t0 + 0.012, t1 - 0.012):
            p.cil(0.034, 0.026, pos=(0, 0, t), seg=10, rol='secundario')
        p.torno(anillo_perfil(0.016, 0.026, -0.018, 0.018), seg=10, pos=(0, 0, (t0 + t1) / 2), rol='acento')
        p.fin()['arista'] = f'nodo_{i:02d}>nodo_{j:02d}'
    return P


def torre_datos():
    P = Pieza('data', 'Torre de datos', 'data')
    rnd = random.Random(18)
    rz = lambda a: Matrix.Rotation(a, 4, 'Z')
    zs = [0.35 + 0.74 * i for i in range(4)]
    rs = [1.22, 1.17, 1.12, 1.07]

    p = P.parte('base', explota=(0, 0, -0.5))
    p.torno([(0, 0), (1.4, 0), (1.4, 0.07), (1.3, 0.13), (1.3, 0.18), (0, 0.18)], seg=48, rol='secundario', bev=0.006)
    p.torno(anillo_perfil(1.1, 1.14, 0.17, 0.19), seg=48, rol='acento')
    p.fin()
    p = P.parte('columna', loc=(0, 0, 0.18), explota=(0, 0, 0.0))
    p.cil(0.17, 3.25, pos=(0, 0, 1.62), seg=24, rol='metal', bev=0.0)
    p.fin()
    for i in range(3):
        p = P.parte(f'abrazadera_{i + 1}', loc=(0, 0, zs[i] + 0.39), explota=(0, 0, 0.4 + 0.75 * i))
        p.torno(anillo_perfil(0.17, 0.25, -0.035, 0.035, 0.01), seg=24, rol='cuerpo')
        p.fin()

    for i, (z, r) in enumerate(zip(zs, rs)):
        dz = 0.75 * (i + 1)
        p = P.parte(f'disco_{i + 1}', loc=(0, 0, z), explota=(0, 0, dz))
        p.torno(anillo_perfil(0.2, r, -0.035, 0.035, 0.012), seg=64, rol='secundario')
        for k in range(72):
            a = 2 * pi * k / 72
            largo = 0.07 if k % 6 == 0 else 0.04
            p.caja((largo, 0.008, 0.008), pos=(r - 0.03 - largo / 2 + 0.04, 0, 0.037), rol='cuerpo', bev=0, seg=1, M=rz(a))
        p.fin()
        p = P.parte(f'aro_{i + 1}', loc=(0, 0, z), explota=(0, 0, dz))
        p.torno(anillo_perfil(r - 0.004, r + 0.01, -0.012, 0.012), seg=64, rol='acento')
        p.fin()
        p = P.parte(f'barras_{i + 1}', loc=(0, 0, z + 0.035), explota=(0, 0, dz))
        n = 18
        for k in range(n):
            a = 2 * pi * k / n
            h = min(0.62, 0.12 + 0.3 * (0.5 + 0.5 * sin(k * 0.9 + i * 1.3)) + rnd.random() * 0.16 + 0.03 * i)
            rb = r - 0.22
            p.caja((0.12, 0.13, h), pos=(rb, 0, h / 2), rol='cuerpo', bev=0.006, seg=1, M=rz(a))
            p.caja((0.12, 0.13, 0.02), pos=(rb, 0, h + 0.008), rol='acento', bev=0.003, seg=1, M=rz(a))
        p.fin()

    for j, (ang, alto) in enumerate(((-50, 3.5), (130, 3.0))):
        ar = radians(ang)
        p = P.parte(f'regla_{j + 1}', loc=(1.5 * cos(ar), 1.5 * sin(ar), 0.18), rot=(0, 0, ar), explota=(0.6 * cos(ar), 0.6 * sin(ar), 0.4))
        p.caja((0.2, 0.2, 0.06), pos=(0, 0, 0.03), rol='secundario', bev=0.01)
        p.caja((0.06, 0.04, alto), pos=(0, 0, alto / 2), rol='metal', bev=0.006, seg=1)
        for k in range(int(alto / 0.1)):
            mayor = k % 5 == 0
            p.caja((0.03 if mayor else 0.018, 0.03, 0.008), pos=(-0.035 - (0.006 if mayor else 0), 0, 0.1 + k * 0.1), rol='cuerpo' if mayor else 'secundario', bev=0, seg=1)
        p.fin()
    ar = radians(-50)
    p = P.parte('cursor', loc=(1.5 * cos(ar), 1.5 * sin(ar), 1.6), rot=(0, 0, ar), explota=(0.9 * cos(ar), 0.9 * sin(ar), 0.9))
    p.caja((0.12, 0.1, 0.14), rol='cuerpo', bev=0.015)
    p.caja((0.42, 0.04, 0.03), pos=(-0.27, 0, 0.0), rol='secundario', bev=0.006, seg=1)
    p.caja((0.02, 0.05, 0.05), pos=(-0.47, 0, 0.0), rol='acento', bev=0, seg=1)
    p.fin()

    p = P.parte('corona', loc=(0, 0, 3.4), explota=(0, 0, 3.4))
    p.torno([(0, 0), (0.4, 0), (0.4, 0.05), (0.3, 0.1), (0.3, 0.2), (0, 0.2)], seg=32, rol='cuerpo', bev=0.006)
    p.torno(anillo_perfil(0.3, 0.33, 0.04, 0.06), seg=32, rol='acento')
    p.fin()
    p = P.parte('faro', loc=(0, 0, 3.6), explota=(0, 0, 4.2))
    p.cil(0.13, 0.16, pos=(0, 0, 0.08), seg=24, rol='acento')
    p.torno(anillo_perfil(0.125, 0.15, 0.0, 0.03, 0.006), seg=24, rol='metal')
    p.torno(anillo_perfil(0.125, 0.15, 0.13, 0.16, 0.006), seg=24, rol='metal')
    p.fin()
    p = P.parte('panel_lectura', loc=(0, -1.12, 0.18), explota=(0, -0.9, -0.2))
    p.caja((0.7, 0.3, 0.16), pos=(0, 0, 0.08), rol='secundario', bev=0.02)
    for k, w in enumerate((0.5, 0.36, 0.44)):
        p.caja((w, 0.012, 0.022), pos=(-0.25 + w / 2 - 0.0 + 0.0, -0.152, 0.05 + k * 0.035), rol='acento', bev=0, seg=1)
    p.cil(0.03, 0.03, eje='Y', pos=(0.27, -0.155, 0.1), seg=16, rol='metal')
    p.fin()
    return P


def arco(p, r0, r1, z0, z1, a0, a1, seg=14, rol='cuerpo', bev=0.004, M=None):
    """Camisa abierta: sector de anillo (r0..r1, z0..z1) entre los angulos a0 y a1."""
    bm = p.bm
    n0 = p._marca()
    perfil = ((r0, z0), (r1, z0), (r1, z1), (r0, z1))
    A = [[bm.verts.new((r * cos(a0 + (a1 - a0) * i / seg), r * sin(a0 + (a1 - a0) * i / seg), z)) for i in range(seg + 1)] for r, z in perfil]
    for i in range(seg):
        for j in range(4):
            k = (j + 1) % 4
            bm.faces.new((A[j][i], A[j][i + 1], A[k][i + 1], A[k][i]))
    for i in (0, seg):
        bm.faces.new([A[j][i] for j in range(4)])
    if M is not None:
        bmesh.ops.transform(bm, matrix=M, verts=[v for v in bm.verts if v not in n0[0]])
    p._cierra(n0, rol, bev, 1)


def casco_convexo(pts):
    cruz = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    pts = sorted(set(pts))
    casco = []
    for serie in (pts, pts[::-1]):
        h = []
        for q in serie:
            while len(h) >= 2 and cruz(h[-2], h[-1], q) <= 0:
                h.pop()
            h.append(q)
        casco += h[:-1]
    return casco


def banda(p, centros, ancho=0.05, grosor=0.012, holgura=0.004):
    """Correa cerrada alrededor de poleas (y, z, radio): casco convexo extruido en X."""
    pts = [(y + (R + holgura) * cos(2 * pi * t / 48), z + (R + holgura) * sin(2 * pi * t / 48)) for y, z, R in centros for t in range(48)]
    casco = casco_convexo(pts)
    m = len(casco)
    normales = []
    for i in range(m):
        (y0, z0), (y1, z1) = casco[i - 1], casco[(i + 1) % m]
        d = Vector((y1 - y0, z1 - z0)).normalized()
        normales.append((d.y, -d.x))
    bm = p.bm
    n0 = p._marca()
    anillos = [[bm.verts.new((dx, y + k * ny, z + k * nz)) for (y, z), (ny, nz) in zip(casco, normales)]
               for dx, k in ((-ancho / 2, grosor), (ancho / 2, grosor), (ancho / 2, 0), (-ancho / 2, 0))]
    for i in range(m):
        for j in range(4):
            q = (j + 1) % 4
            bm.faces.new((anillos[j][i], anillos[j][(i + 1) % m], anillos[q][(i + 1) % m], anillos[q][i]))
    p._cierra(n0, 'secundario', 0, 1)


def tubo(p, a, b, r, seg=10, rol='metal', paso=0.18):
    """Cilindro de a a b con anillos intermedios: el AO por vertice necesita vertices a lo largo de piezas largas."""
    a, b = Vector(a), Vector(b)
    L = (b - a).length
    n = max(1, math.ceil(L / paso))
    perfil = [(0, 0), (r, 0)] + [(r, L * i / n) for i in range(1, n + 1)] + [(0, L)]
    p.torno(perfil, seg=seg, M=Matrix.Translation(a) @ Vector((0, 0, 1)).rotation_difference(b - a).to_matrix().to_4x4(), rol=rol)


def motor_v8():
    P = Pieza('design', 'Motor V8', 'design')
    r, L, rb, paso = 0.115, 0.36, 0.108, 0.30
    S_CUB = 0.6
    alfa = [radians(a) for a in (-45, 225, 45, 135)]  # muñequillas de plano cruzado, de adelante hacia atras
    Z, X = Vector((0, 0, 1)), Vector((1, 0, 0))
    xj = [0.45 - paso * j for j in range(4)]
    X_FRENTE, X_POLEA = 0.84, 0.99
    giro_x = (1, 0, 0)

    def banco(sg):
        g = sg * pi / 4
        return g, Vector((0, sin(g), cos(g))), Vector((0, cos(g), -sin(g))), Matrix.Rotation(-g, 4, 'X')

    def alinear(d):
        return Z.rotation_difference(Vector(d).normalized()).to_matrix().to_4x4()

    def polea(nombre, cy, cz, R, relacion, explota):
        p = P.parte(nombre, loc=(X_POLEA - 0.03, cy, cz), rot=(0, pi / 2, 0), explota=explota)
        p.torno(disco_perfil(R, 0, 0.06, 0.008), seg=20, rol='secundario')
        p.torno(anillo_perfil(R * 0.55, R * 0.8, 0.056, 0.066, 0.002), seg=20, rol='acento')
        p.cil(R * 0.32, 0.03, pos=(0, 0, 0.075), seg=20, rol='metal')
        p.cil(0.016, 0.1, pos=(0, 0, 0.02), seg=12, rol='metal')
        p.tornillos([(R * 0.68 * cos(radians(a)), R * 0.68 * sin(radians(a)), 0.063) for a in range(45, 360, 90)], r=0.011, h=0.01)
        ob = p.fin()
        ob['giro'], ob['relacion'] = giro_x, relacion

    p = P.parte('bloque')
    for sx in (-1, 1):
        p.caja((0.05, 0.62, 0.34), pos=(sx * 0.76, 0, -0.05), rol='cuerpo', bev=0.01, seg=1)
        for sy in (-1, 1):
            p.caja((0.05, 0.05, 0.34), pos=(sx * 0.38, sy * 0.305, -0.05), rol='cuerpo', bev=0.008, seg=1)
    p.caja((0.05, 0.05, 0.34), pos=(0, -0.305, -0.05), rol='cuerpo', bev=0.008, seg=1)
    p.caja((0.05, 0.05, 0.34), pos=(0, 0.305, -0.05), rol='cuerpo', bev=0.008, seg=1)
    p.caja((1.62, 0.7, 0.04), pos=(0, 0, -0.23), rol='secundario', bev=0.008, seg=1)
    p.tornillos([(x, sy * 0.33, -0.206) for x in (-0.7, 0, 0.7) for sy in (-1, 1)], r=0.02, h=0.014)
    for sy in (-1, 1):
        p.caja((1.58, 0.05, 0.05), pos=(0, sy * 0.305, 0.115), rol='cuerpo', bev=0.01, seg=1)
    for sg in (-1, 1):
        g, a, n, Mb = banco(sg)
        xc = 0.035 * sg
        for sx in (-1, 1):
            p.caja((0.05, 0.6, S_CUB + 0.02), pos=(xc + sx * 0.76, 0, (S_CUB + 0.02) / 2), rol='cuerpo', bev=0.008, seg=1, M=Mb)
        for sy in (-1, 1):
            p.caja((1.5, 0.05, 0.05), pos=(xc, sy * 0.3, 0.125), rol='cuerpo', bev=0.01, seg=1, M=Mb)
        p.caja((1.2, 0.01, 0.014), pos=(xc, sg * 0.326, 0.125), rol='acento', bev=0, seg=1, M=Mb)
        p.caja((1.5, 0.4, 0.04), pos=(xc, 0, S_CUB - 0.02), rol='cuerpo', bev=0.008, seg=1, M=Mb)
        for j in range(4):
            bx = xj[j] + xc
            for centro in (0, pi):
                arco(p, rb, rb + 0.035, 0.1, S_CUB - 0.04, centro - radians(30), centro + radians(30), seg=4, rol='metal', bev=0,
                     M=Mb @ Matrix.Translation((bx, 0, 0)))
        p.tornillos([(xc + x, sy * 0.185, S_CUB + 0.007) for x in (-0.7, 0, 0.7) for sy in (-1, 1)], r=0.013, h=0.012, M=Mb)
    p.fin()

    p = P.parte('carter', loc=(0, 0, -0.25), explota=(0, 0, -0.7))
    p.bloque(1.36, 0.5, 1.58, 0.67, 0.26, pos=(0, 0, -0.13), rol='secundario', bev=0.02)
    p.caja((1.64, 0.72, 0.03), pos=(0, 0, -0.015), rol='metal', bev=0.008, seg=1)
    p.tornillos([(x, sy * 0.345, 0.008) for x in (-0.72, -0.36, 0, 0.36, 0.72) for sy in (-1, 1)], r=0.02, h=0.014)
    p.cil(0.045, 0.025, pos=(-0.3, 0, -0.272), seg=6, rol='metal', bev=0.004)
    for sy in (-1, 1):
        p.caja((0.9, 0.012, 0.016), pos=(0, sy * 0.3, -0.09), rot=(sy * radians(19), 0, 0), rol='acento', bev=0, seg=1)
    p.fin()

    for sg in (-1, 1):
        lado = 'L' if sg > 0 else 'R'
        g, a, n, Mb = banco(sg)
        loc = a * S_CUB + X * 0.035 * sg
        rot = (-g, 0, 0)
        p = P.parte(f'junta_{lado}', loc=loc, rot=rot, explota=tuple(a * 0.45))
        p.caja((1.5, 0.34, 0.012), pos=(0, 0, 0.006), rol='metal', bev=0, seg=1)
        p.fin()

        p = P.parte(f'cabeza_{lado}', loc=loc + a * 0.012, rot=rot, explota=tuple(a * 0.7))
        p.caja((1.5, 0.34, 0.15), pos=(0, 0, 0.075), rol='secundario', bev=0.012)
        for bx in xj:
            p.caja((0.1, 0.03, 0.09), pos=(bx, -sg * 0.185, 0.11), rol='metal', bev=0.006, seg=1)
            p.cil(0.045, 0.03, eje='Y', pos=(bx, sg * 0.185, 0.06), seg=10, rol='metal', bev=0.004)
            p.cil(0.016, 0.05, eje='Y', pos=(bx, sg * 0.195, 0.11), seg=8, rol='metal')
        p.fin()

        p = P.parte(f'tapa_punterias_{lado}', loc=loc + a * 0.162, rot=rot, explota=tuple(a * 0.95))
        p.bloque(1.46, 0.3, 1.4, 0.24, 0.06, pos=(0, 0, 0.03), rol='cuerpo', bev=0.01)
        p.caja((1.2, 0.02, 0.008), pos=(0, sg * 0.075, 0.062), rol='acento', bev=0, seg=1)
        p.tornillos([(x, -sg * 0.1, 0.0625) for x in (-0.6, 0, 0.6)], r=0.015, h=0.012)
        p.texto('V8', 0.075, pos=(-0.35, -sg * 0.015, 0.062), alto=0.01, rol='metal')
        if sg < 0:
            p.cil(0.05, 0.035, pos=(0.45, 0.0, 0.077), seg=20, rol='metal', bev=0.006)
            p.torno(anillo_perfil(0.05, 0.06, 0.06, 0.07), seg=20, pos=(0.45, 0, 0), rol='acento')
        p.fin()

    p = P.parte('ciguenal', explota=(0, 0, -0.45))
    tubo(p, (-0.9, 0, 0), (1.0, 0, 0), 0.045, seg=12)
    for x in (-0.6, -0.3, 0.0, 0.3, 0.6):
        p.torno(anillo_perfil(0.044, 0.056, -0.025, 0.025, 0.004), seg=12, pos=(x, 0, 0), rot=(0, pi / 2, 0), rol='secundario')
    for j in range(4):
        d = Vector((sin(alfa[j]), cos(alfa[j])))
        for sx in (-1, 1):
            x = xj[j] + sx * 0.09
            p.caja((0.028, 0.115, 0.3), pos=(x, *(-0.03 * d)), rot=(-alfa[j], 0, 0), rol='metal', bev=0)
            p.caja((0.028, 0.15, 0.14), pos=(x, *(-0.13 * d)), rot=(-alfa[j], 0, 0), rol='acento', bev=0)
        p.cil(0.04, 0.17, pos=(xj[j], *(r * d)), eje='X', seg=12, rol='metal')
    p.cil(0.052, 0.14, pos=(0.93, 0, 0), eje='X', seg=20, rol='metal')
    p.cil(0.1, 0.06, pos=(-0.83, 0, 0), eje='X', seg=24, rol='metal')
    p.tornillos([(-0.865, 0.07 * cos(radians(k)), 0.07 * sin(radians(k))) for k in range(0, 360, 60)], r=0.014, h=0.012, eje='X')
    ob = p.fin()
    ob['giro'], ob['relacion'] = giro_x, 1.0

    for c in range(1, 9):
        j, sg = (c - 1) // 2, (-1 if c % 2 else 1)
        g, a, n, Mb = banco(sg)
        bx = xj[j] + 0.035 * sg
        delta = alfa[j] - g
        pos = a * (r * cos(delta) + sqrt(L * L - (r * sin(delta)) ** 2)) + X * bx
        fase = delta % (2 * pi)
        p = P.parte(f'piston_{c}', loc=pos, rot=(-g, 0, 0), explota=tuple(a * 0.45))
        p.cil(0.098, 0.12, pos=(0, 0, 0.01), seg=14, rol='metal')
        p.torno(anillo_perfil(0.0975, 0.101, 0.043, 0.053), seg=14, rol='acento')
        p.torno(anillo_perfil(0.0975, 0.101, 0.026, 0.034), seg=14, rol='metal')
        p.cil(0.02, 0.19, eje='X', seg=8, rol='metal')
        ob = p.fin()
        ob['carrera'], ob['fase'] = tuple(a * r), fase

        muneca = Vector((bx, r * sin(alfa[j]), r * cos(alfa[j])))
        p = P.parte(f'biela_{c}', loc=pos, rot=Z.rotation_difference((pos - muneca).normalized()).to_euler(), explota=tuple(a * 0.25))
        p.cil(0.036, 0.055, eje='X', seg=12, rol='metal')
        for k in range(3):
            p.caja((0.03, 0.05, (L - 0.12) / 3), pos=(0, 0, -0.06 - (L - 0.12) * (k + 0.5) / 3), rol='metal', bev=0, seg=1)
        p.cil(0.062, 0.058, eje='X', pos=(0, 0, -L), seg=14, rol='metal')
        ob = p.fin()
        ob['carrera'], ob['fase'] = tuple(a * r), fase
        ob['balanceo'], ob['oscila'] = r / L, (-1, 0, 0)

    puertos = []
    for sg in (-1, 1):
        g, a, n, Mb = banco(sg)
        entrada = -sg * n
        puertos += [(a * (S_CUB + 0.122) + entrada * 0.17 + X * (bx + 0.035 * sg), entrada) for bx in xj]
    centro_adm = Vector((0, 0, 0.87))
    p = P.parte('multiple_admision', loc=centro_adm, explota=(0, 0, 0.6))
    p.caja((1.22, 0.4, 0.16), pos=(0, 0, 0.0), rol='metal', bev=0.02, seg=3)
    p.caja((1.1, 0.3, 0.02), pos=(0, 0, 0.09), rol='secundario', bev=0.006, seg=1)
    p.caja((0.9, 0.012, 0.01), pos=(0, -0.201, 0.0), rol='acento', bev=0, seg=1)
    for B, d_in in puertos:
        Br = B - centro_adm
        Ar = Br + d_in * 0.34
        tubo(p, Ar, Br, 0.05, seg=10)
        p.cil(0.07, 0.02, M=Matrix.Translation(Br) @ alinear(d_in), seg=12, rol='secundario')
        p.esf(0.055, pos=Ar, seg=8, rol='metal')
    p.tornillos([(x, sy * 0.15, 0.1) for x in (-0.5, 0, 0.5) for sy in (-1, 1)], r=0.02, h=0.014)
    p.fin()

    p = P.parte('cuerpo_aceleracion', loc=(0, 0, 0.95), explota=(0, 0, 1.1))
    p.cil(0.15, 0.03, pos=(0, 0, 0.015), seg=24, rol='secundario', bev=0.004)
    p.cil(0.11, 0.16, pos=(0, 0, 0.08), seg=24, rol='metal', bev=0.008)
    p.cil(0.018, 0.3, pos=(0, 0, 0.1), eje='X', seg=10, rol='metal')
    p.cil(0.05, 0.02, pos=(0.14, 0, 0.1), eje='X', seg=16, rol='acento')
    p.tornillos([(0.125 * cos(radians(k)), 0.125 * sin(radians(k)), 0.032) for k in (45, 135, 225, 315)], r=0.014, h=0.012)
    p.fin()

    p = P.parte('filtro_aire', loc=(0, 0, 1.11), explota=(0, 0, 1.5))
    p.torno(anillo_perfil(0.2, 0.34, 0, 0.03, 0.006), seg=24, rol='secundario')
    p.torno(anillo_perfil(0.17, 0.32, 0.03, 0.11, 0.01), seg=24, rol='cuerpo')
    p.torno(disco_perfil(0.34, 0.11, 0.15, 0.02), seg=24, rol='metal')
    p.torno(anillo_perfil(0.335, 0.345, 0.045, 0.065), seg=24, rol='acento')
    p.cil(0.04, 0.05, pos=(0, 0, 0.175), seg=6, rol='metal', bev=0.004)
    p.fin()

    for sg in (-1, 1):
        lado = 'L' if sg > 0 else 'R'
        g, a, n, Mb = banco(sg)
        salida = sg * n
        pe = a * (S_CUB + 0.072) + salida * 0.17
        loc0 = Vector((0, pe.y, pe.z))
        p = P.parte(f'multiple_escape_{lado}', loc=loc0, explota=(0, sg * 0.8, 0.1))
        yc, zc = sg * 0.5, -0.17
        for bx in xj:
            A0 = pe + salida * 0.04 + X * (bx + 0.035 * sg) - loc0
            A1 = A0 + salida * 0.09
            A2 = Vector((A0.x, yc, zc)) - loc0
            tubo(p, A0, A1, 0.028, seg=8)
            tubo(p, A1, A2, 0.028, seg=8)
            p.esf(0.028, pos=A1, seg=8, rol='metal')
            p.esf(0.04, pos=A2, seg=8, rol='metal')
            p.cil(0.062, 0.02, M=Matrix.Translation(A0) @ alinear(salida), seg=14, rol='secundario')
        Ac, Bc = Vector((0.55, yc, zc)) - loc0, Vector((-1.05, yc, zc)) - loc0
        tubo(p, Ac, Bc, 0.05, seg=16)
        p.cil(0.075, 0.025, pos=Bc, eje='X', seg=18, rol='secundario')
        p.torno(anillo_perfil(0.05, 0.06, -0.012, 0.012), seg=16, pos=(0.2, Ac.y, Ac.z), rot=(0, pi / 2, 0), rol='acento')
        p.fin()

    p = P.parte('tapa_frontal', loc=(0.78, 0, 0), explota=(0.3, 0, 0))
    p.caja((0.06, 0.64, 0.34), pos=(0.03, 0, -0.05), rol='secundario', bev=0.01)
    for sg in (-1, 1):
        p.caja((0.06, 0.34, 0.52), pos=(0.03, 0, 0.36), rol='secundario', bev=0.01, M=banco(sg)[3])
    p.cil(0.105, 0.18, pos=(0.09, 0, 0.48), eje='X', seg=24, rol='metal', bev=0.006)
    p.cil(0.07, 0.03, pos=(0.075, 0, 0), eje='X', seg=20, rol='metal')
    p.fin()

    poleas = [(0.0, 0.0, 0.15), (-0.44, 0.30, 0.075), (0.0, 0.48, 0.10)]
    polea('polea_ciguenal', 0.0, 0.0, 0.15, 1.0, (0.55, 0, 0))
    polea('polea_alternador', -0.44, 0.30, 0.075, 2.2, (0.55, -0.1, 0))
    polea('polea_bomba', 0.0, 0.48, 0.10, 1.3, (0.55, 0, 0))

    p = P.parte('alternador', loc=(X_FRENTE, -0.44, 0.30), rot=(0, pi / 2, 0), explota=(0.2, -0.3, 0))
    p.cil(0.085, 0.12, pos=(0, 0, 0.06), seg=24, rol='cuerpo', bev=0.008)
    p.cil(0.075, 0.025, pos=(0, 0, 0.1), seg=24, rol='secundario', bev=0.004)
    p.torno(anillo_perfil(0.083, 0.092, 0.045, 0.065), seg=24, rol='acento')
    p.caja((0.12, 0.05, 0.1), pos=(0, 0.06, 0.06), rol='secundario', bev=0.008)
    p.caja((0.03, 0.2, 0.05), pos=(0, 0.17, 0.06), rol='secundario', bev=0.008, seg=1)
    p.fin()

    p = P.parte('ventilador', loc=(X_POLEA + 0.06, 0, 0.48), rot=(0, pi / 2, 0), explota=(0.9, 0, 0.1))
    p.cil(0.05, 0.05, seg=20, rol='secundario')
    p.cil(0.028, 0.02, pos=(0, 0, 0.03), seg=12, rol='acento')
    for k in range(6):
        p.caja((0.17, 0.07, 0.012), pos=(0.125, 0, 0), rot=(0.45, 0, 0), rol='secundario', bev=0, seg=1, M=Matrix.Rotation(2 * pi * k / 6, 4, 'Z'))
    p.torno(anillo_perfil(0.21, 0.222, -0.012, 0.012), seg=40, rol='acento')
    ob = p.fin()
    ob['giro'], ob['relacion'] = giro_x, 1.3

    p = P.parte('banda', loc=(X_POLEA, 0, 0), explota=(0.55, 0, 0))
    banda(p, poleas)
    p.fin()

    p = P.parte('volante', loc=(-0.93, 0, 0), rot=(0, pi / 2, 0), explota=(-0.6, 0, 0))
    p.cil(0.26, 0.05, seg=40, rol='metal')
    p.engranaje(28, 0.0199, 0.05, 0.25, rol='secundario', bev=0)
    p.torno(anillo_perfil(0.13, 0.15, 0.025, 0.033), seg=40, rol='acento')
    p.cil(0.07, 0.01, pos=(0, 0, 0.03), seg=24, rol='secundario')
    ob = p.fin()
    ob['giro'], ob['relacion'] = giro_x, 1.0
    return P


# <<CONCEPTOS>>

# ---------------------------------------------------------------- conceptos Full-stack (solo con --conceptos)

MAPEO_PERFIL = Matrix(((0, 0, 1, 0), (1, 0, 0, 0), (0, 1, 0, 0), (0, 0, 0, 1)))  # (x, y, z) local -> (z, x, y) mundo: perfil (y, z) extruido en X


def contorno(w, l, r, seg):
    pts = []
    for cx, cy, a0 in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        for i in range(seg + 1):
            a = radians(a0 + 90 * i / seg)
            pts.append((cx * (w / 2 - r) + r * cos(a), cy * (l / 2 - r) + r * sin(a)))
    return pts


def losa(p, w, l, z0, z1, r, pos=(0, 0), hueco=None, rol='cuerpo', bev=0.004, seg=5, M=None):
    """Prisma de rectangulo redondeado (w en X, l en Y) entre z0 y z1; con `hueco` es un marco de ese ancho."""
    bm = p.bm
    n0 = p._marca()
    ext = contorno(w, l, r, seg)
    n = len(ext)
    capas = [[bm.verts.new((x, y, z)) for x, y in ext] for z in (z0, z1)]
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((capas[0][i], capas[0][j], capas[1][j], capas[1][i]))
    if hueco is None:
        bm.faces.new(capas[0][::-1])
        bm.faces.new(capas[1])
    else:
        ints = contorno(w - 2 * hueco, l - 2 * hueco, max(r - hueco, 0.006), seg)
        dentro = [[bm.verts.new((x, y, z)) for x, y in ints] for z in (z0, z1)]
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((capas[1][i], capas[1][j], dentro[1][j], dentro[1][i]))
            bm.faces.new((capas[0][j], capas[0][i], dentro[0][i], dentro[0][j]))
            bm.faces.new((dentro[0][j], dentro[0][i], dentro[1][i], dentro[1][j]))
    B = Matrix.Translation((pos[0], pos[1], 0))
    bmesh.ops.transform(bm, matrix=M @ B if M is not None else B, verts=[v for v in bm.verts if v not in n0[0]])
    p._cierra(n0, rol, bev, 1)


def prisma(p, pts, h, pos=(0, 0, 0), rol='cuerpo', bev=0.008, M=None):
    """Poligono (x, y) extruido h sobre Z, centrado en z."""
    bm = p.bm
    n0 = p._marca()
    capas = [[bm.verts.new((x, y, z)) for x, y in pts] for z in (-h / 2, h / 2)]
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((capas[0][i], capas[0][j], capas[1][j], capas[1][i]))
    bm.faces.new(capas[0][::-1])
    bm.faces.new(capas[1])
    bmesh.ops.transform(bm, matrix=p._base(pos, (0, 0, 0), M), verts=[v for v in bm.verts if v not in n0[0]])
    p._cierra(n0, rol, bev, 1)


def liston(p, a, b, ancho, grosor, x, rol='acento'):
    """Tira sobre el borde a-b (y, z) de un panel lateral situado en la cara x."""
    (y0, z0), (y1, z1) = a, b
    p.caja((ancho, math.hypot(y1 - y0, z1 - z0), grosor), pos=(x, (y0 + y1) / 2, (z0 + z1) / 2), rot=(math.atan2(z1 - z0, y1 - y0), 0, 0), rol=rol, bev=0, seg=1)


def bezier(p0, p1, p2, p3, n):
    p0, p1, p2, p3 = map(Vector, (p0, p1, p2, p3))
    return [(1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3 for t in (i / n for i in range(n + 1))]


def manguera(p, pts, r, rol):
    for a, b in zip(pts, pts[1:]):
        tubo(p, a, b, r, seg=8, rol=rol, paso=10)
    for q in pts[1:-1]:
        p.esf(r, pos=q, seg=8, rol=rol)


def impresora():
    P = Pieza('concepto_a', 'Impresora', 'conceptos')
    XP, YP, Z0 = 1.06, 0.72, 0.42
    K = 2.2  # las capas del telefono se exageran en espesor para que se lean
    SXY = 1.45
    Z_PLATO, Y_PUENTE, X_CARRO = 0.56, 0.20, 0.14
    PW, PL, PR, X_FRONT = 0.92, 0.48, 0.07, 0.135
    Y_CAB, Z_BOQ = Y_PUENTE - 0.31, Z_PLATO + 0.076 * K + 0.012
    Z_PUENTE = Z_BOQ + 0.40
    Z1 = Z_PUENTE + 0.5
    TH = 0.85
    cab = Vector((X_CARRO, Y_CAB, Z_BOQ))

    def estira(p):
        bmesh.ops.transform(p.bm, matrix=Matrix.Diagonal((SXY, SXY, K, 1)), verts=p.bm.verts)

    def capa(k):
        return (-0.12 * k, -0.5 * k, 0.15 * k + 0.1)

    def impresa(p, w, l, z0, n, dz, rol, pos=(0, 0), r=PR, hueco=None, inset=0.0035):
        for k in range(n):
            d = inset * (k % 2)
            losa(p, w - 2 * d, l - 2 * d, z0 + k * dz, z0 + (k + 1) * dz, max(r - d, 0.012), pos=pos, hueco=hueco, rol=rol, bev=0.0015)

    p = P.parte('base', explota=(0, 0, -0.9))
    p.caja((2.3, 1.6, 0.08), pos=(0, 0, 0.04), rol='secundario', bev=0.01)
    p.caja((2.4, 1.7, 0.34), pos=(0, 0, 0.25), rol='crema', bev=0.03)
    p.caja((1.58, 1.04, 0.012), pos=(0, 0, 0.422), rol='secundario', bev=0.004, seg=1)
    losa(p, 1.74, 1.14, 0.42, 0.436, 0.06, hueco=0.06, rol='metal', bev=0.004)
    for x in (-0.42, 0.12):
        p.caja((0.012, 0.008, 0.3), pos=(x, -0.85, 0.25), rol='secundario', bev=0, seg=1)
    p.caja((0.5, 0.008, 0.022), pos=(-0.76, -0.85, 0.12), rol='acento', bev=0, seg=1)
    for k in range(5):
        p.caja((0.22, 0.008, 0.012), pos=(-0.76, -0.85, 0.2 + 0.035 * k), rol='secundario', bev=0, seg=1)
    for sx in (-1, 1):
        p.caja((0.008, 1.0, 0.022), pos=(sx * 1.2, 0, 0.14), rol='acento', bev=0, seg=1)
        for y in (-0.3, 0.3):
            p.caja((0.008, 0.012, 0.3), pos=(sx * 1.2, y, 0.25), rol='secundario', bev=0, seg=1)
    p.tornillos([(sx * 1.14, -0.855, z) for sx in (-1, 1) for z in (0.1, 0.38)], eje='Y')
    p.fin()

    p = P.parte('panel_ui', loc=(0.7, -0.85, 0.25), rot=(-radians(8), 0, 0), explota=(0.3, -0.9, -0.4))
    p.caja((0.58, 0.05, 0.3), pos=(0, -0.025, 0), rol='cuerpo', bev=0.014)
    p.caja((0.5, 0.01, 0.22), pos=(0, -0.0505, 0), rol='secundario', bev=0, seg=1)
    p.texto('CAPA 06/12', 0.03, pos=(-0.1, -0.0565, 0.075), rot=(pi / 2, 0, 0), alto=0.006, rol='crema')
    p.caja((0.42, 0.004, 0.024), pos=(0, -0.0565, 0.02), rol='metal', bev=0, seg=1)
    p.caja((0.23, 0.006, 0.024), pos=(-0.095, -0.0568, 0.02), rol='acento', bev=0, seg=1)
    for k, h in enumerate((0.04, 0.07, 0.05, 0.09, 0.06, 0.08)):
        p.caja((0.03, 0.004, h), pos=(-0.175 + 0.07 * k, -0.0565, -0.09 + h / 2), rol='luz', bev=0, seg=1)
    p.tornillos([(sx * 0.27, -0.052, sz * 0.13) for sx in (-1, 1) for sz in (-1, 1)], r=0.012, h=0.012, eje='Y')
    p.fin()

    p = P.parte('luz_estado', loc=(XP, -YP, Z1 + 0.08), explota=(0.5, -0.4, 1.0))
    p.cil(0.075, 0.03, pos=(0, 0, 0.015), seg=20, rol='metal', bev=0.004)
    p.cil(0.052, 0.13, pos=(0, 0, 0.095), seg=20, rol='acento')
    p.cil(0.065, 0.025, pos=(0, 0, 0.1625), seg=20, rol='metal', bev=0.004)
    p.torno(anillo_perfil(0.05, 0.062, 0.08, 0.095), seg=20, rol='secundario')
    p.fin()

    for n, (sx, sy) in enumerate(((-1, -1), (1, -1), (-1, 1), (1, 1))):
        p = P.parte(f'poste_{n + 1}', loc=(sx * XP, sy * YP, Z0), explota=(sx * 0.6, sy * 0.5, 0.25))
        p.caja((0.19, 0.19, 0.04), pos=(0, 0, 0.02), rol='metal', bev=0.006)
        p.tornillos([(a * 0.07, b * 0.07, 0.042) for a in (-1, 1) for b in (-1, 1)], r=0.014, h=0.012)
        p.caja((0.11, 0.11, Z1 - Z0 - 0.04), pos=(0, 0, (Z1 - Z0 + 0.04) / 2), rol='cuerpo', bev=0.012)
        for z in (0.35, 0.7, 1.05):
            p.caja((0.114, 0.114, 0.012), pos=(0, 0, z), rol='secundario', bev=0, seg=1)
        p.caja((0.006, 0.04, 0.8), pos=(-sx * 0.0545, 0, 0.7), rol='acento', bev=0, seg=1)
        p.caja((0.04, 0.006, 0.8), pos=(0, -sy * 0.0545, 0.7), rol='acento', bev=0, seg=1)
        p.fin()

    for sx in (-1, 1):
        p = P.parte(f'riel_y_{"L" if sx < 0 else "R"}', loc=(sx * XP, 0, Z_PUENTE - 0.16), explota=(sx * 0.9, 0, 0.5))
        p.caja((0.1, 1.34, 0.09), rol='secundario', bev=0.01)
        p.caja((0.036, 1.3, 0.014), pos=(0, 0, 0.052), rol='metal', bev=0.002, seg=1)
        p.caja((0.006, 0.9, 0.02), pos=(sx * 0.0515, 0, 0), rol='acento', bev=0, seg=1)
        p.tornillos([(0, y, -0.0465) for y in (-0.6, -0.2, 0.2, 0.6)], r=0.014, h=0.012)
        p.fin()

    p = P.parte('marco_superior', loc=(0, 0, Z1 + 0.04), explota=(0, 0, 1.6))
    for sy in (-1, 1):
        p.caja((2.26, 0.1, 0.08), pos=(0, sy * YP, 0), rol='azul', bev=0.012)
    for sx in (-1, 1):
        p.caja((0.1, 1.34, 0.08), pos=(sx * XP, 0, 0), rol='azul', bev=0.012)
    p.caja((2.06, 0.1, 0.08), pos=(0, 0.45, 0), rol='azul', bev=0.012)
    p.caja((1.6, 0.008, 0.02), pos=(0, -0.77, 0), rol='acento', bev=0, seg=1)
    p.tornillos([(x, -YP, 0.042) for x in (-0.9, -0.45, 0, 0.45, 0.9)], r=0.016, h=0.012)
    p.tornillos([(x, 0.45, 0.042) for x in (-0.8, -0.4, 0, 0.4, 0.8)], r=0.016, h=0.012)
    p.fin()

    p = P.parte('puente', loc=(0, Y_PUENTE, Z_PUENTE), explota=(0, 0, 1.25))
    p.caja((2.0, 0.16, 0.14), rol='cuerpo', bev=0.02)
    for sx in (-1, 1):
        p.caja((0.2, 0.3, 0.1), pos=(sx * XP, 0, -0.05), rol='secundario', bev=0.01)
        p.tornillos([(sx * XP + a * 0.06, -0.155, -0.05) for a in (-1, 1)], r=0.014, h=0.012, eje='Y')
    for z in (-0.035, 0.035):
        p.caja((1.86, 0.012, 0.022), pos=(0, -0.086, z), rol='metal', bev=0.002, seg=1)
    p.caja((1.2, 0.06, 0.006), pos=(0, 0, 0.073), rol='acento', bev=0, seg=1)
    p.caja((0.17, 0.17, 0.2), pos=(0.85, 0, 0.17), rol='secundario', bev=0.015)
    p.cil(0.055, 0.03, pos=(0.85, 0, 0.285), seg=20, rol='metal', bev=0.004)
    p.caja((0.176, 0.176, 0.014), pos=(0.85, 0, 0.2), rol='acento', bev=0, seg=1)
    p.fin()['mueve'] = (0, 1, 0)

    p = P.parte('carro_cabezal', loc=(X_CARRO, Y_PUENTE - 0.08, Z_PUENTE), explota=(0, 0, 1.1))
    p.caja((0.28, 0.056, 0.3), pos=(0, -0.042, 0), rol='secundario', bev=0.01)
    p.tornillos([(a * 0.1, -0.071, b * 0.12) for a in (-1, 1) for b in (-1, 1)], r=0.013, h=0.012, eje='Y')
    p.caja((0.2, 0.006, 0.02), pos=(0, -0.0705, 0.0), rol='acento', bev=0, seg=1)
    p.fin()['mueve'] = (1, 0, 0)

    p = P.parte('cabezal', loc=cab, explota=(0, 0, 0.9))
    p.cil(0.007, 0.06, pos=(0, 0, 0.03), seg=12, r2=0.032, rol='metal')
    p.caja((0.1, 0.08, 0.06), pos=(0, 0, 0.09), rol='metal', bev=0.006)
    p.caja((0.105, 0.085, 0.012), pos=(0, 0, 0.09), rol='acento', bev=0, seg=1)
    p.cil(0.02, 0.16, pos=(0, 0, 0.19), seg=12, rol='secundario')
    for k in range(6):
        p.cil(0.055, 0.008, pos=(0, 0, 0.135 + 0.02 * k), seg=20, rol='metal')
    for sx in (-1, 1):
        p.caja((0.03, 0.03, 0.2), pos=(sx * 0.09, 0, 0.11), rot=(0, sx * 0.3, 0), rol='secundario', bev=0.004, seg=1)
    p.caja((0.2, 0.16, 0.12), pos=(0, 0, 0.26), rol='cuerpo', bev=0.02)
    p.caja((0.12, 0.05, 0.12), pos=(0, 0.1, 0.26), rol='secundario', bev=0.008, seg=1)
    p.caja((0.22, 0.044, 0.28), pos=(0, 0.138, 0.4), rol='secundario', bev=0.01)
    p.caja((0.1, 0.1, 0.08), pos=(0, 0, 0.36), rol='metal', bev=0.008)
    for sx in (-1, 1):
        p.cil(0.022, 0.1, pos=(sx * 0.03, 0, 0.45), seg=12, rol='metal')
        p.torno(anillo_perfil(0.021, 0.03, 0.46, 0.475), seg=12, pos=(sx * 0.03, 0, 0), rol='acento')
    p.tornillos([(a * 0.08, 0.114, b * 0.1 + 0.4) for a in (-1, 1) for b in (-1, 1)], r=0.012, h=0.01, eje='Y')
    p.esf(0.012, pos=(0, 0, 0.0), seg=8, rol='acento')
    p.fin()['mueve'] = (1, 1, 0)

    p = P.parte('ventilador_cabezal', loc=(X_CARRO, Y_CAB - 0.082, Z_BOQ + 0.26), explota=(0, -0.4, 0.9))
    p.caja((0.17, 0.016, 0.17), rol='secundario', bev=0.01)
    p.torno(anillo_perfil(0.07, 0.082, -0.014, 0.0), seg=32, pos=(0, -0.008, 0), rot=(pi / 2, 0, 0), rol='metal')
    p.cil(0.03, 0.03, pos=(0, -0.02, 0), eje='Y', seg=16, rol='secundario')
    p.cil(0.016, 0.034, pos=(0, -0.022, 0), eje='Y', seg=12, rol='acento')
    for b in range(7):
        p.caja((0.06, 0.012, 0.03), pos=(0.05, -0.018, 0), rot=(0.4, 0, 0), rol='metal', bev=0.002, seg=1, M=Matrix.Rotation(2 * pi * b / 7, 4, 'Y'))
    p.fin()['giro'] = (0, -1, 0)

    p = P.parte('plato', loc=(0, 0, Z_PLATO), explota=(0, 0, -0.35))
    p.caja((1.74, 1.0, 0.012), pos=(0, 0, -0.006), rol='cuerpo', bev=0.004)
    for i in range(-8, 9):
        p.caja((0.004, 0.96, 0.002), pos=(i * 0.1, 0, 0.001), rol='metal', bev=0, seg=1)
    for j in range(-4, 5):
        p.caja((1.7, 0.004, 0.002), pos=(0, j * 0.1, 0.001), rol='metal', bev=0, seg=1)
    p.caja((1.78, 1.04, 0.05), pos=(0, 0, -0.037), rol='secundario', bev=0.012)
    p.caja((1.4, 0.006, 0.016), pos=(0, -0.52, -0.04), rol='luz', bev=0, seg=1)
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.caja((0.08, 0.06, 0.02), pos=(sx * 0.82, sy * 0.46, 0.006), rol='metal', bev=0.004, seg=1)
    p.caja((1.0, 0.8, 0.05), pos=(0, 0, -0.087), rol='metal', bev=0.01)
    p.caja((0.24, 0.24, 0.04), pos=(0, 0.64, -0.045), rol='secundario', bev=0.008)
    p.caja((0.2, 0.08, 0.2), pos=(0, 0.76, -0.06), rol='metal', bev=0.008)
    p.fin()['mueve'] = (0, 0, -1)

    p = P.parte('torre_z', loc=(0, 0.78, Z0), explota=(0, 0.7, -0.3))
    p.caja((0.42, 0.2, 0.03), pos=(0, 0, 0.015), rol='metal', bev=0.006)
    p.caja((0.34, 0.06, TH), pos=(0, 0.05, 0.03 + TH / 2), rol='cuerpo', bev=0.01)
    for sx in (-1, 1):
        p.caja((0.05, 0.14, TH), pos=(sx * 0.145, -0.01, 0.03 + TH / 2), rol='cuerpo', bev=0.008)
        p.caja((0.006, 0.02, 0.55), pos=(sx * 0.172, -0.01, 0.4), rol='acento', bev=0, seg=1)
        p.caja((0.01, 0.03, TH - 0.1), pos=(sx * 0.118, -0.03, 0.03 + TH / 2), rol='metal', bev=0, seg=1)
    p.caja((0.34, 0.16, 0.04), pos=(0, 0, TH + 0.05), rol='secundario', bev=0.008)
    p.caja((0.16, 0.16, 0.16), pos=(0, 0, TH + 0.15), rol='secundario', bev=0.012)
    p.cil(0.05, 0.03, pos=(0, 0, TH + 0.245), seg=16, rol='metal', bev=0.004)
    p.fin()

    p = P.parte('husillo_z', loc=(0, 0.76, Z0 + 0.04), explota=(0, 0.7, -0.3))
    p.cil(0.016, TH + 0.05, pos=(0, 0, (TH + 0.05) / 2), seg=12, rol='metal')
    for k in range(int(TH / 0.034)):
        p.torno(anillo_perfil(0.016, 0.026, k * 0.034 + 0.02, k * 0.034 + 0.034), seg=12, rol='metal')
    p.fin()['giro'] = (0, 0, 1)

    # Capas del telefono, de abajo arriba; cada una es una parte para hacerlas crecer en el navegador.
    p = P.parte('capa_01_trasera', loc=(0, 0, Z_PLATO), explota=capa(1))
    impresa(p, PW, PL, 0.0, 2, 0.008, 'crema')
    estira(p)
    p.fin()

    p = P.parte('capa_02_marco', loc=(0, 0, Z_PLATO), explota=capa(2))
    impresa(p, PW, PL, 0.016, 6, 0.008, 'azul', hueco=0.045)
    p.caja((0.09, 0.014, 0.03), pos=(0.2, PL / 2 + 0.003, 0.05), rol='frambuesa', bev=0.003, seg=1)
    p.caja((0.07, 0.014, 0.03), pos=(-0.1, PL / 2 + 0.003, 0.05), rol='metal', bev=0.003, seg=1)
    p.caja((0.014, 0.1, 0.03), pos=(PW / 2 + 0.003, 0.0, 0.04), rol='metal', bev=0.003, seg=1)
    estira(p)
    p.fin()

    p = P.parte('capa_03_bateria', loc=(0, 0, Z_PLATO), explota=capa(3))
    impresa(p, 0.5, 0.34, 0.016, 3, 0.0153, 'crema', pos=(-0.17, 0), r=0.04, inset=0.003)
    p.caja((0.36, 0.2, 0.002), pos=(-0.17, 0, 0.0625), rol='secundario', bev=0, seg=1)
    p.caja((0.3, 0.02, 0.002), pos=(-0.17, 0.05, 0.0645), rol='acento', bev=0, seg=1)
    p.caja((0.3, 0.012, 0.002), pos=(-0.17, -0.03, 0.0645), rol='luz', bev=0, seg=1)
    p.caja((0.07, 0.05, 0.012), pos=(0.1, 0, 0.034), rol='frambuesa', bev=0.002, seg=1)
    estira(p)
    p.fin()

    p = P.parte('capa_04_placa', loc=(0, 0, Z_PLATO), explota=capa(4))
    p.caja((0.26, 0.3, 0.02), pos=(0.27, 0, 0.026), rol='secundario', bev=0.004, seg=1)
    losa(p, 0.3, 0.34, 0.036, 0.046, 0.02, pos=(0.27, 0), rol='azul', bev=0.002)
    p.caja((0.1, 0.1, 0.016), pos=(0.3, 0.06, 0.054), rol='metal', bev=0.004, seg=1)
    p.caja((0.04, 0.04, 0.002), pos=(0.3, 0.06, 0.0625), rol='frambuesa', bev=0, seg=1)
    p.caja((0.07, 0.09, 0.012), pos=(0.19, -0.07, 0.052), rol='secundario', bev=0.003, seg=1)
    p.caja((0.06, 0.07, 0.012), pos=(0.34, -0.09, 0.052), rol='cuerpo', bev=0.003, seg=1)
    for k in range(8):
        p.caja((0.012, 0.02, 0.008), pos=(0.15 + 0.035 * k, 0.15, 0.05), rol='crema', bev=0, seg=1)
    for k in range(5):
        p.caja((0.12 - 0.01 * k, 0.004, 0.002), pos=(0.2 + 0.01 * k, -0.15 + 0.03 * k, 0.0465), rol='luz', bev=0, seg=1)
    estira(p)
    p.fin()

    p = P.parte('capa_05_pantalla', loc=(0, 0, Z_PLATO), explota=capa(5))
    ancho = X_FRONT + PW / 2 - 0.045
    for k in range(2):
        losa(p, ancho - 0.0035 * (k % 2) * 2, 0.386 - 0.007 * (k % 2), 0.064 + 0.006 * k, 0.07 + 0.006 * k, 0.03, pos=(X_FRONT - ancho / 2, 0), rol='secundario', bev=0.0012)
    for k, (x0, x1, y) in enumerate(((-0.38, -0.12, 0.14), (-0.38, 0.05, 0.09), (-0.3, -0.05, 0.03), (-0.38, 0.0, -0.03), (-0.34, -0.1, -0.09), (-0.38, 0.09, -0.15))):
        p.caja((x1 - x0, 0.006, 0.002), pos=((x0 + x1) / 2, y, 0.077), rol='luz', bev=0, seg=1)
    p.caja((0.014, 0.36, 0.004), pos=(X_FRONT - 0.007, 0, 0.0775), rol='acento', bev=0, seg=1)
    estira(p)
    p.fin()

    p = P.parte('capa_06_fantasma', loc=(0, 0, Z_PLATO), explota=capa(6))
    restante = PW / 2 - 0.045 - X_FRONT
    losa(p, restante, 0.386, 0.064, 0.076, 0.03, pos=(X_FRONT + restante / 2, 0), rol='vidrio', bev=0.001)
    losa(p, restante, 0.386, 0.076, 0.0775, 0.03, pos=(X_FRONT + restante / 2, 0), hueco=0.004, rol='luz', bev=0)
    losa(p, PW, PL, 0.092, 0.0935, PR, hueco=0.005, rol='luz', bev=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.caja((0.006, 0.006, 0.0165), pos=(sx * (PW / 2 - 0.036), sy * (PL / 2 - 0.036), 0.0845), rol='luz', bev=0, seg=1)
    estira(p)
    p.fin()

    soporte = P.parte('soporte_carretes', explota=(0, 0.9, 1.2))
    for sx in (-1, 1):
        x = sx * 0.55
        p = P.parte(f'carretel_{1 if sx < 0 else 2}', loc=(x, 0.78, Z1 + 0.38), rot=(0, pi / 2, 0), explota=(sx * 0.9, 0.9, 1.2))
        p.torno(anillo_perfil(0.07, 0.3, -0.07, -0.058, 0.004), seg=40, rol='cuerpo')
        p.torno(anillo_perfil(0.07, 0.3, 0.058, 0.07, 0.004), seg=40, rol='cuerpo')
        p.torno(anillo_perfil(0.07, 0.13, -0.058, 0.058), seg=24, rol='secundario')
        p.torno(anillo_perfil(0.13, 0.27, -0.052, 0.052, 0.01), seg=40, rol='frambuesa' if sx < 0 else 'azul')
        p.torno(anillo_perfil(0.22, 0.26, 0.07, 0.074), seg=40, rol='acento')
        p.torno(anillo_perfil(0.22, 0.26, -0.074, -0.07), seg=40, rol='acento')
        for k in range(6):
            a = 2 * pi * k / 6
            p.cil(0.035, 0.012, pos=(0.17 * cos(a), 0.17 * sin(a), 0.064), seg=12, rol='secundario')
        p.cil(0.03, 0.13, seg=12, rol='metal')
        p.fin()['giro'] = (sx, 0, 0)
        for dx in (-0.095, 0.095):
            soporte.caja((0.04, 0.1, 0.3), pos=(x + dx, 0.74, Z1 + 0.23), rol='metal', bev=0.006)
        soporte.cil(0.02, 0.26, pos=(x, 0.78, Z1 + 0.38), eje='X', seg=12, rol='secundario')
    soporte.fin()

    for sx in (-1, 1):
        k = 1 if sx < 0 else 2
        x = sx * 0.55
        p = P.parte(f'alimentador_{k}', loc=(x, 0.45, Z1 + 0.08), explota=(sx * 0.5, 0.4, 1.5))
        p.caja((0.18, 0.18, 0.24), pos=(0, 0, 0.12), rol='secundario', bev=0.015)
        p.caja((0.19, 0.19, 0.012), pos=(0, 0, 0.17), rol='acento', bev=0, seg=1)
        p.cil(0.05, 0.03, pos=(0, 0.1, 0.12), eje='Y', seg=16, rol='metal', bev=0.004)
        p.cil(0.03, 0.05, pos=(0, -0.12, 0.16), eje='Y', seg=12, rol='metal')
        p.cil(0.022, 0.03, pos=(0, 0, 0.255), seg=10, rol='metal')
        p.tornillos([(a * 0.06, -0.092, b * 0.07 + 0.12) for a in (-1, 1) for b in (-1, 1)], r=0.012, h=0.01, eje='Y')
        p.fin()['giro'] = (0, 1, 0)

        fil = 'frambuesa' if sx < 0 else 'azul'
        p = P.parte(f'filamento_{k}', explota=(sx * 0.3, 0.2, 1.6))
        salida = Vector((x, 0.32, Z1 + 0.24))
        fin_ = cab + Vector((sx * 0.03, 0, 0.5))
        manguera(p, bezier(salida, salida + Vector((0, -0.3, 0.3)), fin_ + Vector((0, 0, 0.5)), fin_, 14), 0.02, fil)
        manguera(p, [Vector((x, 0.51, Z1 + 0.38)), Vector((x, 0.5, Z1 + 0.33)), Vector((x, 0.45, Z1 + 0.34))], 0.008, fil)
        p.fin()
    return P


PERFIL_ARCADE = (  # (y, z) de cada lateral: frente en -Y
    (-0.42, 0.14), (-0.42, 0.90), (-0.855, 0.81), (-0.855, 0.92), (-0.435, 1.02), (-0.19, 1.69),
    (-0.19, 1.745), (-0.50, 1.805), (-0.50, 2.17), (-0.44, 2.23), (0.52, 2.23), (0.52, 0.14),
)


def arcade():
    P = Pieza('fullstack', 'Arcade', 'fullstack')
    th = radians(14)
    A = 0.72  # centro de cada lateral en X
    IW = 2 * A - 0.06  # ancho entre laterales
    DECK = Vector((0, -0.645, 0.96))
    S0, fi = Vector((0, -0.317, 1.358)), radians(20.07)
    n_pant = Vector((0, -cos(fi), sin(fi)))
    n_deck = Matrix.Rotation(th, 3, 'X') @ Vector((0, 0, 1))
    Rx90 = Matrix.Rotation(pi / 2, 4, 'X')
    Rpant = Matrix.Rotation(-fi, 3, 'X')
    xa = A + 0.032
    DESPLAZA_DECK = Vector((0, -1.0, -0.2))

    def capa(d):
        return tuple(n_pant * d * 0.9 + Vector((0, 0, 0.7 * d)))

    def en_deck(x, y):
        return DECK + Matrix.Rotation(th, 3, 'X') @ Vector((x, y, 0.004))

    p = P.parte('zocalo', explota=(0, 0, -0.55))
    p.caja((2 * A + 0.06, 0.96, 0.14), pos=(0, 0.02, 0.07), rol='secundario', bev=0.012)
    p.caja((IW - 0.2, 0.006, 0.012), pos=(0, -0.463, 0.035), rol='cuerpo', bev=0, seg=1)
    p.caja((IW - 0.2, 0.006, 0.012), pos=(0, -0.463, 0.1), rol='metal', bev=0, seg=1)
    p.fin()

    for sg, lado in ((-1, 'R'), (1, 'L')):
        p = P.parte(f'lado_{lado}', explota=(sg * 0.8, 0, 0))
        prisma(p, PERFIL_ARCADE, 0.06, pos=(0, 0, sg * A), rol='secundario', bev=0.01, M=MAPEO_PERFIL)
        p.fin()

        p = P.parte(f'arte_{lado}', explota=(sg * 1.4, 0, 0))
        for dy, rol in ((0.0, 'acento'), (0.14, 'cuerpo')):
            prisma(p, [(-0.38 + dy, 0.30), (-0.27 + dy, 0.30), (0.33 + dy, 1.42), (0.22 + dy, 1.42)], 0.004, pos=(0, 0, sg * xa), rol=rol, bev=0, M=MAPEO_PERFIL)
        prisma(p, [(-0.10, 0.30), (-0.09, 0.30), (0.40, 1.30), (0.39, 1.30)], 0.004, pos=(0, 0, sg * xa), rol='metal', bev=0, M=MAPEO_PERFIL)
        prisma(p, [(-0.40, 0.22), (0.45, 0.22), (0.45, 0.235), (-0.40, 0.235)], 0.004, pos=(0, 0, sg * xa), rol='acento', bev=0, M=MAPEO_PERFIL)
        prisma(p, [(-0.40, 2.0), (0.45, 2.0), (0.45, 2.015), (-0.40, 2.015)], 0.004, pos=(0, 0, sg * xa), rol='cuerpo', bev=0, M=MAPEO_PERFIL)
        for k, rol in enumerate(('acento', 'cuerpo', 'metal')):
            y0 = -0.30 + 0.15 * k
            prisma(p, [(y0, 1.84), (y0 + 0.07, 1.84), (y0 + 0.15, 1.96), (y0 + 0.08, 1.96)], 0.004, pos=(0, 0, sg * xa), rol=rol, bev=0, M=MAPEO_PERFIL)
        for k in range(3):
            p.cil(0.028, 0.006, pos=(sg * xa, 0.12 + 0.12 * k, 0.185), eje='X', seg=12, rol='cuerpo' if k == 1 else 'metal')
        p.fin()

        p = P.parte(f'moldura_{lado}', explota=(sg * 1.1, 0, 0))
        pts = PERFIL_ARCADE[1:10]
        for a, b in zip(pts, pts[1:]):
            liston(p, a, b, 0.012, 0.012, sg * xa, rol='acento')
        p.fin()

    p = P.parte('puerta_frontal', loc=(0, -0.415, 0.52), explota=(0, -0.9, -0.15))
    p.caja((IW, 0.03, 0.76), rol='cuerpo', bev=0.012)
    for k in range(9):
        p.caja((0.76, 0.008, 0.012), pos=(0, -0.0155, 0.28 - 0.032 * k), rol='secundario', bev=0, seg=1)
    for sx in (-1, 1):
        p.caja((0.012, 0.008, 0.46), pos=(sx * 0.46, -0.0155, -0.06), rol='secundario', bev=0, seg=1)
    p.caja((1.0, 0.008, 0.02), pos=(0, -0.0155, -0.3), rol='acento', bev=0, seg=1)
    p.cil(0.035, 0.02, pos=(0.56, -0.02, 0.1), eje='Y', seg=16, rol='metal', bev=0.003)
    p.caja((0.012, 0.012, 0.045), pos=(0.56, -0.032, 0.1), rol='secundario', bev=0, seg=1)
    p.tornillos([(sx * 0.63, -0.017, sz * 0.33) for sx in (-1, 1) for sz in (-1, 1)], r=0.016, h=0.012, eje='Y')
    p.fin()

    p = P.parte('panel_moneda', loc=(0, -0.435, 0.5), explota=(0, -1.4, -0.05))
    p.caja((0.4, 0.02, 0.44), rol='metal', bev=0.01)
    for sx in (-1, 1):
        p.caja((0.08, 0.012, 0.17), pos=(sx * 0.09, -0.011, 0.08), rol='secundario', bev=0.003)
        p.caja((0.014, 0.014, 0.17), pos=(sx * 0.09, -0.012, 0.08), rol='cuerpo', bev=0, seg=1)
        p.caja((0.007, 0.014, 0.11), pos=(sx * 0.09, -0.013, 0.08), rol='secundario', bev=0, seg=1)
        p.cil(0.018, 0.014, pos=(sx * 0.09, -0.012, -0.05), eje='Y', seg=12, rol='acento')
    p.texto('COIN', 0.05, pos=(0, -0.0105, 0.19), rot=(pi / 2, 0, 0), alto=0.006, rol='secundario')
    p.caja((0.16, 0.04, 0.08), pos=(0, -0.02, -0.15), rol='secundario', bev=0.008)
    p.caja((0.11, 0.01, 0.035), pos=(0, -0.041, -0.15), rol='metal', bev=0, seg=1)
    p.tornillos([(sx * 0.17, -0.011, sz * 0.2) for sx in (-1, 1) for sz in (-1, 1)], r=0.013, h=0.01, eje='Y')
    p.fin()

    # Bases y botas viven en el panel: solo se mueve lo que se mueve de verdad (palanca y casquetes).
    p = P.parte('panel_control', loc=DECK, rot=(th, 0, 0), explota=DESPLAZA_DECK)
    p.caja((IW, 0.42, 0.1), pos=(0, 0, -0.05), rol='secundario', bev=0.012)
    losa(p, IW - 0.04, 0.38, 0.0, 0.004, 0.03, hueco=0.006, rol='acento', bev=0)
    p.caja((0.012, 0.32, 0.0025), pos=(0, 0, 0.0012), rol='metal', bev=0, seg=1)
    p.caja((IW, 0.02, 0.05), pos=(0, -0.22, -0.025), rol='metal', bev=0.006)
    p.tornillos([(sx * 0.64, sy * 0.17, 0.004) for sx in (-1, 1) for sy in (-1, 1)], r=0.014, h=0.01)
    for sg in (-1, 1):
        p.cil(0.09, 0.016, pos=(sg * 0.5, 0, 0.012), seg=24, rol='metal', bev=0.003)
        p.torno([(0, 0.02), (0.07, 0.02), (0.036, 0.058), (0.026, 0.078), (0, 0.078)], seg=18, pos=(sg * 0.5, 0, 0), rol='secundario')
        p.torno(anillo_perfil(0.03, 0.052, 0.074, 0.084, 0.002), seg=18, pos=(sg * 0.5, 0, 0), rol='acento')
        for b in range(3):
            p.cil(0.052, 0.012, pos=(sg * (0.33 - 0.11 * b), 0.03 * (b - 1), 0.01), seg=20, rol='metal', bev=0.002)
        p.cil(0.03, 0.01, pos=(sg * 0.07, 0.14, 0.009), seg=16, rol='metal')
        p.torno(disco_perfil(0.021, 0.014, 0.026, 0.005), seg=16, pos=(sg * 0.07, 0.14, 0), rol='cuerpo')
    p.fin()

    for n, sg in enumerate((-1, 1)):
        p = P.parte(f'joystick_{n + 1}', loc=en_deck(sg * 0.5, 0.0), rot=(th, 0, 0), explota=tuple(DESPLAZA_DECK + n_deck * 0.55))
        p.cil(0.016, 0.2, pos=(0, 0, 0.1), seg=10, rol='metal')
        p.esf(0.058, pos=(0, 0, 0.215), seg=22, rol='acento' if sg < 0 else 'cuerpo')
        ob = p.fin()
        ob['inclina'], ob['inclina_b'], ob['amplitud'], ob['fase'] = (1, 0, 0), (0, 1, 0), 0.3, n * 2.1

        roles = ('acento', 'cuerpo', 'metal') if sg < 0 else ('metal', 'cuerpo', 'acento')
        for b in range(3):
            k = n * 3 + b
            p = P.parte(f'boton_{k + 1}', loc=en_deck(sg * (0.33 - 0.11 * b), 0.03 * (b - 1)), rot=(th, 0, 0),
                        explota=tuple(DESPLAZA_DECK + n_deck * (0.25 + 0.08 * b)))
            p.torno(disco_perfil(0.04, 0.012, 0.042, 0.009), seg=20, rol=roles[b])
            ob = p.fin()
            ob['presiona'], ob['fase'] = tuple(-0.011 * n_deck), 0.9 * k

    p = P.parte('pantalla_marco', loc=S0, rot=(-fi, 0, 0), explota=capa(1.05))
    losa(p, 1.22, 0.72, 0.0, 0.04, 0.08, hueco=0.07, rol='metal', bev=0.004, M=Rx90)
    losa(p, 1.09, 0.59, 0.0, 0.04, 0.016, hueco=0.006, rol='acento', bev=0, M=Rx90)
    p.tornillos([(sx * 0.575, -0.042, sz * 0.325) for sx in (-1, 1) for sz in (-1, 1)], r=0.016, h=0.012, eje='Y')
    p.fin()

    p = P.parte('pantalla_panel', loc=S0, rot=(-fi, 0, 0))
    p.caja((1.08, 0.02, 0.58), pos=(0, -0.02, 0), rol='secundario', bev=0.004, seg=1)
    for k in range(12):
        p.caja((0.002, 0.003, 0.57), pos=(-0.495 + 0.09 * k, -0.0305, 0), rol='metal', bev=0, seg=1)
    p.caja((0.96, 0.004, 0.003), pos=(0, -0.0325, -0.268), rol='metal', bev=0, seg=1)
    p.fin()

    pix, ys = 0.015, -0.0325
    nave = ('0001000', '0011100', '1111111')

    def pixeles(p, bits, cx, cz, rol):
        """Sprite en pantalla: una caja por tramo contiguo de cada fila."""
        for r_, fila in enumerate(bits):
            z = cz + (len(bits) / 2 - r_ - 0.5) * pix
            c = 0
            while c < len(fila):
                if fila[c] == '1':
                    c0 = c
                    while c < len(fila) and fila[c] == '1':
                        c += 1
                    p.caja(((c - c0) * pix, 0.004, pix), pos=(cx + ((c0 + c) / 2 - len(fila) / 2) * pix, ys, z), rol=rol, bev=0, seg=1)
                else:
                    c += 1

    sprite = ('0010100', '0111110', '1101011', '1111111', '0101010')
    p = P.parte('pantalla_enemigos', loc=S0, rot=(-fi, 0, 0), explota=capa(0.25))
    for fila, rol in enumerate(('acento', 'cuerpo', 'acento', 'cuerpo')):
        for col in range(7):
            pixeles(p, sprite, (col - 3) * 0.135, 0.13 - 0.09 * fila, rol)
    ob = p.fin()
    ob['desliza'], ob['baja'] = tuple(Rpant @ Vector((0.06, 0, 0))), tuple(Rpant @ Vector((0, 0, -0.045)))

    deslizamiento = tuple(Rpant @ Vector((0.42, 0, 0)))
    sube = tuple(Rpant @ Vector((0, 0, 0.3)))
    for n, rol in enumerate(('cuerpo', 'acento')):
        p = P.parte(f'pantalla_jugador_{n + 1}', loc=S0, rot=(-fi, 0, 0), explota=capa(0.45))
        pixeles(p, nave, 0, -0.23, rol)
        ob = p.fin()
        ob['desliza'], ob['fase'] = deslizamiento, n * pi

    for n, rol in enumerate(('cuerpo', 'acento')):
        p = P.parte(f'pantalla_disparo_{n + 1}', loc=S0, rot=(-fi, 0, 0), explota=capa(0.65))
        p.caja((0.01, 0.004, 0.036), pos=(0, ys, -0.185), rol=rol, bev=0, seg=1)
        ob = p.fin()
        ob['dispara'], ob['desliza'], ob['fase'] = sube, deslizamiento, n * pi

    p = P.parte('pantalla_hud', loc=S0, rot=(-fi, 0, 0), explota=capa(0.85))
    p.texto('SCORE 0420', 0.04, pos=(-0.3, ys, 0.245), rot=(pi / 2, 0, 0), alto=0.004, rol='metal')
    p.texto('HI 9999', 0.04, pos=(0.37, ys, 0.245), rot=(pi / 2, 0, 0), alto=0.004, rol='acento')
    p.caja((0.96, 0.004, 0.003), pos=(0, ys, 0.215), rol='metal', bev=0, seg=1)
    p.fin()

    p = P.parte('pantalla_cristal', loc=S0, rot=(-fi, 0, 0), explota=capa(1.2))
    p.caja((1.1, 0.006, 0.6), pos=(0, -0.0435, 0), rol='vidrio', bev=0.003)
    p.fin()

    visera_rot = (-radians(10.95), 0, 0)
    p = P.parte('visera', explota=(0, -0.35, 0.7))
    p.caja((IW, 0.34, 0.012), pos=(0, -0.345, 1.775), rot=visera_rot, rol='secundario', bev=0.004, seg=1)
    p.caja((IW - 0.1, 0.03, 0.01), pos=(0, -0.455, 1.806), rot=visera_rot, rol='cuerpo', bev=0, seg=1)
    p.fin()

    p = P.parte('marquesina', loc=(0, -0.485, 1.99), explota=(0, -0.5, 1.0))
    p.caja((IW, 0.03, 0.36), rol='secundario', bev=0.012)
    p.caja((0.92, 0.01, 0.26), pos=(0, -0.0195, 0), rol='cuerpo', bev=0.004, seg=1)
    p.caja((0.88, 0.008, 0.22), pos=(0, -0.0245, 0), rol='secundario', bev=0, seg=1)
    for sz in (-1, 1):
        p.caja((0.92, 0.01, 0.014), pos=(0, -0.0195, sz * 0.15), rol='acento', bev=0, seg=1)
    p.tornillos([(sx * 0.65, -0.017, sz * 0.14) for sx in (-1, 1) for sz in (-1, 1)], r=0.016, h=0.012, eje='Y')
    p.fin()

    p = P.parte('rotulo', loc=(0, -0.485, 1.99), explota=(0, -0.85, 1.4))
    p.texto('ARCADE', 0.105, pos=(0, -0.034, 0.025), rot=(pi / 2, 0, 0), alto=0.016, rol='acento')
    p.texto('FULL-STACK', 0.034, pos=(0, -0.034, -0.07), rot=(pi / 2, 0, 0), alto=0.008, rol='cuerpo')
    p.caja((0.7, 0.006, 0.006), pos=(0, -0.0295, 0.105), rol='cuerpo', bev=0, seg=1)
    p.caja((0.7, 0.006, 0.006), pos=(0, -0.0295, -0.105), rol='cuerpo', bev=0, seg=1)
    p.fin()

    p = P.parte('altavoces', loc=(0, -0.485, 1.99), explota=(0, -0.65, 1.2))
    for sx in (-1, 1):
        p.caja((0.14, 0.01, 0.26), pos=(sx * 0.575, -0.0195, 0), rol='metal', bev=0.004, seg=1)
        for k in range(7):
            p.caja((0.11, 0.004, 0.012), pos=(sx * 0.575, -0.0255, 0.09 - 0.03 * k), rol='secundario', bev=0, seg=1)
    p.fin()

    p = P.parte('tapa_superior', loc=(0, 0.04, 2.22), explota=(0, 0, 1.4))
    p.caja((IW, 0.96, 0.02), rol='cuerpo', bev=0.008)
    p.caja((0.9, 0.012, 0.006), pos=(0, -0.4, 0.012), rol='acento', bev=0, seg=1)
    p.fin()

    p = P.parte('trasera', loc=(0, 0.535, 1.175), explota=(0, 1.0, 0))
    p.caja((IW, 0.03, 2.07), rol='cuerpo', bev=0.012)
    for k in range(10):
        p.caja((0.7, 0.008, 0.012), pos=(0, -0.0155, 0.85 - 0.03 * k), rol='secundario', bev=0, seg=1)
    p.torno(anillo_perfil(0.1, 0.14, -0.007, 0.007), seg=24, pos=(0, -0.02, 0.225), rot=(pi / 2, 0, 0), rol='metal')
    p.cil(0.09, 0.012, pos=(0, -0.0205, 0.225), eje='Y', seg=24, rol='secundario')
    for b_ in range(6):
        p.caja((0.07, 0.006, 0.018), pos=(0.045, -0.027, 0), rol='metal', bev=0, seg=1, M=Matrix.Translation((0, 0, 0.225)) @ Matrix.Rotation(2 * pi * b_ / 6, 4, 'Y'))
    p.caja((0.7, 0.06, 0.5), pos=(0, -0.045, -0.5), rol='secundario', bev=0.01)
    p.caja((0.64, 0.008, 0.02), pos=(0, -0.077, -0.33), rol='acento', bev=0, seg=1)
    for k in range(4):
        p.caja((0.5, 0.008, 0.012), pos=(0, -0.077, -0.44 - 0.045 * k), rol='metal', bev=0, seg=1)
    for sx in (-1, 1):
        p.caja((0.014, 0.012, 1.3), pos=(sx * 0.5, -0.0215, 0.2), rol='acento' if sx < 0 else 'metal', bev=0, seg=1)
    p.tornillos([(sx * 0.64, -0.017, sz * 0.95) for sx in (-1, 1) for sz in (-1, 1)], r=0.016, h=0.012, eje='Y')
    p.fin()
    return P


def telefono():
    P = Pieza('concepto_c', 'Telefono', 'conceptos')
    cristal = P.mats['vidrio'].node_tree.nodes['Principled BSDF'].inputs
    cristal['Alpha'].default_value = 1.0
    cristal['Transmission Weight'].default_value = 1.0
    cristal['IOR'].default_value = 1.2
    W, H, RC = 0.74, 1.52, 0.115
    h = Vector((0.62, -0.78, 0)).normalized()
    der = Vector((-h.y, h.x, 0))
    eje = h * cos(radians(48)) + der * sin(radians(48))
    ROT = (pi / 2, 0, math.atan2(eje.x, -eje.y))
    Rm = Euler(ROT).to_matrix()

    def E(z, dx=0.0, dy=0.0):
        return tuple(Rm @ Vector((dx, dy, z)))

    def parte(nombre, z, dx=0.0, dy=0.0):
        return P.parte(nombre, rot=ROT, explota=E(z, dx, dy))

    p = parte('tapa_trasera', 0.0)
    losa(p, W - 0.012, H - 0.012, 0.0, 0.014, RC - 0.006, rol='crema', bev=0.003)
    losa(p, 0.34, 0.38, -0.012, 0.0, 0.07, pos=(-0.15, 0.52), rol='secundario', bev=0.004)
    for x, y in ((-0.2, 0.62), (-0.2, 0.47), (-0.08, 0.55)):
        p.cil(0.05, 0.01, pos=(x, y, -0.016), seg=20, rol='metal', bev=0.002)
    p.caja((0.5, 0.012, 0.0012), pos=(0, -0.55, 0.0146), rol='acento', bev=0, seg=1)
    for y in (-0.62, 0.7):
        p.caja((0.62, 0.012, 0.0012), pos=(0, y, 0.0146), rol='metal', bev=0, seg=1)
    p.fin()

    p = parte('bobina', 0.4)
    for k in range(8):
        p.torno(anillo_perfil(0.07 + 0.017 * k, 0.07 + 0.017 * k + 0.009, 0.016, 0.024), seg=32, pos=(0, -0.1, 0), rol='frambuesa')
    p.torno(anillo_perfil(0.03, 0.05, 0.016, 0.026), seg=24, pos=(0, -0.1, 0), rol='metal')
    p.caja((0.03, 0.34, 0.006), pos=(0, 0.14, 0.019), rol='metal', bev=0, seg=1)
    p.fin()

    p = parte('bateria', 0.8)
    losa(p, 0.56, 0.66, 0.026, 0.062, 0.05, pos=(0, -0.12), rol='azul', bev=0.004)
    p.caja((0.44, 0.3, 0.002), pos=(0, -0.12, 0.063), rol='crema', bev=0, seg=1)
    p.caja((0.44, 0.04, 0.0025), pos=(0, -0.04, 0.0645), rol='frambuesa', bev=0, seg=1)
    for k in range(5):
        p.caja((0.36 - 0.05 * k, 0.012, 0.0025), pos=(0.0, -0.13 - 0.04 * k, 0.0645), rol='secundario', bev=0, seg=1)
    p.texto('3.7V 5000mAh', 0.04, pos=(0.0, -0.215, 0.0645), alto=0.004, rol='secundario')
    p.fin()
    p = parte('conector_bateria', 0.95, dy=0.3)
    p.caja((0.14, 0.04, 0.012), pos=(0, 0.23, 0.062), rol='metal', bev=0.002, seg=1)
    p.caja((0.12, 0.2, 0.004), pos=(0, 0.14, 0.060), rol='frambuesa', bev=0, seg=1)
    p.fin()

    p = parte('placa', 1.2)
    losa(p, 0.64, 0.48, 0.064, 0.074, 0.06, pos=(0, 0.485), rol='azul', bev=0.002)
    losa(p, 0.46, 0.14, 0.064, 0.074, 0.04, pos=(0, -0.64), rol='azul', bev=0.002)
    for k in range(10):
        p.caja((0.014, 0.024, 0.008), pos=(-0.26 + 0.056 * k, 0.28, 0.078), rol='crema', bev=0, seg=1)
    for k in range(6):
        p.caja((0.014, 0.024, 0.008), pos=(-0.18 + 0.07 * k, -0.64, 0.078), rol='crema', bev=0, seg=1)
    for k in range(6):
        p.caja((0.2 - 0.02 * k, 0.004, 0.0015), pos=(-0.2 + 0.12, 0.3 + 0.07 * k, 0.0748), rol='metal', bev=0, seg=1)
    p.caja((0.2, 0.05, 0.016), pos=(0.0, -0.68, 0.082), rol='metal', bev=0.003, seg=1)
    p.caja((0.012, 0.3, 0.0015), pos=(0.3, 0.0, 0.0748), rol='luz', bev=0, seg=1)
    p.caja((0.012, 0.3, 0.0015), pos=(-0.3, 0.0, 0.0748), rol='luz', bev=0, seg=1)
    p.fin()

    p = parte('chip_soc', 1.55, dx=0.1)
    p.caja((0.16, 0.16, 0.02), pos=(0.18, 0.4, 0.084), rol='metal', bev=0.004)
    p.caja((0.07, 0.07, 0.002), pos=(0.18, 0.4, 0.0945), rol='frambuesa', bev=0, seg=1)
    for k in range(8):
        for sg in (-1, 1):
            p.caja((0.012, 0.01, 0.004), pos=(0.18 + sg * 0.087, 0.4 - 0.065 + 0.0185 * k, 0.078), rol='crema', bev=0, seg=1)
    p.fin()
    p = parte('chip_memoria', 1.7, dx=0.15)
    p.caja((0.14, 0.12, 0.016), pos=(0.18, 0.6, 0.082), rol='secundario', bev=0.003)
    p.caja((0.03, 0.03, 0.002), pos=(0.14, 0.64, 0.09), rol='acento', bev=0, seg=1)
    p.fin()
    p = parte('chip_modem', 1.55, dx=-0.1)
    p.caja((0.12, 0.09, 0.014), pos=(-0.12, 0.31, 0.081), rol='cuerpo', bev=0.003)
    p.caja((0.03, 0.03, 0.002), pos=(-0.15, 0.31, 0.089), rol='luz', bev=0, seg=1)
    p.fin()

    p = parte('blindaje_1', 2.0, dx=0.1)
    losa(p, 0.3, 0.36, 0.074, 0.102, 0.02, pos=(0.17, 0.5), hueco=0.012, rol='metal', bev=0.002)
    losa(p, 0.3, 0.36, 0.1, 0.104, 0.02, pos=(0.17, 0.5), rol='metal', bev=0.001)
    for i in range(4):
        for j in range(5):
            p.caja((0.03, 0.03, 0.002), pos=(0.08 + 0.07 * i, 0.38 + 0.06 * j, 0.1045), rol='secundario', bev=0, seg=1)
    p.fin()
    p = parte('blindaje_2', 2.0, dx=-0.1)
    losa(p, 0.17, 0.13, 0.074, 0.098, 0.015, pos=(-0.12, 0.31), hueco=0.01, rol='metal', bev=0.002)
    losa(p, 0.17, 0.13, 0.096, 0.1, 0.015, pos=(-0.12, 0.31), rol='metal', bev=0.001)
    p.caja((0.06, 0.03, 0.002), pos=(-0.12, 0.31, 0.1005), rol='frambuesa', bev=0, seg=1)
    p.fin()

    p = parte('camara', 1.55, dx=-0.1)
    losa(p, 0.28, 0.32, 0.076, 0.104, 0.05, pos=(-0.15, 0.53), rol='secundario', bev=0.004)
    p.caja((0.2, 0.01, 0.003), pos=(-0.15, 0.7, 0.105), rol='acento', bev=0, seg=1)
    p.cil(0.016, 0.006, pos=(-0.07, 0.43, 0.107), seg=12, rol='crema')
    p.fin()
    lentes = ((-0.2, 0.62, 0.062), (-0.2, 0.47, 0.062), (-0.08, 0.55, 0.062))
    for k, (x, y, r) in enumerate(lentes):
        p = parte(f'lente_{k + 1}', 2.0 + 0.14 * k, dx=-0.25, dy=0.15)
        p.torno(anillo_perfil(r * 0.78, r, 0.104, 0.12, 0.004), seg=28, pos=(x, y, 0), rol='metal')
        p.torno(anillo_perfil(r * 0.7, r * 0.8, 0.12, 0.123), seg=28, pos=(x, y, 0), rol='acento')
        p.torno(disco_perfil(r * 0.78, 0.104, 0.112, 0.004), seg=28, pos=(x, y, 0), rol='secundario')
        p.torno(disco_perfil(r * 0.4, 0.112, 0.118, 0.003), seg=20, pos=(x, y, 0), rol='vidrio')
        p.esf(r * 0.12, pos=(x - r * 0.15, y + r * 0.2, 0.117), seg=8, rol='crema')
        p.fin()

    p = parte('marco', 2.4)
    losa(p, W, H, 0.002, 0.13, RC, hueco=0.03, rol='metal', bev=0.004)
    losa(p, W - 0.06, H - 0.06, 0.002, 0.02, RC - 0.03, hueco=0.05, rol='metal', bev=0.002)
    p.caja((0.62, 0.025, 0.018), pos=(0, 0.28, 0.011), rol='metal', bev=0, seg=1)
    p.caja((0.62, 0.025, 0.018), pos=(0, -0.5, 0.011), rol='metal', bev=0, seg=1)
    for sx in (-1, 1):
        for y in (-0.6, 0.62):
            p.caja((0.034, 0.02, 0.1), pos=(sx * (W / 2 - 0.015), y, 0.066), rol='secundario', bev=0, seg=1)
    p.caja((0.06, 0.034, 0.1), pos=(0, -H / 2 + 0.017, 0.066), rol='secundario', bev=0, seg=1)
    p.tornillos([(sx * 0.3, sy * 0.68, 0.134) for sx in (-1, 1) for sy in (-1, 1)], r=0.014, h=0.012)
    p.fin()
    p = parte('tornillos', 2.7)
    p.tornillos([(sx * 0.3, sy * 0.68, 0.136) for sx in (-1, 1) for sy in (-1, 1)] , r=0.016, h=0.014)
    p.fin()
    p = parte('boton_power', 2.4, dx=0.35)
    p.caja((0.014, 0.12, 0.034), pos=(W / 2 + 0.005, 0.28, 0.066), rol='frambuesa', bev=0.004, seg=1)
    p.fin()
    p = parte('boton_volumen', 2.4, dx=0.35)
    for y in (0.46, 0.6):
        p.caja((0.014, 0.1, 0.034), pos=(W / 2 + 0.005, y, 0.066), rol='metal', bev=0.004, seg=1)
    p.fin()
    p = parte('bandeja_sim', 2.4, dx=-0.4)
    p.caja((0.014, 0.12, 0.03), pos=(-W / 2 + 0.005, 0.1, 0.066), rol='cuerpo', bev=0.004, seg=1)
    p.cil(0.004, 0.016, pos=(-W / 2 + 0.003, 0.1, 0.066), eje='X', seg=6, rol='secundario')
    p.fin()
    p = parte('puerto_usbc', 2.4, dy=-0.4)
    p.caja((0.14, 0.04, 0.05), pos=(0, -H / 2 + 0.03, 0.066), rol='metal', bev=0.004, seg=1)
    p.caja((0.1, 0.044, 0.02), pos=(0, -H / 2 + 0.03, 0.066), rol='secundario', bev=0, seg=1)
    p.fin()
    p = parte('altavoz', 2.2, dx=0.12, dy=-0.15)
    p.caja((0.26, 0.1, 0.034), pos=(0.1, -0.7, 0.074), rol='secundario', bev=0.01)
    for k in range(6):
        p.caja((0.008, 0.07, 0.036), pos=(0.02 + 0.03 * k, -0.7, 0.074), rol='metal', bev=0, seg=1)
    p.fin()
    p = parte('haptico', 2.2, dx=-0.12, dy=-0.15)
    p.caja((0.18, 0.08, 0.04), pos=(-0.17, -0.7, 0.08), rol='cuerpo', bev=0.008)
    p.caja((0.2, 0.012, 0.008), pos=(-0.17, -0.7, 0.103), rol='acento', bev=0, seg=1)
    p.fin()

    p = parte('pantalla', 2.9)
    losa(p, W - 0.03, H - 0.03, 0.118, 0.128, RC - 0.015, rol='secundario', bev=0.002)
    p.texto('09:41', 0.2, pos=(0, 0.42, 0.1285), alto=0.006, rol='luz')
    p.caja((0.4, 0.02, 0.0025), pos=(0, 0.27, 0.1295), rol='metal', bev=0, seg=1)
    for k, w in enumerate((0.56, 0.56, 0.56)):
        losa(p, w, 0.12, 0.128, 0.1305, 0.03, pos=(0, 0.1 - 0.15 * k), rol='cuerpo' if k else 'crema', bev=0)
        p.caja((0.2, 0.014, 0.0035), pos=(-0.1, 0.12 - 0.15 * k, 0.131), rol='secundario', bev=0, seg=1)
        p.caja((0.4, 0.01, 0.0035), pos=(0, 0.08 - 0.15 * k, 0.131), rol='metal', bev=0, seg=1)
        p.cil(0.03, 0.0035, pos=(0.2, 0.1 - 0.15 * k, 0.1318), seg=16, rol='acento' if k == 0 else 'azul')
    for k, rol in enumerate(('frambuesa', 'azul', 'crema', 'luz')):
        losa(p, 0.1, 0.1, 0.128, 0.1315, 0.025, pos=(-0.255 + 0.17 * k, -0.62), rol=rol, bev=0)
    for k in range(3):
        p.caja((0.02 + 0.02 * k, 0.012, 0.003), pos=(-0.3 + 0.03 * k + 0.02 * k, 0.72, 0.1295), rol='crema', bev=0, seg=1)
    losa(p, 0.2, 0.05, 0.128, 0.1305, 0.025, pos=(0, 0.69), rol='secundario', bev=0)
    p.fin()
    p = parte('flex_pantalla', 2.5, dy=-0.3)
    p.caja((0.3, 0.2, 0.004), pos=(0, -0.66, 0.114), rol='frambuesa', bev=0, seg=1)
    p.caja((0.1, 0.03, 0.01), pos=(0, -0.54, 0.114), rol='metal', bev=0.002, seg=1)
    p.fin()

    p = parte('vidrio', 3.4)
    losa(p, W, H, 0.13, 0.142, RC, rol='vidrio', bev=0.004)
    p.fin()
    p = parte('marco_negro', 3.45)
    losa(p, W - 0.004, H - 0.004, 0.1415, 0.1432, RC - 0.002, hueco=0.03, rol='secundario', bev=0)
    p.fin()
    p = parte('sensor_frontal', 3.9)
    p.cil(0.026, 0.004, pos=(-0.12, 0.7, 0.144), seg=20, rol='metal')
    p.cil(0.016, 0.005, pos=(-0.12, 0.7, 0.1445), seg=16, rol='secundario')
    p.caja((0.2, 0.014, 0.003), pos=(0.1, 0.7, 0.1435), rol='secundario', bev=0, seg=1)
    p.caja((0.2, 0.004, 0.0015), pos=(0.1, 0.7, 0.1448), rol='luz', bev=0, seg=1)
    p.fin()
    return P


# ---------------------------------------------------------------- escena, render y hoja
# <<ESCENA>>

PIEZAS = [  # clave, funcion, nombre de archivo, rotulo
    ('neutral', reactor, 'neutral-reactor', 'Home - Reactor'),
    ('fullstack', arcade, 'fullstack', 'Full-stack & Product - Arcade'),
    ('ai', red_neuronal, 'ai', 'AI & Agents - Red neuronal'),
    ('data', torre_datos, 'data', 'Data & Analytics - Torre de datos'),
    ('design', motor_v8, 'design', '3D & Engineering - Motor V8'),
]
PRESUPUESTO_TRIS = {'fullstack': 33000, 'ai': 27000, 'data': 32000, 'design': 28000}
PRESUPUESTO_DEFECTO = 40000  # el tope real es el GLB: ~7-9 bytes por triangulo con Draco
SALIDA_GLB = RAIZ.parent / 'src' / 'assets' / 'models'


def esquinas(col):
    pts = []
    for ob in col.objects:
        pts += [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    return pts


def elegir_dispositivo(esc):
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for backend in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
        try:
            prefs.compute_device_type = backend
            prefs.get_devices()
        except Exception:
            continue
        if any(d.type == backend for d in prefs.devices):
            for d in prefs.devices:
                d.use = d.type == backend
            esc.cycles.device = 'GPU'
            return backend
    return 'CPU'


def configurar_render(esc, muestras, pct):
    esc.render.engine = 'CYCLES'
    cy = esc.cycles
    cy.samples, cy.use_denoising, cy.seed, cy.use_animated_seed = muestras, True, 18, False
    cy.denoiser = 'OPENIMAGEDENOISE'
    cy.max_bounces = 6
    esc.render.resolution_x, esc.render.resolution_y, esc.render.resolution_percentage = 1200, 900, pct
    esc.view_settings.view_transform = 'AgX'
    try:
        esc.view_settings.look = 'AgX - Punchy'
    except TypeError:
        print('AVISO: look AgX - Punchy no disponible')
    esc.view_settings.exposure = -0.4
    esc.render.image_settings.file_format = 'PNG'
    mundo = bpy.data.worlds.new('estudio')
    esc.world = mundo
    mundo.use_nodes = True
    fondo = mundo.node_tree.nodes['Background']
    fondo.inputs['Color'].default_value = (*lineal('#C9CED3'), 1)
    fondo.inputs['Strength'].default_value = 0.45
    return elegir_dispositivo(esc)


def estudio(esc):
    col = bpy.data.collections.new('ESTUDIO')
    esc.collection.children.link(col)
    cyc = bpy.data.objects.new('cyc', bpy.data.meshes.new('cyc'))
    col.objects.link(cyc)
    cyc.data.materials.append(material('fondo', '#9AA1A8', 0.85))
    luces = []
    for nombre, color in (('llave', (1.0, 0.97, 0.93)), ('contra', (0.82, 0.9, 1.0)), ('relleno', (1, 1, 1))):
        d = bpy.data.lights.new(nombre, 'AREA')
        d.color, d.shape = color, 'RECTANGLE'
        o = bpy.data.objects.new(nombre, d)
        col.objects.link(o)
        luces.append(o)
    cam_d = bpy.data.cameras.new('cam')
    cam_d.lens = 62
    cam = bpy.data.objects.new('cam', cam_d)
    col.objects.link(cam)
    esc.camera = cam
    return cyc, luces, cam


def construir_cyc(cyc, centro, R, z_suelo, giro):
    F, Y0, Rc, H, W = R * 14, R * 3.6, R * 3.0, R * 12, R * 16
    perfil = [(-F, 0.0), (Y0, 0.0)]
    perfil += [(Y0 + Rc * sin(t), Rc - Rc * cos(t)) for t in [i * (pi / 2) / 14 for i in range(1, 15)]]
    perfil += [(Y0 + Rc, H)]
    bm = bmesh.new()
    a = [bm.verts.new((-W, y, z)) for y, z in perfil]
    b = [bm.verts.new((W, y, z)) for y, z in perfil]
    for i in range(len(perfil) - 1):
        bm.faces.new((a[i], b[i], b[i + 1], a[i + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.smooth = True
    bm.to_mesh(cyc.data)
    bm.free()
    cyc.location = (centro.x, centro.y, z_suelo)
    cyc.rotation_euler = (0, 0, giro)


def encuadrar(esc, cyc, luces, cam, col, gap):
    from bpy_extras.object_utils import world_to_camera_view
    bpy.context.view_layer.update()
    pts = esquinas(col)
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    centro = (mn + mx) / 2
    R = (mx - mn).length / 2
    h = Vector((0.62, -0.78, 0)).normalized()
    giro = math.atan2(h.x, -h.y)
    derecha = Vector((h.y, -h.x, 0))
    construir_cyc(cyc, centro, R, mn.z - gap, giro)
    up = Vector((0, 0, 1))
    pos = [(h * 1.0 - derecha * 1.3 + up * 1.5, 38, 1.0),
           (-h * 1.4 + derecha * 1.5 + up * 0.9, 22, 0.75),
           (h * 1.2 + derecha * 1.1 + up * 0.35, 6, 0.5)]
    for o, (v, k, tam) in zip(luces, pos):
        o.location = centro + v * R * 2.4
        d = v.length * R * 2.4
        o.data.energy = k * d * d * 0.55
        o.data.size, o.data.size_y = R * 2.6 * tam, R * 1.9 * tam
        o.rotation_euler = (centro - o.location).to_track_quat('-Z', 'Y').to_euler()
    direc = Vector((0.62, -0.78, 0.5)).normalized()
    dist = R * 4.5
    cam.data.shift_x = cam.data.shift_y = 0
    for _ in range(6):
        cam.location = centro + direc * dist
        cam.rotation_euler = (-direc).to_track_quat('-Z', 'Y').to_euler()
        bpy.context.view_layer.update()
        uv = [world_to_camera_view(esc, cam, p) for p in pts]
        xs, ys = [u.x for u in uv], [u.y for u in uv]
        ancho, alto = max(xs) - min(xs), max(ys) - min(ys)
        cam.data.shift_x += (min(xs) + max(xs)) / 2 - 0.5
        cam.data.shift_y += ((min(ys) + max(ys)) / 2 - 0.5) * 0.75
        dist *= max(ancho / 0.78, alto / 0.78)
    return centro


def explotar(pieza, activo):
    for ob in pieza.partes:
        if 'loc0' not in ob:
            ob['loc0'] = tuple(ob.location)
        ob.location = Vector(ob['loc0']) + (Vector(ob['explota']) if activo else Vector())


def renderizar(esc, cyc, luces, cam, pieza, archivo, explotada):
    for c in bpy.data.collections:
        if c.name != 'ESTUDIO':
            c.hide_render = c is not pieza.col
    explotar(pieza, explotada)
    encuadrar(esc, cyc, luces, cam, pieza.col, pieza.gap)
    esc.render.filepath = str(SALIDA / archivo)
    t = time.time()
    bpy.ops.render.render(write_still=True)
    explotar(pieza, False)
    return round(time.time() - t, 1)


def hoja():
    """Hoja de contacto con todos los PNG, armada con el editor de video de Blender (sin librerias externas)."""
    celdas = [(f'{arch}.png', rot) for _, _, arch, rot in PIEZAS]
    celdas += [(f'{arch}-explotado.png', rot.split(' - ')[0] + ' (explotado)') for _, _, arch, rot in PIEZAS]
    celdas += [(f'{arch}-ao.png', rot.split(' - ')[0] + ' (solo AO)') for _, _, arch, rot in PIEZAS]
    hoja_contacto(celdas, SALIDA, 'hoja.png', cols=5, W=3000, H=1560, CW=600, CH=450, cuerpo=21)


def hoja_contacto(celdas, carpeta, salida, cols, W, H, CW, CH, cuerpo):
    esc = bpy.data.scenes.new('hoja')
    esc.render.resolution_x, esc.render.resolution_y, esc.render.resolution_percentage = W, H, 100
    esc.render.engine = 'BLENDER_EEVEE'
    esc.view_settings.view_transform = 'Standard'
    esc.render.image_settings.file_format = 'PNG'
    esc.frame_start = esc.frame_end = 1
    se = esc.sequence_editor_create()
    fondo = se.strips.new_effect('fondo', 'COLOR', 1, 1, length=1)
    fondo.color = lineal('#15181C')
    for i, (archivo, rotulo) in enumerate(celdas):
        c, r = i % cols, i // cols
        x0, y0 = c * CW, 30 + r * (CH + 50)
        s = se.strips.new_image(archivo, str(carpeta / archivo), 2 + i, 1)
        s.frame_final_end = 2
        s.transform.scale_x = s.transform.scale_y = CW / 1200
        s.transform.offset_x = x0 + CW / 2 - W / 2
        s.transform.offset_y = H / 2 - (y0 + CH / 2)
        s.colorspace_settings.name = 'sRGB'
        t = se.strips.new_effect(f'txt{i}', 'TEXT', 20 + i, 1, length=1)
        t.text, t.font_size, t.color = rotulo, cuerpo, (0.9, 0.92, 0.95, 1)
        t.location = ((x0 + 18) / W, (H - (y0 + CH + 22)) / H)
        t.anchor_x, t.anchor_y = 'LEFT', 'CENTER'
    esc.render.filepath = str(carpeta / salida)
    bpy.ops.render.render(write_still=True, scene='hoja')


def densa(ob, largo, escribir):
    """Parte las aristas mayores que `largo` para que el AO por vertice tenga resolucion en caras grandes."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    for _ in range(6):
        largas = [e for e in bm.edges if e.calc_length() > largo]
        if not largas:
            break
        bmesh.ops.subdivide_edges(bm, edges=largas, cuts=1, use_grid_fill=True)
    n = sum(len(f.verts) - 2 for f in bm.faces)
    if escribir:
        for f in bm.faces:
            f.smooth = True
        for e in bm.edges:
            if len(e.link_faces) == 2:
                e.smooth = e.calc_face_angle(0) < 0.7
        bm.to_mesh(ob.data)
    bm.free()
    return n


def densificar(pieza):
    for largo in (0.1, 0.14, 0.2, 0.3, 0.45, 0.8):
        if sum(densa(ob, largo, False) for ob in pieza.partes) <= PRESUPUESTO_TRIS.get(pieza.clave, PRESUPUESTO_DEFECTO):
            break
    for ob in pieza.partes:
        densa(ob, largo, True)
    return largo


def es_vidrio(ob):
    return all(m.name.startswith('vidrio.') for m in ob.data.materials)


def hornear_ao(esc, pieza, muestras):
    vl = bpy.context.view_layer
    for lc in vl.layer_collection.children:
        lc.exclude = lc.name != pieza.clave
    pts = esquinas(pieza.col)
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    dist = (mx - mn).length * 0.12
    esc.world.light_settings.distance = dist
    esc.cycles.samples = muestras
    for ob in pieza.partes:
        at = ob.data.color_attributes.new('ao', 'FLOAT_COLOR', 'POINT')
        ob.data.color_attributes.active_color = at
        ob.data.color_attributes.render_color_index = ob.data.color_attributes.find('ao')
        at.data.foreach_set('color', [1.0] * 4 * len(ob.data.vertices))
    for ob in pieza.partes:
        if es_vidrio(ob):
            ob.hide_set(True)
    for ob in pieza.partes:
        if es_vidrio(ob):
            continue
        bpy.ops.object.select_all(action='DESELECT')
        ob.select_set(True)
        vl.objects.active = ob
        bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    for ob in pieza.partes:
        ob.hide_set(False)
    for lc in vl.layer_collection.children:
        lc.exclude = False
    return dist


def exportar_glb(pieza):
    SALIDA_GLB.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    for ob in pieza.partes:
        ob.select_set(True)
    ruta = SALIDA_GLB / f'{pieza.clave}.glb'
    bpy.ops.export_scene.gltf(
        filepath=str(ruta), export_format='GLB', use_selection=True, export_yup=True, export_extras=True,
        export_cameras=False, export_lights=False, export_apply=False, export_texcoords=False, export_materials='EXPORT',
        export_vertex_color='NAME', export_vertex_color_name='ao', export_all_vertex_colors=False,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=10,
        export_draco_position_quantization=12, export_draco_normal_quantization=8, export_draco_color_quantization=8,
        export_animations=False)
    return ruta.stat().st_size


def render_ao(esc, cyc, luces, cam, pieza, archivo):
    """Solo el AO horneado: emision sin luz = valor del atributo `ao`."""
    m = bpy.data.materials.new('ao_vista')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    col = nt.nodes.new('ShaderNodeVertexColor')
    col.layer_name = 'ao'
    em = nt.nodes.new('ShaderNodeEmission')
    sal = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(col.outputs['Color'], em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], sal.inputs['Surface'])
    guardado = {ob: [s.material for s in ob.material_slots] for ob in pieza.partes}
    for ob in pieza.partes:
        for s in ob.material_slots:
            s.material = m
    vt, lk, ex, den, mu = esc.view_settings.view_transform, esc.view_settings.look, esc.view_settings.exposure, esc.cycles.use_denoising, esc.cycles.samples
    esc.view_settings.look, esc.view_settings.view_transform, esc.view_settings.exposure = 'None', 'Standard', 0.0
    esc.cycles.use_denoising, esc.cycles.samples = False, 24
    renderizar(esc, cyc, luces, cam, pieza, archivo, False)
    esc.view_settings.view_transform, esc.view_settings.look, esc.view_settings.exposure = vt, lk, ex
    esc.cycles.use_denoising, esc.cycles.samples = den, mu
    for ob, mats in guardado.items():
        for s, mat in zip(ob.material_slots, mats):
            s.material = mat
    bpy.data.materials.remove(m)


CONCEPTOS = [  # clave, funcion, nombre de archivo, rotulo
    ('a', impresora, 'a-impresora', 'A · Impresora'),
    ('c', telefono, 'c-telefono', 'C · Teléfono'),
]
SALIDA_CONCEPTOS = SALIDA / 'conceptos'


def conceptos(a, solo):
    """Construye y renderiza solo los conceptos Full-stack: sin densificar, hornear AO, exportar ni guardar el .blend."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    esc = bpy.context.scene
    SALIDA_CONCEPTOS.mkdir(parents=True, exist_ok=True)
    elegidos = [(k, fn(), arch, rot) for k, fn, arch, rot in CONCEPTOS if not solo or k in solo]
    dispositivo = configurar_render(esc, a.muestras, a.resolucion)
    cyc, luces, cam = estudio(esc)
    informe = {}
    for k, P, arch, _ in elegidos:
        informe[k] = dict(partes=len(P.partes), triangulos=triangulos(P))
        print('CONCEPTO', k, informe[k])
        print('TOP', sorted(((sum(len(q.vertices) - 2 for q in ob.data.polygons), ob.name) for ob in P.partes), reverse=True)[:8])
        if not a.sin_render:
            informe[k]['segundos'] = renderizar(esc, cyc, luces, cam, P, f'conceptos/{arch}.png', False)
            informe[k]['segundos_explotada'] = renderizar(esc, cyc, luces, cam, P, f'conceptos/{arch}-explotado.png', True)
    if not a.sin_render and len(elegidos) == len(CONCEPTOS):
        celdas = [(f'{arch}.png', f'{rot} (armado)') for _, _, arch, rot in CONCEPTOS]
        celdas += [(f'{arch}-explotado.png', f'{rot} (explotado)') for _, _, arch, rot in CONCEPTOS]
        hoja_contacto(celdas, SALIDA_CONCEPTOS, 'hoja-fullstack.png', cols=2, W=1600, H=1360, CW=800, CH=600, cuerpo=30)
    print('COMPLETADO', json.dumps(informe), dispositivo)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--solo', default='')
    ap.add_argument('--muestras', type=int, default=96)
    ap.add_argument('--muestras-ao', type=int, default=96)
    ap.add_argument('--resolucion', type=int, default=100)
    ap.add_argument('--sin-render', action='store_true')
    ap.add_argument('--sin-bake', action='store_true')
    ap.add_argument('--conceptos', action='store_true')
    a = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    solo = set(filter(None, a.solo.split(',')))
    if a.conceptos:
        return conceptos(a, solo)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    esc = bpy.context.scene
    SALIDA.mkdir(exist_ok=True)
    piezas = [(k, fn(), arch, rot) for k, fn, arch, rot in PIEZAS if not solo or k in solo]
    informe = {}
    dispositivo = configurar_render(esc, a.muestras, a.resolucion)
    cyc, luces, cam = estudio(esc)
    for k, P, _, _ in piezas:
        largo = densificar(P)
        informe[k] = dict(partes=len(P.partes), triangulos=triangulos(P), arista_max=largo)
        if not a.sin_bake:
            informe[k]['ao_distancia'] = round(hornear_ao(esc, P, a.muestras_ao), 3)
            informe[k]['glb_bytes'] = exportar_glb(P)
        print('PIEZA', k, informe[k])
        print('TOP', sorted(((sum(len(q.vertices) - 2 for q in ob.data.polygons), ob.name) for ob in P.partes), reverse=True)[:8])
    if not solo:
        bpy.ops.wm.save_as_mainfile(filepath=str(RAIZ / 'piezas.blend'))
    if not a.sin_render:
        for k, P, arch, _ in piezas:
            informe[k]['segundos'] = renderizar(esc, cyc, luces, cam, P, f'{arch}.png', False)
            informe[k]['segundos_explotada'] = renderizar(esc, cyc, luces, cam, P, f'{arch}-explotado.png', True)
            if not a.sin_bake:
                render_ao(esc, cyc, luces, cam, P, f'{arch}-ao.png')
            print('RENDER', k, informe[k])
        if not solo:
            hoja()
    print('COMPLETADO', json.dumps(informe), dispositivo)


main()
