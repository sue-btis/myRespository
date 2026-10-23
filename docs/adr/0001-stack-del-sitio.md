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
- **Animación:** CSS, Web Animations y canvas 2D propios, sin librería de animación. La escena 3D del hero usa `three` 0.170.0 (carga diferida) porque el objeto que cambia de forma por área y sigue al cursor necesita WebGL instanciado.
- **SEO:** metadatos fijos en `index.html` (title, description, canonical, Open Graph/Twitter con una imagen de 1200×630), JSON-LD `Person`, `robots.txt`, `sitemap.xml` y favicon. Sin prerender ni librería de SEO.
- **Hosting:** Cloudflare (Workers con archivos estáticos, que respetan `public/_headers`) en `myrespository.josuee152.workers.dev`, publicado desde `main`; `bit.ly/JosueDev` apunta ahí. El dominio propio sigue pendiente. Reemplaza a `gh-pages`.
- **Analítica:** Cloudflare Web Analytics. No usa cookies, así que no requiere banner.
- **Calidad:** lint y build en CI, más un smoke test de Playwright que cambia de cara y verifica que la fila de tarjetas de área no se mueve.

## Alternativas descartadas

- **Librerías de componentes (shadcn, MUI):** imponen un estilo propio que choca con las 5 caras.
- **Tailwind:** sería una segunda capa sobre las mismas variables.
- **lucide-react:** una dependencia para 5 íconos, con logos de marca de soporte incierto.
- **Framer Motion:** duplica lo que el navegador ya resuelve con View Transitions.
- **GitHub Pages:** sirve, pero Cloudflare Pages concentra el dominio, el deploy y la analítica en el mismo lugar que TrainLog.

## Consecuencias

- Salen FontAwesome, `gh-pages`, los componentes actuales, los respaldos `*~` y el `.env` versionado.
- El contacto es correo directo (`mailto:`), así que `@emailjs/browser` también sale.
- `canonical`, `og:url`, `og:image`, el JSON-LD, `sitemap.xml` y `robots.txt` usan la URL de `workers.dev`; al tener dominio propio se cambia en `index.html`, `public/sitemap.xml` y `public/robots.txt`.
- La corrección de los 3 detalles de contraste que señaló la revisión (foco, texto pequeño sobre regiones, íconos atenuados) entra en esta reconstrucción.
