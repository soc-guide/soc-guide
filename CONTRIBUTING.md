# Contributing

Thanks for helping improve SOC Guide.

## Development setup

```bash
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm run check
npm run format:check
```

## Data changes

Runtime data lives in `public/data/`. Prefer regenerating the JSON through
`scripts/extract_guide_data.py` instead of editing large generated files by hand.
Every data correction should include its source, game region/version where
relevant, and the date it was checked.

## Pull requests

- Keep one logical change per pull request.
- Explain visible behavior changes and data-source changes.
- Add screenshots for UI changes.
- Do not include secrets, private spreadsheets, or copyrighted asset dumps.
- Preserve GitHub Pages compatibility and hash routing unless an approved
  architecture decision replaces them.

## Commit style

Use concise imperative commits, for example:

- `feat: add faction filter persistence`
- `fix: correct Inanna rank skill data`
- `docs: document asset-source policy`
