// @ts-check
import { test, expect } from '@playwright/test';

/**
 * SmartQR — Manufacturer Workspace E2E Tests
 * 
 * Validates the manufacturer portal registration, dashboard, 
 * product catalog, and batch management.
 */

test.describe('Manufacturer Workspace', () => {

  test('should register a new organization, create product, and create batch', async ({ page }) => {
    // Generate a unique business email and company name
    const uniqueId = Date.now();
    const testEmail = `admin@testcorp-${uniqueId}.com`;
    const testPassword = `TestPassword123!`;
    const testCompany = `Test Corp ${uniqueId}`;

    // 1. Navigate to Registration page
    await page.goto('/manufacturer/register');
    await expect(page.locator('h1')).toContainText('Create Workspace');

    // Fill Step 1
    await page.locator('#register-email').fill(testEmail);
    await page.locator('#register-password').fill(testPassword);
    await page.locator('button[type="submit"]').click();

    // Verify Step 2 loads
    await expect(page.locator('h1')).toContainText('Organization Setup');

    // Fill Step 2
    await page.locator('#register-company').fill(testCompany);
    await page.locator('#register-contact').fill('Test Administrator');
    await page.locator('input[placeholder="e.g. DL-12345"]').fill(`DL-${uniqueId.toString().slice(-5)}`);
    await page.locator('input[placeholder="e.g. 27GSTIN..."]').fill('27AAACT1234A1Z1');
    await page.locator('input[placeholder="Facility location"]').fill('123 Test Industrial Area, Mumbai');
    await page.locator('select.mfr-auth-input').selectOption({ label: 'Maharashtra' });
    await page.locator('input[placeholder="Workspace phone number"]').fill('9876543210');

    // Submit registration
    await page.locator('#register-submit').click();

    // Verify redirection to dashboard
    await expect(page).toHaveURL(/\/manufacturer\/dashboard/);
    await expect(page.locator('h1')).toContainText(`Welcome back, ${testCompany}`);

    // Helper to open sidebar on mobile viewports
    const openSidebarIfMobile = async () => {
      const mobileToggle = page.locator('.mfr-mobile-toggle-btn');
      if (await mobileToggle.isVisible()) {
        await mobileToggle.click();
        await page.waitForTimeout(500); // Wait for sidebar animation
      }
    };

    // 2. Navigate to Products Page
    await openSidebarIfMobile();
    const productsLink = page.getByRole('link', { name: /Products/i }).first();
    await productsLink.click();
    await expect(page).toHaveURL(/\/manufacturer\/products/);
    await expect(page.locator('h1')).toContainText(/Product Catalog/i);

    // 3. Register a new product
    await page.locator('#add-product-btn').click();
    
    // Fill the drawer form
    const sampleProduct = `TestMed-${uniqueId}`;
    await page.locator('input[placeholder="e.g. Paracetamol 500mg"]').fill(sampleProduct);
    await page.locator('input[placeholder="e.g. Acetaminophen"]').fill('Test Substance');
    await page.locator('input[placeholder="e.g. 500mg or 10ml"]').fill('250mg');
    await page.locator('input[placeholder="Active ingredients and percentages"]').fill('Test Component 100%');
    await page.locator('input[placeholder*="Store below"]').fill('Store at room temperature');
    await page.locator('input[placeholder*="1 tablet twice daily"]').fill('Take 1 capsule daily');
    
    // Save Product
    await page.locator('#submit-product').click();

    // Verify success alert message and product is listed in table
    await expect(page.locator('.mfr-alert-success')).toBeVisible();
    await expect(page.locator('.mfr-alert-success')).toContainText(/registered successfully/i);
    await expect(page.locator('table.mfr-table').getByText(sampleProduct)).toBeVisible();

    // 4. Navigate to Batches Page
    await openSidebarIfMobile();
    const batchesLink = page.getByRole('link', { name: /Batches/i }).first();
    await batchesLink.click();
    await expect(page).toHaveURL(/\/manufacturer\/batches/);
    await expect(page.locator('h1')).toContainText(/Batch Ledger/i);

    // 5. Register a new batch
    await page.locator('#add-batch-btn').click();

    // Select the product we just created
    await page.locator('select.mfr-select').first().selectOption({ label: `${sampleProduct} (250mg)` });
    
    // Fill in batch details
    const sampleBatchNo = `BT-${uniqueId.toString().slice(-6)}`;
    await page.locator('input[placeholder="e.g. BT-2026-05"]').fill(sampleBatchNo);
    await page.locator('input[placeholder="e.g. 150.00"]').fill('99.99');
    
    // Fill dates (today and next year)
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const expDate = nextYear.toISOString().split('T')[0];
    
    await page.locator('input[type="date"]').first().fill(today);
    await page.locator('input[type="date"]').last().fill(expDate);

    // Total strips
    await page.locator('input[placeholder="e.g. 100"]').fill('10');

    // Submit batch
    await page.locator('#submit-batch').click();

    // Verify batch is listed in table
    await expect(page.locator('.mfr-alert-success')).toBeVisible();
    await expect(page.locator('.mfr-alert-success')).toContainText(/registered successfully/i);
    await expect(page.locator('table.mfr-table').getByText(sampleBatchNo)).toBeVisible();
  });
});
