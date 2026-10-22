# Portafolio personal de Josue Escobar — Brief de producto

Status: Ready for PRD
Design size: compact

> En este proyecto el brief es suficiente como autoridad de producto. Lo que sigue son los
> mocks (ver Artefactos), no un PRD.

## Problema

El sitio actual ya no representa a Josue. Lo presenta como un "developer" genérico, con barras de
porcentaje de habilidades, contadores de CodeWars/LeetCode y dos proyectos que enlazan al mismo
repo. Su trabajo real abarca full-stack, IA y agentes, datos y diseño 3D/ingeniería. Viene de
mecatrónica y de ingeniería biomédica, y nada de eso aparece. Un reclutador que entra hoy no
puede saber a qué se dedica ni ver evidencia de que lo hace bien. Josue no quiere una plantilla:
el sitio en sí tiene que demostrar su oficio.

## Usuarios y contexto

- Usuario principal: reclutadores de puestos Full-stack / AI / Data, tanto en México como remotos
  o internacionales. Revisan rápido, muchas veces desde el celular, y deciden en segundos si
  siguen leyendo.
- Usuarios secundarios: hiring managers y técnicos que revisan proyectos y código; clientes
  potenciales de consultoría (prioridad baja).
- Contexto de uso: llegan desde LinkedIn, el CV o GitHub. Sin cuenta ni login, solo lectura.

## Resultados esperados

- OUT-001 — En 10 segundos, el visitante sabe qué es Josue: un ingeniero que construye en todo
  el stack (web, datos, IA y 3D) y que viene de mecatrónica.
- OUT-002 — El visitante encuentra cómo escribirle sin buscar. CV, LinkedIn y GitHub están
  siempre a la vista.
- OUT-003 — Cada proyecto publicado muestra evidencia verificable: demo, repo, capturas o
  impacto.
- OUT-004 — La experiencia del sitio (el cambio de estilo por área) demuestra el nivel de oficio
  por sí sola y se recuerda.
- OUT-005 — Agregar un proyecto nuevo cuesta poco: es contenido, no un rediseño.

## Alcance

Incluido:
- Portada neutral con el mensaje de 10 segundos y 4 tarjetas de área como invitación.
- Cambio de estilo por área (ver Decisiones). Es la apuesta principal y se valida en el mock.
- Proyectos agrupados por área; el área activa pone sus proyectos primero.
- "About" breve con una línea de tiempo animada: mecatrónica (2018) → ingeniería biomédica y
  calidad (2024) → datos (2025) → full-stack + IA (hoy).
