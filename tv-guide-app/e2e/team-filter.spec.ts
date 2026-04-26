import { test, expect } from '@playwright/test';

test.describe('Team filter on guide', () => {
  test('favorites toggle is hidden when no favorites are set', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'tv-guide-preferences',
        JSON.stringify({
          selectedServices: ['youtube-tv', 'espn-plus'],
          selectedSport: 'all',
          favoriteTeams: [],
          favoriteSports: [],
          onboardingComplete: true,
        }),
      );
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('guide-screen')).toBeVisible({ timeout: 15_000 });

    await expect(page.getByTestId('team-toggle')).not.toBeVisible();
  });

  test('favorites toggle is visible when favorite teams are set', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'tv-guide-preferences',
        JSON.stringify({
          selectedServices: ['youtube-tv', 'espn-plus'],
          selectedSport: 'all',
          favoriteTeams: ['nba:2', 'nba:13'],
          favoriteSports: [],
          onboardingComplete: true,
        }),
      );
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('guide-screen')).toBeVisible({ timeout: 15_000 });

    await expect(page.getByTestId('team-toggle')).toBeVisible();
    await expect(page.getByTestId('team-toggle-all')).toBeVisible();
    await expect(page.getByTestId('team-toggle-my')).toBeVisible();
  });

  test('favorites toggle is visible when favorite sports are set', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'tv-guide-preferences',
        JSON.stringify({
          selectedServices: ['youtube-tv', 'espn-plus'],
          selectedSport: 'all',
          favoriteTeams: [],
          favoriteSports: ['golf'],
          onboardingComplete: true,
        }),
      );
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('guide-screen')).toBeVisible({ timeout: 15_000 });

    await expect(page.getByTestId('team-toggle')).toBeVisible();
  });
});

test.describe('My Favorites in settings', () => {
  test('shows My Favorites section on settings page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'tv-guide-preferences',
        JSON.stringify({
          selectedServices: ['youtube-tv'],
          selectedSport: 'all',
          favoriteTeams: [],
          favoriteSports: [],
          onboardingComplete: true,
        }),
      );
    });
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('settings-screen')).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText('My Favorites')).toBeVisible();
    await expect(page.getByText('Follow sports and teams')).toBeVisible();
  });

  test('shows team picker with sport toggles in settings', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'tv-guide-preferences',
        JSON.stringify({
          selectedServices: ['youtube-tv'],
          selectedSport: 'all',
          favoriteTeams: [],
          favoriteSports: [],
          onboardingComplete: true,
        }),
      );
    });
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('settings-screen')).toBeVisible({ timeout: 15_000 });

    const favoritesHeading = page.getByText('My Favorites');
    await favoritesHeading.scrollIntoViewIfNeeded();
    await expect(favoritesHeading).toBeVisible({ timeout: 15_000 });

    const sportsLabel = page.getByText('Sports', { exact: true });
    const noTeams = page.getByText('No teams available right now');
    await expect(sportsLabel.or(noTeams)).toBeVisible({ timeout: 15_000 });
  });
});
