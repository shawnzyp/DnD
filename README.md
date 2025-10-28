# Quest Kit

Quest Kit is a browser-based companion for tabletop role-playing games. It bundles a compendium, character builder, and offline-ready content pack manager that runs entirely in the browser via service workers.

## Documentation

- [Testing guide](docs/testing.md)
- [Content pack reference](docs/packs.md)
- [Progressive Web App guide](docs/pwa.md)

## Deployment

The project deploys automatically to GitHub Pages after the Playwright test suite succeeds on the `main` branch. Visit `https://<your-github-username>.github.io/DnD/` (replace `<your-github-username>` with the account or organization that owns this repository) to view the published site, or open the **github-pages** environment in the repository to follow the latest release.

## Development

Install dependencies and run the local preview server:

```bash
npm install
npm run dev
```

Pack data and UI state are loaded through the `js/loader.js` runtime, which exposes a `window.dnd` API for modules like the builder and compendium. See the content pack reference for schema details and merge behaviour.

### Content ingest helpers

The `scripts/pocket_squire_ingest.py` utility can mirror Creative Commons data from [Open5e](https://open5e.com/) and, optionally, crawl D&D Wiki content with light license capture for auditing. It requires Python 3 with the `requests`, `beautifulsoup4`, `html2text`, and `tqdm` packages installed.

```bash
python3 scripts/pocket_squire_ingest.py
```

Outputs are written to `ddb_ingest_out/` alongside a simple HTTP cache to avoid unnecessary requests when iterating.
