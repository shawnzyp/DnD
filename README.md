# Quest Kit

Quest Kit is a browser-based companion for tabletop role-playing games. It bundles a compendium, character builder, and offline-ready content pack manager that runs entirely in the browser via service workers.

## Documentation

- [Testing guide](docs/testing.md)
- [Content pack reference](docs/packs.md)
- [Progressive Web App guide](docs/pwa.md)

## Development

Install dependencies and run the local preview server:

```bash
npm install
npm run dev
```

Pack data and UI state are loaded through the `js/loader.js` runtime, which exposes a `window.dnd` API for modules like the builder and compendium. See the content pack reference for schema details and merge behaviour.
