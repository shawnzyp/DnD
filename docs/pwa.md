# Progressive Web App guide

Quest Kit ships as a Progressive Web App (PWA) so you can pin it to a home screen and keep your packs available offline. This document covers install instructions for Android and iOS, explains the splash experience, and outlines the current offline limitations based on the service worker and web app manifest.

## Install instructions

### Android (Chrome, Edge, Brave)
1. Open <https://questkit.example> (or your deployment URL) in a Chromium-based browser.
2. Wait for the "Install app" or "Add to home screen" prompt, or open the browser menu and choose **Install app**.
3. Confirm the install. The app will launch in a standalone window using the `display: "standalone"` mode defined in the manifest.【F:manifest.webmanifest†L1-L22】
4. The icon and splash background follow the manifest colours (`background_color` `#0b1014`, `theme_color` `#4cc2ff`).【F:manifest.webmanifest†L1-L22】

### iOS and iPadOS (Safari)
1. Open the site in Safari.
2. Tap the **Share** icon, then choose **Add to Home Screen**.
3. Optionally rename the shortcut, then tap **Add**. Safari uses the manifest metadata for the icon and colours when launching from the home screen.【F:manifest.webmanifest†L1-L22】

### Desktop browsers
- Chrome and Edge offer an **Install app** option in the omnibox or menu once the service worker is registered.
- Safari on macOS supports **Add to Dock** after you open the share menu and pick **Add to Dock**.

## Splash and launch behaviour

The manifest declares a dark background (`#0b1014`) and accent theme colour (`#4cc2ff`). When the app launches from the home screen, browsers show a splash screen using those values together with the SVG icons packaged in the manifest.【F:manifest.webmanifest†L1-L22】 Because `display` is set to `standalone`, the UI opens without the browser chrome and respects the theme colour update logic driven by the runtime theme switcher.【F:js/app.js†L1-L117】

## Offline caching model

Quest Kit registers a service worker (`/sw.js`) that precaches the app shell and keeps pack data up to date:

- **App shell cache:** During install, the worker caches the homepage, shared scripts, builder and compendium entry points, the manifest, and `packs/manifest.json`. These assets are served with a cache-first strategy while offline.【F:sw.js†L1-L61】【F:sw.js†L83-L115】
- **Pack data cache:** Requests under `/data/` use a stale-while-revalidate strategy so previously loaded packs remain available offline while refreshing in the background when online.【F:sw.js†L117-L150】
- **Updates:** When packs change, the runtime posts a `packs:update` message to the worker so it can refresh cached JSON files and prune outdated entries.【F:sw.js†L152-L209】

### Current limitations

- Only same-origin requests are cached. External resources (for example, third-party fonts or remote pack URLs) are not available offline.【F:sw.js†L117-L139】
- The app shell must load at least once while online to populate the caches; first-time visitors without a network connection see the fallback offline page.
- Importing packs from a URL requires network access and the service worker only caches them after the initial fetch.
- Pack updates occur lazily. Staying offline keeps existing data, but you need to reconnect before new revisions can sync.

Keep these behaviours in mind when preparing demo devices or sharing the app with players who expect fully offline usage.
