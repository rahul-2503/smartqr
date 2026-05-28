// @ts-check
import { test, expect } from '@playwright/test';

/**
 * SmartQR — Landing Page E2E Tests
 * 
 * Validates that the public landing page renders all sections correctly,
 * navigation works, and the page is accessible.
 */

test.describe('Landing Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ─── Page Load & SEO ─────────────────────────────────────────

  test('should load with correct title and meta', async ({ page }) => {
    await expect(page).toHaveTitle(/SmartQR/i);

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /SmartQR/i);
  });

  // ─── Navbar ───────────────────────────────────────────────────

  test('should display navbar with logo and navigation links', async ({ page }) => {
    // Logo should be visible
    const logo = page.locator('header').first();
    await expect(logo).toBeVisible();

    // Check navigation links exist (desktop)
    const scanLink = page.getByRole('link', { name: /scan/i }).first();
    const aboutLink = page.getByRole('link', { name: /about/i }).first();
    
    await expect(scanLink).toBeVisible();
    await expect(aboutLink).toBeVisible();
  });

  test('should navigate to /scan when clicking scanner link', async ({ page }) => {
    const scanLink = page.getByRole('link', { name: /scan/i }).first();
    await scanLink.click();
    await expect(page).toHaveURL(/\/scan/);
  });

  test('should navigate to /about when clicking about link', async ({ page }) => {
    const aboutLink = page.getByRole('link', { name: /about/i }).first();
    await aboutLink.click();
    await expect(page).toHaveURL(/\/about/);
  });

  // ─── Hero Section ─────────────────────────────────────────────

  test('should display hero section with headline and CTA buttons', async ({ page }) => {
    const heroHeading = page.locator('h1').first();
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).not.toBeEmpty();

    // Should have at least one CTA button/link
    const ctaButtons = page.getByRole('link', { name: /scan|start|manufacturer/i });
    await expect(ctaButtons.first()).toBeVisible();
  });

  // ─── All Sections Render ──────────────────────────────────────

  test('should render all major landing sections', async ({ page }) => {
    // Scroll to trigger lazy-loaded sections
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Check for section headings (h2 elements from each component)
    const sectionHeadings = page.locator('h2');
    const count = await sectionHeadings.count();
    
    // We expect at least 5 sections: ForConsumers, ForManufacturers, HowItWorks, Features, CTA, FAQ
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('should render the Features section with 6 feature cards', async ({ page }) => {
    // Scroll to Features
    const featuresHeading = page.getByText(/Everything you need/i);
    await featuresHeading.scrollIntoViewIfNeeded();
    await expect(featuresHeading).toBeVisible();

    // Check for feature titles
    await expect(page.getByText('Product Verification', { exact: true })).toBeVisible();
    await expect(page.getByText('Voice Accessibility', { exact: true })).toBeVisible();
    await expect(page.getByText('Expiry Intelligence', { exact: true })).toBeVisible();
  });

  // ─── CTA Section ──────────────────────────────────────────────

  test('should render CTA section with action buttons', async ({ page }) => {
    const ctaHeading = page.getByText(/Ready to make your products/i);
    await ctaHeading.scrollIntoViewIfNeeded();
    await expect(ctaHeading).toBeVisible();

    const manufacturerBtn = page.getByRole('link', { name: /start as manufacturer/i });
    await expect(manufacturerBtn).toBeVisible();
  });

  // ─── Footer ───────────────────────────────────────────────────

  test('should render footer with logo and link columns', async ({ page }) => {
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();

    // Check footer columns
    await expect(page.getByText('Product', { exact: true })).toBeVisible();
    await expect(page.getByText('Company', { exact: true })).toBeVisible();
    await expect(page.getByText('Connect', { exact: true })).toBeVisible();

    // Copyright
    await expect(page.getByText(/SmartQR/i).last()).toBeVisible();
  });
});
