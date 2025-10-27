# Content pack reference

Quest Kit loads both built-in and custom content packs, merges their datasets, and surfaces them across the home screen, compendium, and builder. This guide outlines the JSON schema expected for each pack, explains how priority and ordering affect merged records, and walks through the import workflow exposed in the UI.

## Pack manifest schema

Each pack is described by a manifest entry. Built-in packs are listed in [`packs/manifest.json`](../packs/manifest.json), while imported packs provide the same fields through local storage. Normalised pack definitions include the following properties:

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Unique, URL-safe identifier. Required. Empty values are discarded. |
| `name` | string | Human-readable pack name. Defaults to the `id` when omitted. |
| `edition` | string | Edition label displayed alongside the pack. Optional. |
| `version` | string | Semantic version or revision indicator. Optional. |
| `description` | string | Short summary for UI hints. Optional. |
| `license` | string | License or usage note shown in summaries. Optional. |
| `priority` | number | Determines merge precedence. Defaults to `50` when not provided. Higher numbers win. |
| `path` | string | Base URL (relative or absolute) for fetching dataset JSON files. Optional when data is embedded. |
| `files` | string[] | Dataset keys (without `.json`). Defaults to the standard set when missing. Deduplicated automatically. |
| `data` | object | Inline datasets keyed by the dataset name. Used instead of fetching files when present. |
| `origin` | string | Source tag such as `file` or `url` for imported packs. Optional. |
| `url` | string | Original download URL for user-imported packs. Optional. |
| `filename` | string | Original filename for file imports. Optional. |
| `addedAt` | number | Timestamp recorded when a user pack is saved locally. Optional. |

During loading, each dataset is normalised so every record has a slug, derives its `id` when missing, and carries source metadata (`sourceId`, `source.name`, license, etc.) from the pack definition.【F:js/loader.js†L592-L667】 Dataset names default to the standard list of `classes`, `races`, `backgrounds`, `feats`, `spells`, `items`, `companions`, `rules`, `skills`, and `monsters` when nothing is specified.【F:js/loader.js†L541-L560】【F:js/loader.js†L567-L582】

## Priority and merge rules

After all enabled packs are loaded, Quest Kit merges them by dataset key and record slug. Merge precedence is controlled by two factors:

1. **Priority number:** Higher `priority` values replace lower ones for the same slug.
2. **Pack order:** When priorities tie, the pack that appears later in the ordered list (lower in the manager UI) wins.

As packs are processed, the loader tracks each dataset in a map and records the winning entry with its priority and evaluation order.【F:js/loader.js†L710-L744】 Once all packs are applied, merged datasets are sorted alphabetically by record name, and transient merge metadata (`priority`, `index`) is removed before exposing the data to the UI.【F:js/loader.js†L746-L764】

The overall pack order comes from the pack manager. Enabled packs are persisted to IndexedDB and localStorage so reordering or toggling a pack updates the canonical `order` and `enabled` map used during the next refresh.【F:js/loader.js†L818-L880】【F:js/home.js†L337-L388】

## Import workflow

Quest Kit supports three ways to manage packs:

1. **Built-in manifest:** The loader fetches `/packs/manifest.json`, normalises each entry, and loads enabled datasets automatically on start-up.【F:js/loader.js†L825-L889】【F:packs/manifest.json†L1-L22】
2. **File import:** From the builder header, choose **Import pack file** to select a JSON manifest. The runtime reads the file, normalises it, stores it locally, and merges it into the active set.【F:builder/wizard.js†L1428-L1461】
3. **URL import:** Use **Import from URL** in the builder header to paste a manifest URL. The loader downloads the manifest, caches it, and merges the resulting pack.【F:builder/wizard.js†L1463-L1483】

After importing, packs appear in the home screen pack manager where you can drag to reorder, toggle enablement, or remove user-provided packs. Disabling a pack keeps it listed but excludes it from the merge. Removing deletes the cached data and local definition.【F:js/home.js†L331-L410】

## Pack structure tips

- **Datasets:** Each dataset file should be a JSON array of objects. Include a stable `slug` or `id` where possible; the loader falls back to slugifying the `name` for uniqueness.【F:js/loader.js†L604-L631】
- **Source metadata:** Leave `source` blank to let the loader populate pack metadata, ensuring builder and compendium views display the correct origin.【F:js/loader.js†L632-L667】
- **Custom fields:** Additional keys are preserved, so you can add bespoke properties that your UI extensions understand. Just keep the root objects JSON-serialisable.

With the manifest schema, merge rules, and import flow above, you can publish packs that layer cleanly on top of the SRD or other sources while giving players full control over precedence.
