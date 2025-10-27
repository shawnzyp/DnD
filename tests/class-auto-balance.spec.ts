import { test, expect } from '@playwright/test';

async function waitForBuilderData(page) {
  await page.waitForFunction(() => {
    const ready = (window as any).dndDataReady;
    if (ready && typeof ready.then === 'function') {
      return ready.then(() => true);
    }
    const data = (window as any).dndBuilderData || (window as any).dndData;
    return Boolean(data && Array.isArray(data.classes) && data.classes.length);
  });
  await page.waitForFunction(() => {
    const raceSelect = document.querySelector('select[name="race"]') as HTMLSelectElement | null;
    return Boolean(raceSelect && raceSelect.options.length > 1);
  });
}

test.describe('Class auto-balancing', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem('dndBuilderCoachMarksSeen', '1');
      } catch (error) {
        // ignore storage issues in headless browsers
      }
    });
    await page.goto('/builder/');
    await page.waitForLoadState('networkidle');
    await waitForBuilderData(page);
    const overlay = page.locator('#coachmark-overlay[aria-hidden="false"]');
    if (await overlay.isVisible()) {
      await overlay.locator('button', { hasText: /skip|got it/i }).first().click();
    }
  });

  test('splits existing levels when adding a new class', async ({ page }) => {
    const nameInput = page.locator('input[name="name"]');
    await nameInput.fill('Auto Balance Tester');

    const raceSelect = page.locator('select[name="race"]');
    const raceValue = await raceSelect.evaluate((select) => {
      const options = Array.from(select.options);
      const first = options.find((option) => option.value);
      return first ? first.value : '';
    });
    if (raceValue) {
      await raceSelect.selectOption(raceValue);
    }

    const next = page.locator('nav.sticky-nav button#next-step');
    await next.click();

    const classSelect = page.locator('[data-class-row] select[data-class-select]');
    await page.waitForFunction(() => {
      const select = document.querySelector('[data-class-row] select[data-class-select]') as HTMLSelectElement | null;
      return Boolean(select && select.options.length > 1);
    });
    const classValue = await classSelect.evaluate((select) => {
      const options = Array.from(select.options);
      const first = options.find((option) => option.value);
      return first ? first.value : '';
    });
    if (classValue) {
      await classSelect.selectOption(classValue);
    }

    const primaryLevel = page.locator('[data-class-row]').first().locator('input[data-class-level]');
    await primaryLevel.fill('4');
    await primaryLevel.blur();

    const addButton = page.locator('[data-class-add]');
    await addButton.click();

    const levelInputs = page.locator('[data-class-row] input[data-class-level]');
    await expect(levelInputs).toHaveCount(2);
    await expect(levelInputs.nth(0)).toHaveValue('2');
    await expect(levelInputs.nth(1)).toHaveValue('2');

    const summaryWarnings = page.locator('[data-class-summary-warnings] li');
    await expect(summaryWarnings.first()).toContainText('automatically balanced', { ignoreCase: true });

    if (classValue) {
      const secondSelect = page.locator('[data-class-row]').nth(1).locator('select[data-class-select]');
      await secondSelect.selectOption(classValue);
    }

    await levelInputs.nth(0).fill('3');
    await levelInputs.nth(0).blur();

    await expect(levelInputs.nth(0)).toHaveValue('3');
    await expect(levelInputs.nth(1)).toHaveValue('2');
    await expect(page.locator('[data-class-summary-warnings]')).toBeHidden();
  });
});
