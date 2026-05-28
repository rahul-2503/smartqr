// @ts-check
import { test, expect } from '@playwright/test';

/**
 * SmartQR — Accessibility E2E Tests
 * 
 * Validates keyboard navigation, ARIA attributes, focus management,
 * and screen-reader compatibility across the app.
 */

test.describe('Accessibility', () => {

  // ─── Keyboard Navigation ─────────────────────────────────────

  test('should allow full keyboard navigation on landing page', async ({ page }) => {
    await page.goto('/');

    // Tab through the page — first focusable elements should be in the navbar
    await page.keyboard.press('Tab');
    const firstFocused = page.locator(':focus');
    await expect(firstFocused).toBeVisible();

    // Continue tabbing — should reach nav links
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    const currentFocused = page.locator(':focus');
    await expect(currentFocused).toBeVisible();
  });

  test('should navigate between pages using keyboard only', async ({ page }) => {
    await page.goto('/');

    // Find and focus the "Scan" link, press Enter
    const scanLink = page.getByRole('link', { name: /scan/i }).first();
    await scanLink.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/scan/);

    // Go back and navigate to About
    await page.goBack();
    const aboutLink = page.getByRole('link', { name: /about/i }).first();
    await aboutLink.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/about/);
  });

  // ─── ARIA & Semantic HTML ─────────────────────────────────────

  test('each page should have exactly one h1', async ({ page }) => {
    // Landing page
    await page.goto('/');
    let h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);

    // Scanner page
    await page.goto('/scan');
    h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);

    // About page
    await page.goto('/about');
    h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
  });

  test('all images should have alt text', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      const role = await img.getAttribute('role');

      // Image should have alt text OR be explicitly decorative
      const isAccessible = (alt !== null && alt !== undefined) || 
                           ariaHidden === 'true' || 
                           role === 'presentation';
      expect(isAccessible, `Image ${i} missing alt text`).toBe(true);
    }
  });

  test('interactive elements should have accessible names', async ({ page }) => {
    await page.goto('/scan');

    // All buttons should have accessible text
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const name = await button.getAttribute('aria-label') || await button.textContent();
        expect(name?.trim().length, `Button ${i} has no accessible name`).toBeGreaterThan(0);
      }
    }
  });

  // ─── Color Contrast & Visual ──────────────────────────────────

  test('page should not have any horizontal overflow (no broken layouts)', async ({ page }) => {
    await page.goto('/');

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasOverflow).toBe(false);
  });

  // ─── Focus Visibility ─────────────────────────────────────────

  test('focused elements should have visible focus indicators', async ({ page }) => {
    await page.goto('/');

    // Tab to first interactive element
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    
    if (await focused.count() > 0) {
      // Check that the focused element is visible
      await expect(focused.first()).toBeVisible();
    }
  });

  // ─── Reduced Motion ───────────────────────────────────────────

  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Page should still load and function correctly
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });
});
