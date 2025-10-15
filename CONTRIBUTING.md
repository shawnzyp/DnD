# Contributing Guidelines

Thanks for helping expand the D&D Companion dataset! Follow the notes below so new entries remain consistent and easy to surface in the UI.

## Spell data (`data/spells.js`)
- Every spell object must include a `ritual` boolean. Set it to `true` only when the spell can be cast as a ritual in the referenced ruleset; otherwise use `false`.
- Keep `keywords` focused on searchable concepts (damage type, role, source nicknames). The loader automatically merges them with any optional `tags` array and adds a `Ritual` pill when the flag is `true`.
- Provide full casting metadata:
  - `level`, `school`, `classes`, `castingTime`, `range`, `duration`, `components`, `savingThrow` (or leave blank if none), and a concise `summary` that calls out noteworthy cross-edition differences.
  - `edition` should list the first supplement/edition where the spell appeared, plus any notable reprints (e.g., “Tasha's Cauldron of Everything (2020) · 2024 PHB preview”).
  - `source` should cite the exact book and page or official article supporting the entry. Separate multiple references with semicolons.
- When adding material from a new supplement, update the `supplementCoverageGaps` export if the addition closes a previously identified gap or if fresh omissions should be tracked.

## Class data (`data/classes.js`)
- Group classes beneath the correct edition key (e.g., `"5e"`, `"1e"`, `"becmi"`).
- Summaries should highlight level caps, multiclass restrictions, and signature mechanics unique to that ruleset. Use the `comparison` note to explain how to emulate legacy quirks (such as THAC0 or race-as-class) with modern tools.
- Include at least one primary source link for the edition (original boxed set, Rules Cyclopedia, etc.).

Following these conventions keeps the navigation filters and comparison tooling aligned with the data model. If you are unsure about a rule citation, prefer primary sources or officially hosted reprints.
