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

test.describe('Builder mobile journey', () => {
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
      await overlay.locator('button', { hasText: /skip|got it/i }).first().tap();
    }
  });

  test('supports thumb-first navigation and mobile UX constraints', async ({ page }) => {
    const horizontalOverflow = await page.evaluate(() => {
      const tolerance = 1;
      const width = window.innerWidth;
      const bodyOverflow = document.body.scrollWidth - width;
      const docOverflow = document.documentElement.scrollWidth - width;
      return bodyOverflow > tolerance || docOverflow > tolerance;
    });
    expect(horizontalOverflow).toBeFalsy();

    const nav = page.locator('nav.sticky-nav');
    await expect(nav).toBeVisible();

    const nameInput = page.locator('input[name="name"]');
    await nameInput.tap();

    await page.setViewportSize({ width: 390, height: 500 });
    const navBox = await nav.boundingBox();
    expect(navBox).not.toBeNull();
    if (navBox) {
      expect(navBox.y + navBox.height).toBeLessThanOrEqual(500);
    }

    await page.setViewportSize({ width: 390, height: 844 });

    await nameInput.fill('Mobile Tester');

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
    await next.tap();

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
    await next.tap();

    await expect(page.locator('[data-ability-grid] input[name="str"]')).toBeVisible();
    await next.tap();

    const featSummary = page.locator('[data-feat-summary]');
    await expect(featSummary).toBeVisible();
    await expect(featSummary).toContainText('locked by prerequisites', { ignoreCase: true });
    await next.tap();

    const attuneInput = page.locator('[data-equipment-group="attunements"] [data-equipment-input]');
    const attuneAdd = page.locator('[data-equipment-group="attunements"] [data-equipment-action="add"]');
    for (let i = 1; i <= 3; i += 1) {
      await attuneInput.fill(`Custom Focus ${i}`);
      await attuneAdd.tap();
    }
    const attuneFeedback = page.locator('[data-equipment-group="attunements"] [data-equipment-feedback]');
    await expect(attuneFeedback).toContainText('3/3');
    await attuneInput.fill('Custom Focus 4');
    await attuneAdd.tap();
    await expect(attuneFeedback).toContainText('slots are full');
    await next.tap();

    await expect(page.locator('section.step[data-step="familiar"]')).toHaveClass(/active/);
    await next.tap();

    await expect(page.locator('section.step[data-step="finalize"]')).toHaveClass(/active/);
  });

  test('selecting an SRD race seeds derived languages and speed', async ({ page }) => {
    const raceSelect = page.locator('select[name="race"]');
    await raceSelect.selectOption({ label: 'Dwarf' });

    await page.waitForFunction(() => {
      const state = (window as any).dndBuilderState;
      if (!state || !state.derived) return false;
      const languages = state.derived.languages;
      const speed = state.derived.speed;
      return (
        Array.isArray(languages?.list) &&
        languages.list.includes('Common') &&
        languages.list.includes('Dwarvish') &&
        speed &&
        (speed.base === 25 || (typeof speed.label === 'string' && speed.label.includes('25')))
      );
    });

    const builderState = await page.evaluate(() => (window as any).dndBuilderState);
    expect(builderState?.derived?.languages?.list).toEqual(
      expect.arrayContaining(['Common', 'Dwarvish'])
    );
    expect(builderState?.derived?.speed?.base).toBe(25);
    expect(builderState?.derived?.speed?.label).toContain('25');

    await page.locator('#toggle-summary').click();
    await page.waitForFunction(
      () => document.getElementById('summary-panel')?.classList.contains('visible')
    );

    const languagesNote = page.locator('#summary-panel textarea[data-track="languagesNote"]');
    await expect(languagesNote).toHaveValue(/Common,\s*Dwarvish/);

    const speedCard = page.locator('#summary-panel [data-speed-card]');
    await expect(speedCard.locator('[data-speed-current]')).toHaveText(/25/);
    await expect(speedCard.locator('[data-speed-detail]')).toContainText(/Base/i);
    await expect(speedCard.locator('input[data-track="speedOverride"]')).toHaveValue('');
  });
});
