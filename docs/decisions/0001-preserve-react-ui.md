# ADR 0001: Preserve the React UI as the application foundation

- Status: Accepted
- Date: 2026-07-29

## Context

A small Astro starter and a much more complete React/Vite UI existed in
parallel. The React project already implemented the intended visual system,
multiple catalogs, interactive character details, loadout editing, rank trees,
local persistence, lore, and the data extraction pipeline.

## Decision

Keep React/Vite as the runtime application. Merge the starter's governance,
documentation, CI/CD, validation, and repository standards into the React
project. Do not retain duplicate Astro pages.

## Consequences

- Existing UI work is preserved.
- Deployment remains a static GitHub Pages build.
- Hash routing continues for reliable project-site navigation.
- A future Astro migration must justify its rewrite cost and be handled in a
  separate ADR.
