import { test, expect } from '@playwright/test';

test.describe('Onboarding flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  });

  test('shows welcome screen on first visit', async ({ page }) => {
    await expect(page.getByTestId('onboarding-welcome')).toBeVisible();
    await expect(page.getByText('Lineup')).toBeVisible();
    await expect(page.getByText('Live Sports TV Guide')).toBeVisible();
  });

  test('Get Started button navigates to service picker', async ({ page }) => {
    await page.getByTestId('onboarding-get-started').click();
    await expect(page.getByTestId('onboarding-service-picker')).toBeVisible();
    await expect(page.getByText('Pick your streaming services')).toBeVisible();
  });

  test('can select services and complete onboarding', async ({ page }) => {
    await page.getByTestId('onboarding-get-started').click();
    await expect(page.getByTestId('onboarding-service-picker')).toBeVisible();

    await page.getByTestId('onboarding-service-youtube-tv').click();

    const completeBtn = page.getByTestId('onboarding-complete');
    await expect(completeBtn).toBeEnabled();
    await completeBtn.click();

    await expect(page.getByTestId('guide-screen')).toBeVisible({ timeout: 10_000 });
  });

  test('complete button is disabled with no services selected', async ({ page }) => {
    await page.getByTestId('onboarding-get-started').click();
    await expect(page.getByTestId('onboarding-service-picker')).toBeVisible();

    const allServiceButtons = page.locator('[data-testid^="onboarding-service-"]');
    const count = await allServiceButtons.count();

    for (let i = 0; i < count; i++) {
      const btn = allServiceButtons.nth(i);
      const text = await btn.textContent();
      if (text?.includes('✓')) {
        await btn.click();
      }
    }

    await expect(page.getByTestId('onboarding-complete')).toBeDisabled();
  });
});
