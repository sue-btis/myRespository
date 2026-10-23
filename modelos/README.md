# Piezas 3D

Generador en Blender 5.2 de 5 piezas hard-surface sci-fi: `neutral` (reactor, home), `fullstack` (arcade), `ai` (red neuronal), `data`, `design`.
Cada pieza es una coleccion de partes `<clave>__<parte>` con `explota` (desplazamiento de la vista explotada). Materiales por rol (`cuerpo`, `secundario`, `metal`, `acento`; `vidrio` solo en fullstack (cristal de la pantalla)) con sufijo de pieza.
`design` es un V8 de plano cruzado (eje del cigueñal = X, frente en +X, bancos a +-45 grados, orden 1-8-4-3-6-5-7-2). Extras en coordenadas Blender (Z arriba), con theta = angulo del cigueñal, positivo por regla de la mano derecha sobre `giro`:
`ciguenal`, `polea_*`, `ventilador`, `volante` llevan `giro` (eje) y `relacion` (velocidad respecto al cigueñal).
`piston_N`: `carrera` = eje del cilindro x semicarrera (radio de la manivela), `fase`; posicion = reposo + carrera*(cos(theta-fase) - cos(fase)), con el reposo = pose exportada (cigueñal en theta=0).
`biela_N`: igual que su piston mas `oscila` (eje) y `balanceo`; angulo extra sobre `oscila` = asin(balanceo*sin(theta-fase)) - asin(balanceo*sin(-fase)) pivotando en su origen (el pasador del piston).
`fullstack` es un arcade (frente en -Y, Z arriba). Extras en coordenadas Blender, vectores en unidades de escena (no fracciones del radio), `fase` en radianes:
`joystick_N`: `inclina` + `inclina_b` (dos ejes de inclinacion, X e Y mundo) y `amplitud` (rad); pivota en la base de la palanca (origen de la parte), la base y la bota viven en `panel_control`.
`boton_N`: `presiona` = desplazamiento del casquete al pulsar (hacia abajo por el eje del boton), `fase`.
`pantalla_enemigos`: `desliza` = semirrecorrido lateral del bloque, `baja` = bajada de media fila; el bloque marcha por pasos. `pantalla_jugador_N`: `desliza` = semirrecorrido a lo largo de su fila, `fase`.
`pantalla_disparo_N`: `dispara` = recorrido hacia arriba sobre el plano de la pantalla, con el `desliza` y la `fase` de su nave (la bala conserva la columna del disparo).
`pantalla_hud` y `rotulo` solo pulsan en el navegador (sin extras). No hay ventilador giratorio: la trasera queda oculta en la vista armada.
En `ai`, cada `arista_NN` lleva `arista: "nodo_03>nodo_11"` (nombres de partes sin prefijo) para animar paquetes en el navegador.

    & 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' -b --python-exit-code 1 --python modelos/piezas.py -- [--solo ai,data] [--muestras 96] [--muestras-ao 96] [--resolucion 100] [--sin-bake] [--sin-render]

Salida: `modelos/piezas.blend`, `modelos/render/*.png` (`<pieza>.png`, `-explotado`, `-ao` = solo el AO; `hoja.png` solo sin `--solo`) y `public/models/<clave>.glb`.
Pasos: densifica las caras grandes, hornea AO (Cycles, por vertice) al atributo de color `ao` y exporta GLB con Draco, extras y Y-up.
En el GLB el atributo `ao` sale como `COLOR_0` (glTF no nombra atributos de color); es gris lineal, para multiplicarlo con el color del rol.

## Conceptos Full-stack (solo render)

`& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' -b --python-exit-code 1 --python modelos/piezas.py -- --conceptos [--solo a,b,c] [--muestras 96] [--resolucion 100]`

Construye `impresora` (a) y `telefono` (c), los conceptos descartados (el arcade ya es la pieza `fullstack`), con los mismos helpers y renderiza armado y explotado en `modelos/render/conceptos/` (`a-impresora.png`, `-explotado`, ..., `hoja-fullstack.png`). No densifica, hornea AO, exporta GLB ni guarda `piezas.blend`. Roles extra solo para estos conceptos: `crema`, `azul`, `frambuesa`, `luz`.
