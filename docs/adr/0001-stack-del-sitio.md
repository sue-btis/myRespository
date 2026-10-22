# ADR 0001 — Stack del sitio reconstruido

Estado: aceptada (2026-10-22)

## Contexto

El portafolio se reconstruye desde cero a partir del mock aprobado (`.impeccable/mocks/home.html`, dirección Modular Chassis). Es una sola página estática, con 5 "caras" que cambian paleta, tipografía y movimiento mediante variables CSS bajo `data-face`. Hoy corre en React 19 + Vite 6 con FontAwesome y EmailJS, y se publica en GitHub Pages.

## Decisión

- **Base:** React 19 + Vite, en **TypeScript**.
- **Componentes:** sin librería de componentes. Se usa HTML nativo (`<button aria-pressed>`, `<a>`) y componentes propios.
- **Estilos:** CSS plano con custom properties: un archivo de tokens con las 5 caras y uno por sección. Sin Tailwind.
- **Íconos:** SVG propios (correo, flecha, CV, LinkedIn, GitHub). Se elimina FontAwesome.
- **Fuentes:** alojadas en el propio sitio con Fontsource: `@fontsource-variable/archivo`, `funnel-display`, `unbounded`, `doto` y `@fontsource/michroma`. Antes de usar Archivo hay que verificar que su paquete incluye el eje `wdth`.
- **Animación:** View Transitions API nativa y CSS. Sin librería de animación.
- **SEO:** metadatos fijos en `index.html` (title, description, canonical, Open Graph/Twitter con una imagen de 1200×630), JSON-LD `Person`, `robots.txt`, `sitemap.xml` y favicon. Sin prerender ni librería de SEO.
- **Hosting:** Cloudflare Pages con dominio propio (el nombre está pendiente). Reemplaza a `gh-pages`.
- **Analítica:** Cloudflare Web Analytics. No usa cookies, así que no requiere banner.
- **Calidad:** lint y build en CI, más un smoke test de Playwright que cambia de cara y verifica que la fila de slots no se mueve.

## Alternativas descartadas

- **Librerías de componentes (shadcn, MUI):** imponen un estilo propio que choca con las 5 caras.
- **Tailwind:** sería una segunda capa sobre las mismas variables.
- **lucide-react:** una dependencia para 5 íconos, con logos de marca de soporte incierto.
- **Framer Motion:** duplica lo que el navegador ya resuelve con View Transitions.
- **GitHub Pages:** sirve, pero Cloudflare Pages concentra el dominio, el deploy y la analítica en el mismo lugar que TrainLog.

## Consecuencias

- Salen FontAwesome, `gh-pages`, los componentes actuales, los respaldos `*~` y el `.env` versionado.
- El contacto es correo directo (`mailto:`), así que `@emailjs/browser` también sale.
- Mientras no haya dominio, `index.html` no lleva `canonical` ni `og:url`, no hay `sitemap.xml` y `og:image` usa una ruta relativa. Varios lectores de vista previa exigen URL absoluta, así que se completa al definir el dominio.
- La corrección de los 3 detalles de contraste que señaló la revisión (foco, texto pequeño sobre regiones, íconos atenuados) entra en esta reconstrucción.