- Experiencia con empleadores nombrados (Ecosat, Waldo's, Teleflex).
- Contacto como acción principal, más enlaces a CV, LinkedIn y GitHub.
- Un solo elemento con lo personal fuera del código (deporte, música).
- Diseño pensado primero para móvil.
- Mocks con las 4 áreas pobladas, para previsualizarlas.

Excluido:
- Moodify (pausado).
- Proyectos de Ecosat al lanzar. Entran después, como mocks propios y anonimizados.
- Blog o notas.
- Versión en español.
- Juego o navegación tipo videojuego (descartado).
- Escena 3D protagonista en la portada (posible v2).
- Áreas con "coming soon" en el sitio publicado.
- Barras de porcentaje de habilidades y contadores de CodeWars/LeetCode.

## Restricciones

- CON-001 — Idioma: inglés.
- CON-002 — Stack: React, decisión explícita de Josue para un sitio muy animado.
- CON-003 — Dominio propio. Hoy el sitio vive en `sue-btis.github.io/myRespository/` (GitHub
  Pages).
- CON-004 — Mantenimiento bajo: se actualiza cuando sale un proyecto personal nuevo.
- CON-005 — Nunca se nombran clientes de Ecosat ni se muestran sus datos, código o capturas
  reales. Los empleadores sí se pueden nombrar.
- CON-006 — Las animaciones respetan `prefers-reduced-motion`. Todo el contenido se puede leer
  sin elegir un área.
- CON-007 — El sitio carga y responde con fluidez en un celular de gama media, incluido el cambio
  de estilo.
- CON-008 — El CV descargable lo mantiene Josue fuera del sitio. El sitio solo lo enlaza.

## Lenguaje del dominio

| Término | Significado |
|---|---|
| Área | Una de las 4 disciplinas: 01 Full-stack & Product, 02 AI & Agents, 03 Data & Analytics, 04 3D & Engineering design. |
| Estilo de área | La "piel" que adopta todo el sitio al elegir un área: paleta, tipografía, fondo animado, estilo de hover y ritmo de animación. El layout, la navegación y la ubicación del contenido no cambian. |
| Estado neutral | Lo que ve quien no ha elegido área. Es el diseño propio de Josue y es el punto de entrada por defecto. |
| Proyecto | Pieza de trabajo con evidencia (demo, repo, capturas o impacto), asignada a un área. |
| Mensaje de 10 segundos | "Engineer who builds across the stack — web, data, AI and 3D. Started in mechatronics, still building things that work." |

## Decisiones de producto aprobadas

- Audiencia: reclutadores de México y remotos. La consultoría es secundaria.
- Puestos objetivo: Full-stack + AI/Data, con formación de ingeniería y análisis.
- Mensaje de 10 segundos: el de la tabla de arriba, opción A aprobada.
- Acción principal: escribirle a Josue. CV, LinkedIn y GitHub como secundarios siempre visibles.
- Las 4 áreas son las de la tabla de arriba. Josue va a orientar sus próximos proyectos a ellas.
- Al elegir un área cambia la "piel" de todo el sitio, no el layout. El área activa ordena primero
  sus proyectos.
- Quien no elige área ve el estado neutral con todo el contenido.
- Al lanzar solo se publican las áreas con al menos un proyecto (TrainLog → Full-stack &
  Product; ChangeSmith → AI & Agents). Los mocks muestran las 4.
- Voz: primera persona, directa, humor solo en microcopy. Lo personal en un solo elemento.
- Referencias:
  - [kail.studio](https://kail.studio/) es la principal, por su pulido de animación y UI/UX y la
    estructura de "áreas" numeradas.
  - De [emotion-agency.com](https://emotion-agency.com/) solo el efecto de ondas al hover.
  - De [rubens.design](https://www.rubens.design/) la idea de que la interfaz completa cambie
    según una elección.
  - La escena 3D de [raomuhammadhamza.tech](https://www.raomuhammadhamza.tech/) gusta, pero le
    falta pulido.

## Decisiones de producto abiertas

- El estilo de cada área: qué paleta, tipografía, fondo y hover lleva cada una. Lo decide Josue
  en la fase de mocks.
- La validación del cambio de estilo por área. Si en el mock no convence, se reduce a un acento de
  color por área sobre el estado neutral. Decide Josue al revisar los mocks.
- El dominio: nombre y registro. Bloquea el lanzamiento, no los mocks.
- La evidencia por proyecto: confirmar la URL pública de la demo de TrainLog, capturas e impacto
  de cada proyecto.
- El mecanismo de contacto: correo directo o formulario. Afecta el diseño de la sección de
  contacto.

## Artefactos

Sitio estático, un solo actor, sin persistencia ni API propia: el paquete se reduce a lo que
elimina ambigüedad real.

| Artefacto | ¿Requerido? | Razón |
|---|---:|---|
| PRD | No | Este brief alcanza como autoridad de producto para un sitio de este tamaño. |
| Modelo de dominio | No | El vocabulario cabe en la tabla de arriba. |
| Structurizr DSL | No | Un solo deployable estático. |
| ADR | No | El stack ya lo decidió Josue (CON-002). Escribir un ADR solo si el mecanismo del cambio de estilo implica una decisión técnica con alternativas reales. |
| DBML | No | Sin datos persistentes. |
| OpenAPI | No | Sin API propia. |
| AsyncAPI | No | Sin eventos. |
| Mermaid flows | No | Un solo flujo: llegar, opcionalmente elegir área, ver proyectos y contactar. |
| HTML prototype | Sí | La apuesta del cambio de estilo por área solo se puede validar viéndola. Son los mocks de la siguiente fase. |
| Quality attributes | No | CON-006 y CON-007 bastan. Se verifican en los mocks y en el build. |

## Estado actual (sitio que se reemplaza)

El rediseño sustituye el sitio entero, así que no se listan diferencias una por una. Estos son los
puntos del sitio actual que el nuevo no debe heredar:

| ID | Qué difiere del objetivo | Evidencia |
|---|---|---|
| DR-001 | Los dos proyectos enlazan al repo de Moodify y Moodify está fuera de alcance. | `src/components/portfolio/Menu.jsx:10`, `:17` |
| DR-002 | El resume se queda en 2024 y no menciona Ecosat ni Waldo's. | `src/components/resume/Data.jsx` |
| DR-003 | Typo "Proyects". | `src/components/about/AboutBox.jsx:31` |
| DR-004 | `.env` (clave pública de EmailJS) y 11 archivos de respaldo `*~` están versionados. | `git ls-files` |
| DR-005 | El README es la plantilla de Vite. | `README.md:1` |
