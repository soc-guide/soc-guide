# Architecture

## Decision summary

SOC Guide is a static React application built with Vite and deployed to GitHub
Pages. The existing React UI remains the application foundation because it
already implements the guide's interaction model and contains substantial
feature work. The earlier Astro starter contributes repository standards,
validation, governance, and documentation rather than replacing the UI.

## Runtime

```text
Browser
  ├─ index.html
  ├─ React application
  ├─ CSS bundles
  └─ static JSON from public/data/
```

There is no application server, runtime database, or user authentication.
Hash routes keep deep navigation reliable under the GitHub Pages project path.

## Source boundaries

- `src/pages/`: route-level views
- `src/features/`: complex guide interactions
- `src/components/`: reusable UI primitives
- `src/lib/`: routing, data access, storage, formatting, and utility logic
- `src/data/`: authored data that belongs in source control, currently lore
- `public/data/`: generated game-data snapshots consumed at runtime
- `scripts/`: offline extraction and validation tools

## Data flow

```text
Workbook export
  → scripts/extract_guide_data.py
  → public/data/*.json
  → scripts/validate-data.mjs
  → Vite build
  → GitHub Pages
```

## Persistence

Selections such as loadouts are stored only in the visitor's browser through
local storage. They are not synchronized or transmitted to a backend.

## Why not migrate to Astro now?

A migration would rewrite mature React pages, modal workspaces, skill-tree
interaction, local persistence, and more than ten thousand lines of UI/CSS
without producing equivalent user value. Astro remains a possible later
shell/SEO migration, documented as a separate architectural decision if the
site needs non-hash URLs or extensive content pages.
