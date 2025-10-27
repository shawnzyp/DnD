# Testing the Mobile Builder Flow

This project uses [Playwright](https://playwright.dev/) to exercise the seven-step character builder with a 390×844 mobile viewport. The suite verifies:

- No horizontal scrolling on the builder home step.
- The sticky bottom navigation remains reachable when the virtual keyboard compresses the viewport.
- Attunement limits are enforced when attempting to add a fourth attuned item.
- Feat summaries include prerequisite messaging for locked options.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Install the required Playwright browsers (run once per machine):
   ```bash
   npx playwright install --with-deps
   ```
3. Run the tests:
   ```bash
   npm test
   ```

The Playwright config automatically starts a static server on port 4173 before executing the suite.

## Useful scripts

- `npm run test:ui` – Launches the Playwright UI mode for interactive debugging.
- `npm run test:debug` – Starts the suite in headed debug mode.

## Continuous integration

GitHub Actions runs the mobile builder test on every push and pull request to guard the phone-first UX.
