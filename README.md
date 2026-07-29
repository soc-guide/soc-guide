# SOC Guide

A community-maintained, unofficial Sword of Convallaria guide built as a
static React application for GitHub Pages.

## What this repository contains

- Character catalog and detailed character pages
- Trait star comparison and rank 1–13 skill trees
- Gear and tarot catalogs
- Interactive gear and skill loadout viewers
- Local browser persistence for selected builds
- FAQ and lore archive
- Offline workbook-to-JSON extraction
- Data validation, CI, GitHub Pages deployment, issue forms, and contribution
  standards

## Stack

- React 19
- TypeScript
- Vite
- Static JSON data
- GitHub Actions and GitHub Pages
- Python only for optional offline spreadsheet extraction

No backend, database, visitor account, or application authentication is
required.

## Run locally

```bash
npm install
npm run dev
```

Complete validation:

```bash
npm run check
npm run format:check
```

Production preview:

```bash
npm run build
npm run preview
```

## Routes

The app uses hash routes so navigation works under the GitHub Pages project
subdirectory:

```text
#/characters
#/character/afra
#/gear
#/tarot
#/faq
#/lore
```

Legacy HTML entry points redirect into the equivalent hash route.

## Data pipeline

Generated runtime data lives in `public/data/`.

```bash
python scripts/extract_guide_data.py /path/to/workbook.xlsx \
  --data-dir public/data
npm run validate:data
```

The workbook is not required by visitors and should not be committed when it
contains private or licensed source material.

## Repository architecture

See:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- [`docs/ASSET_POLICY.md`](docs/ASSET_POLICY.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md)

## Deployment

The production repository is `soc-guide/soc-guide`. Set **Settings → Pages →
Source** to **GitHub Actions**. Pushes to `main` build and deploy `dist/`.

Expected URL:

```text
https://soc-guide.github.io/soc-guide/
```

## Licensing and affiliation

Project code and original documentation are available under the MIT License.
Game names, data, artwork, icons, and other third-party material remain the
property of their respective owners. This project is unofficial and not
endorsed by the game's publisher.
