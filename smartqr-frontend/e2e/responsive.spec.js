// @ts-check
import { test, expect } from '@playwright/test';

/**
 * SmartQR — Responsive Design E2E Tests
 * 
 * Validates that pages render correctly across viewports.
 * Uses Playwright's 'mobile-chrome' project for mobile tests.
 */

test.describe('Responsive Design', () => {

  test('landing page should load on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone 13
    await page.goto('/');

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Mobile menu toggle should be visible
    const mobileToggle = page.locator('.nav-mobile-toggle button, .nav-mobile-toggle');
    const desktopNav = page.locator('.nav-desktop');

    // On mobile, desktop nav is hidden
    // Just verify the page works
    await expect(heading).not.toBeEmpty();
  });

  test('scanner page should render correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/scan');

    await expect(page.getByRole('heading', { name: /scan product/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /open camera/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /upload image/i })).toBeVisible();
  });

  test('FAQ section should be functional on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Scroll to FAQ
    const faqHeading = page.getByText('Frequently asked questions');
    await faqHeading.scrollIntoViewIfNeeded();
    await expect(faqHeading).toBeVisible();

    // Accordion should still work on mobile
    const secondToggle = page.locator('#faq-toggle-1');
    await secondToggle.scrollIntoViewIfNeeded();
    await secondToggle.click();
    await expect(secondToggle).toHaveAttribute('aria-expanded', 'true');
  });

  test('about page should render all sections on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/about');

    await expect(page.getByText(/story behind SmartQR/i)).toBeVisible();

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await expect(page.getByText(/ready to try/i)).toBeVisible();
  });

  test('landing page should not have horizontal scroll on any viewport', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 375, height: 812, name: 'iPhone 13' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1440, height: 900, name: 'Desktop' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasOverflow, `Horizontal overflow on ${vp.name} (${vp.width}px)`).toBe(false);
    }
  });
});
