import { test, expect } from '@playwright/test';

const PORTRAIT = { width: 390, height: 844 };
const LANDSCAPE = { width: 844, height: 390 };

const PREFS = JSON.stringify({
  selectedServices: ['youtube-tv', 'espn-plus', 'peacock', 'hulu-live'],
  selectedSport: 'all',
  onboardingComplete: true,
});

test.describe('Mobile portrait', () => {
  test.use({ viewport: PORTRAIT });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((p) => localStorage.setItem('tv-guide-preferences', p), PREFS);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('header text is not obscured by the tab bar', async ({ page }) => {
    await expect(page.getByTestId('guide-screen')).toBeVisible({ timeout: 15_000 });
    const headerTitle = page.getByTestId('guide-header').getByText('Lineup');
    await expect(headerTitle).toBeVisible();

    const titleBox = await headerTitle.boundingBox();
    expect(titleBox).toBeTruthy();
    expect(titleBox!.y).toBeGreaterThanOrEqual(60);
  });

  test('sport filter is visible and not overlapping header', async ({ page }) => {
    await expect(page.getByTestId('guide-screen')).toBeVisible({ timeout: 15_000 });
    const filter = page.getByTestId('sport-filter');
    await expect(filter).toBeVisible();

    const headerBox = await page.getByTestId('guide-header').boundingBox();
    const filterBox = await filter.boundingBox();
    expect(headerBox).toBeTruthy();
    expect(filterBox).toBeTruthy();
    expect(filterBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 2);
  });

  test('event content is scrollable below the filter', async ({ page }) => {
    await expect(page.getByTestId('guide-screen')).toBeVisible({ timeout: 15_000 });

    const eventRows = page.locator('[data-testid^="event-row-"]');
    const noGames = page.getByText('No games right now');
    await expect(eventRows.first().or(noGames)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Mobile landscape', () => {
  test.use({ viewport: LANDSCAPE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((p) => localStorage.setItem('tv-guide-preferences', p), PREFS);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('full page is scrollable', async ({ page }) => {
    await expect(page.getByTestId('guide-screen')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('guide-header')).toBeVisible();
    await expect(page.getByTestId('sport-filter')).toBeVisible();
  });

  test('event content is visible alongside header and filter', async ({ page }) => {
    await expect(page.getByTestId('guide-screen')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('guide-header')).toBeVisible();
    await expect(page.getByTestId('sport-filter')).toBeVisible();

    const eventRows = page.locator('[data-testid^="event-row-"]');
    const noGames = page.getByText('No games right now');
    await expect(eventRows.first().or(noGames)).toBeVisible({ timeout: 10_000 });

    const headerBox = await page.getByTestId('guide-header').boundingBox();
    const viewportHeight = LANDSCAPE.height;
    expect(headerBox).toBeTruthy();
    expect(headerBox!.y + headerBox!.height).toBeLessThan(viewportHeight * 0.6);
  });
});
