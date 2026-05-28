// @ts-check
import { test, expect } from '@playwright/test';

/**
 * SmartQR — About Page E2E Tests
 * 
 * Validates the About page content, sections, and tech stack display.
 */

test.describe('About Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
  });

  test('should display the About hero with story badge', async ({ page }) => {
    await expect(page.getByText('Our Story')).toBeVisible();
    await expect(page.getByText(/story behind SmartQR/i)).toBeVisible();
  });

  test('should render The Problem section', async ({ page }) => {
    const problemLabel = page.getByText('The Problem', { exact: true });
    await problemLabel.scrollIntoViewIfNeeded();
    await expect(problemLabel).toBeVisible();

    // Check problem points
    await expect(page.getByText(/expiry date is gone/i)).toBeVisible();
  });

  test('should render Our Solution section with value cards', async ({ page }) => {
    const solutionLabel = page.getByText('Our Solution', { exact: true });
    await solutionLabel.scrollIntoViewIfNeeded();
    await expect(solutionLabel).toBeVisible();

    // Check value cards
    await expect(page.getByText('Safety First')).toBeVisible();
    await expect(page.getByText('Accessibility as a Core Feature')).toBeVisible();
    await expect(page.getByText('Transparency', { exact: true })).toBeVisible();
    await expect(page.getByText('Built for Everyone')).toBeVisible();
  });

  test('should render the tech stack section', async ({ page }) => {
    const techHeading = page.getByText(/Powered by Azure/i);
    await techHeading.scrollIntoViewIfNeeded();
    await expect(techHeading).toBeVisible();

    // Check tech badges
    await expect(page.getByText('Azure Functions')).toBeVisible();
    await expect(page.getByText('Azure Cosmos DB')).toBeVisible();
    await expect(page.getByText('Azure Static Web Apps')).toBeVisible();
    await expect(page.getByText('React', { exact: true })).toBeVisible();
  });

  test('should render CTA section with action links', async ({ page }) => {
    const ctaHeading = page.getByText(/ready to try/i);
    await ctaHeading.scrollIntoViewIfNeeded();
    await expect(ctaHeading).toBeVisible();

    const scanLink = page.getByRole('link', { name: /scan a product/i });
    await expect(scanLink).toBeVisible();
  });
});
