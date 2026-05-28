// @ts-check
import { test, expect } from '@playwright/test';

/**
 * SmartQR — Scanner Page E2E Tests
 * 
 * Validates the scanner page renders correctly with scan and upload options.
 * (Camera tests are limited since Playwright can't grant real camera access)
 */

test.describe('Scanner Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/scan');
  });

  test('should display scanner page heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /scan product/i });
    await expect(heading).toBeVisible();
  });

  test('should display subtitle with instructions', async ({ page }) => {
    await expect(page.getByText(/scan a QR code/i).first()).toBeVisible();
  });

  test('should show "Open Camera" button', async ({ page }) => {
    const cameraBtn = page.getByRole('button', { name: /open camera/i });
    await expect(cameraBtn).toBeVisible();
  });

  test('should show "Upload Image" button', async ({ page }) => {
    const uploadBtn = page.getByRole('button', { name: /upload image/i });
    await expect(uploadBtn).toBeVisible();
  });

  test('should have a hidden file input for gallery upload', async ({ page }) => {
    const fileInput = page.locator('#gallery-upload-input');
    await expect(fileInput).toBeAttached();
    await expect(fileInput).toHaveAttribute('type', 'file');
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  test('should display the QR icon in the ready state', async ({ page }) => {
    const readyHeading = page.getByText(/ready to scan/i);
    await expect(readyHeading).toBeVisible();
  });

  test('should navigate back to landing when clicking logo', async ({ page }) => {
    const logoLink = page.locator('header a[href="/"]').first();
    await logoLink.click();
    await expect(page).toHaveURL('/');
  });
});
