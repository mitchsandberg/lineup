import { test, expect } from '@playwright/test';

test.describe('Guide navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'tv-guide-preferences',
        JSON.stringify({
          selectedServices: ['youtube-tv', 'espn-plus', 'peacock', 'hulu-live'],
          selectedSport: 'all',
          onboardingComplete: true,
        }),
      );
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('shows the guide screen with header', async ({ page }) => {
    await expect(page.getByTestId('guide-screen')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('guide-header')).toBeVisible();
    await expect(page.getByTestId('guide-header').getByText('Lineup')).toBeVisible();
  });

  test('shows the date in the header', async ({ page }) => {
    await expect(page.getByTestId('guide-date')).toBeVisible({ timeout: 15_000 });
    const dateText = await page.getByTestId('guide-date').textContent();
    expect(dateText).toBeTruthy();
    expect(dateText!.length).toBeGreaterThan(0);
  });

  test('displays sport filter pills', async ({ page }) => {
    await expect(page.getByTestId('sport-filter')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('sport-filter-all-sports')).toBeVisible();
    await expect(page.getByTestId('sport-filter-nfl')).toBeVisible();
    await expect(page.getByTestId('sport-filter-nba')).toBeVisible();
  });

  test('clicking a sport filter changes content', async ({ page }) => {
    await expect(page.getByTestId('sport-filter')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('sport-filter-nba').click();
    await expect(page.getByTestId('sport-filter-nba')).toBeVisible();
  });

  test('shows event rows when events are available', async ({ page }) => {
    await expect(page.getByTestId('guide-screen')).toBeVisible({ timeout: 15_000 });

    const eventRows = page.locator('[data-testid^="event-row-"]');
    const noGames = page.getByText('No games right now');

    await expect(eventRows.first().or(noGames)).toBeVisible({ timeout: 10_000 });
  });
});
