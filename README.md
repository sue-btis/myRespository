# Josue Escobar — portfolio

One-page portfolio. Choosing one of the four area cards (01–04, or keys 1–4) reskins the whole site: palette, type, the canvas dot field and the 3D hero object. Esc returns to neutral.

- Product direction: [docs/product/brief.md](docs/product/brief.md), [PRODUCT.md](PRODUCT.md)
- Visual system: [DESIGN.md](DESIGN.md)
- Stack decisions: [docs/adr/0001-stack-del-sitio.md](docs/adr/0001-stack-del-sitio.md)

## Run

```bash
npm install
npm run dev
```

`npm run lint`, `npm run build` and `npm run test:e2e` (Playwright, uses the installed Chrome) are what CI runs.

## Adding a project

Add it to `PROJECTS` in `src/content.ts`. Each project is a cartridge in the Work console. A project with `shots` boots into the screens carousel, one with `plugins` into the terminal; any other shows only its details. Every area always has a hero card; an area with no project shows an empty slot in Work until one is added.
