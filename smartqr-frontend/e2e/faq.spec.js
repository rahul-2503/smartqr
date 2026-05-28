// @ts-check
import { test, expect } from '@playwright/test';

/**
 * SmartQR — FAQ Section E2E Tests
 * 
 * Validates the FAQ accordion behavior: expand/collapse,
 * only-one-open-at-a-time, keyboard accessibility, and animations.
 */

test.describe('FAQ Section', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Scroll to FAQ section
    const faqHeading = page.getByText('Frequently asked questions');
    await faqHeading.scrollIntoViewIfNeeded();
    await expect(faqHeading).toBeVisible();
  });

  test('should display the FAQ heading', async ({ page }) => {
    const heading = page.getByText('Frequently asked questions');
    await expect(heading).toBeVisible();
  });

  test('should render all 6 FAQ items', async ({ page }) => {
    const faqButtons = page.locator('[id^="faq-toggle-"]');
    await expect(faqButtons).toHaveCount(6);
  });

  test('should have the first FAQ item expanded by default', async ({ page }) => {
    const firstToggle = page.locator('#faq-toggle-0');
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'true');

    // First answer should be visible
    const firstPanel = page.locator('#faq-panel-0');
    await expect(firstPanel).toBeVisible();
  });

  test('should have other FAQ items collapsed by default', async ({ page }) => {
    for (let i = 1; i <= 5; i++) {
      const toggle = page.locator(`#faq-toggle-${i}`);
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('should expand a collapsed FAQ item when clicked', async ({ page }) => {
    const secondToggle = page.locator('#faq-toggle-1');
    await secondToggle.click();

    // Second item should now be expanded
    await expect(secondToggle).toHaveAttribute('aria-expanded', 'true');

    // Second panel should be visible
    const secondPanel = page.locator('#faq-panel-1');
    await expect(secondPanel).toBeVisible();
  });

  test('should collapse previously open item when another is clicked (accordion behavior)', async ({ page }) => {
    // First item is open by default
    const firstToggle = page.locator('#faq-toggle-0');
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'true');

    // Click second item
    const secondToggle = page.locator('#faq-toggle-1');
    await secondToggle.click();

    // First should close, second should open
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(secondToggle).toHaveAttribute('aria-expanded', 'true');

    // First panel should no longer be visible
    const firstPanel = page.locator('#faq-panel-0');
    await expect(firstPanel).toBeHidden();
  });

  test('should collapse an open item when clicked again', async ({ page }) => {
    const firstToggle = page.locator('#faq-toggle-0');

    // Click to close
    await firstToggle.click();
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'false');

    // No panels should be visible
    const firstPanel = page.locator('#faq-panel-0');
    await expect(firstPanel).toBeHidden();
  });

  test('should display correct FAQ content about SmartQR', async ({ page }) => {
    // Check first FAQ has relevant content
    const firstPanel = page.locator('#faq-panel-0');
    await expect(firstPanel).toContainText(/product transparency/i);
  });

  test('FAQ buttons should be keyboard accessible', async ({ page }) => {
    const firstToggle = page.locator('#faq-toggle-0');
    
    // Focus the first toggle
    await firstToggle.focus();
    await expect(firstToggle).toBeFocused();

    // Press Enter to collapse
    await page.keyboard.press('Enter');
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'false');

    // Press Enter again to expand
    await page.keyboard.press('Enter');
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'true');
  });

  test('should have proper ARIA attributes for accessibility', async ({ page }) => {
    // Each toggle should have aria-expanded and aria-controls
    const firstToggle = page.locator('#faq-toggle-0');
    await expect(firstToggle).toHaveAttribute('aria-expanded');
    await expect(firstToggle).toHaveAttribute('aria-controls', 'faq-panel-0');

    // Each panel should have role="region" and aria-labelledby
    const firstPanel = page.locator('#faq-panel-0');
    await expect(firstPanel).toHaveAttribute('role', 'region');
    await expect(firstPanel).toHaveAttribute('aria-labelledby', 'faq-toggle-0');
  });
});
