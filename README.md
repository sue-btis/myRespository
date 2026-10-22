# Josue Escobar — portfolio

One-page portfolio. Choosing one of the area modules (01–04) reskins the whole site; the layout never moves.

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

Add it to `PROJECTS` in `src/content.ts`. An area's slot appears only once the area holds at least one project.
