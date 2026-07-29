# Deployment

The production repository is `soc-guide/soc-guide`.

## Initial setup

1. Push the repository to `main`.
2. Open **Settings → Pages**.
3. Select **GitHub Actions** as the Pages source.
4. Confirm the `Build site` and `Deploy guide to GitHub Pages` workflows pass.

The published project URL is expected to be:

```text
https://soc-guide.github.io/soc-guide/
```

## Local verification

```bash
npm install
npm run check
npm run preview
```

## Branch protection

After the first successful CI run, protect `main` with pull requests, required
conversation resolution, blocked force pushes/deletions, and the `Build site`
status check.
