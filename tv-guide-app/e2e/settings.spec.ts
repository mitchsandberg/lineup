import { test, expect } from '@playwright/test';

test.describe('Settings screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'tv-guide-preferences',
        JSON.stringify({
          selectedServices: ['youtube-tv', 'espn-plus'],
          selectedSport: 'all',
          onboardingComplete: true,
        }),
      );
    });
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('shows the settings screen', async ({ page }) => {
    await expect(page.getByTestId('settings-screen')).toBeVisible({ timeout: 15_000 });
  });

  test('displays service selector with options', async ({ page }) => {
    await expect(page.getByTestId('settings-screen')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('YouTube TV')).toBeVisible();
  });
});
