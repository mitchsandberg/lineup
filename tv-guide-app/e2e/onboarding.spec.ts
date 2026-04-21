import { test, expect } from '@playwright/test';

test.describe('Onboarding flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
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

  test('can select services and proceed to market picker', async ({ page }) => {
    await page.getByTestId('onboarding-get-started').click();
    await expect(page.getByTestId('onboarding-service-picker')).toBeVisible();

    await page.getByTestId('onboarding-service-youtube-tv').click();

    const nextBtn = page.getByTestId('onboarding-next-services');
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    await expect(page.getByTestId('onboarding-market-picker')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Select your TV market')).toBeVisible();
  });

  test('can skip through market and team picker to complete onboarding', async ({ page }) => {
    await page.getByTestId('onboarding-get-started').click();
    await page.getByTestId('onboarding-service-youtube-tv').click();
    await page.getByTestId('onboarding-next-services').click();

    await expect(page.getByTestId('onboarding-market-picker')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('onboarding-skip-market').click();

    await expect(page.getByTestId('onboarding-team-picker')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('onboarding-skip-teams').click();

    await expect(page.getByTestId('guide-screen')).toBeVisible({ timeout: 10_000 });
  });

  test('can complete onboarding through all steps', async ({ page }) => {
    await page.getByTestId('onboarding-get-started').click();
    await page.getByTestId('onboarding-service-youtube-tv').click();
    await page.getByTestId('onboarding-next-services').click();

    await expect(page.getByTestId('onboarding-market-picker')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('onboarding-next-market').click();

    await expect(page.getByTestId('onboarding-team-picker')).toBeVisible({ timeout: 10_000 });

    const completeBtn = page.getByTestId('onboarding-complete');
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    await expect(page.getByTestId('guide-screen')).toBeVisible({ timeout: 10_000 });
  });

  test('next button is disabled with no services selected', async ({ page }) => {
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

    await expect(page.getByTestId('onboarding-next-services')).toHaveAttribute('aria-disabled', 'true');
  });
});
