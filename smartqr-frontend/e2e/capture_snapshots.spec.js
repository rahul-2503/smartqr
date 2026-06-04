import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\\.gemini\\antigravity-ide\\brain\\f0c976e8-3e8d-44e4-8f39-fea659b097aa';

test.describe('Capture Complete SmartQR Feature Snapshots', () => {

  test('should navigate every single feature and capture screenshots', async ({ page }) => {
    // Set a consistent large viewport size for premium desktop screenshots
    await page.setViewportSize({ width: 1280, height: 800 });

    // ══════════════════════════════════════════════════════════════
    // PART 1: CONSUMER PORTAL
    // ══════════════════════════════════════════════════════════════

    // 1. Landing Page
    console.log("Capturing Consumer Landing page...");
    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'consumer_1_landing.png') });

    // 2. About Page
    console.log("Capturing Consumer About page...");
    await page.goto('/about');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'consumer_2_about.png') });

    // 3. Scanner Ready State
    console.log("Capturing Consumer Scanner Ready state...");
    await page.goto('/scan');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'consumer_3_scanner_ready.png') });

    // 4. Product Verification Success (Batch '01')
    console.log("Capturing Consumer Scanner Details...");
    await page.goto('/scan/01');
    await page.waitForSelector('h1', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText(/paracetamol|vicks/i);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'consumer_4_scanner_details.png') });

    // 5. AI Drug Interaction Checker (Paracetamol + Aspirin)
    console.log("Capturing AI Drug Interaction Checker...");
    await page.locator('#drug-interaction-input').fill('Aspirin');
    await page.locator('#check-interaction-btn').click();
    await page.waitForSelector('text=consult your doctor', { timeout: 25000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'consumer_5_drug_interactions.png') });


    // ══════════════════════════════════════════════════════════════
    // PART 2: MANUFACTURER PORTAL (AUTH GATE)
    // ══════════════════════════════════════════════════════════════

    // 6. Manufacturer Login Page
    console.log("Capturing Manufacturer Login page...");
    await page.goto('/manufacturer/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'manufacturer_1_login.png') });

    // 7. Manufacturer Register Step 1
    console.log("Capturing Manufacturer Register Step 1...");
    await page.goto('/manufacturer/register');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'manufacturer_2_register_step1.png') });

    // Fill Step 1 to load Step 2
    const uniqueId = Date.now();
    const testEmail = `admin-${uniqueId}@zandu.com`;
    const testPassword = `ZanduPassword123!`;
    await page.locator('#register-email').fill(testEmail);
    await page.locator('#register-password').fill(testPassword);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1')).toContainText('Organization Setup');

    // 8. Manufacturer Register Step 2
    console.log("Capturing Manufacturer Register Step 2...");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'manufacturer_2_register_step2.png') });

    // Complete registration
    await page.locator('#register-company').fill('zandu');
    await page.locator('#register-contact').fill('Zandu Administrator');
    await page.locator('input[placeholder="e.g. DL-12345"]').fill('DL-99999');
    await page.locator('input[placeholder="e.g. 27GSTIN..."]').fill('27AAACT1234A1Z1');
    await page.locator('input[placeholder="Facility location"]').fill('Zandu Corporate Office, Mumbai');
    await page.locator('select.mfr-auth-input').selectOption({ label: 'Maharashtra' });
    await page.locator('input[placeholder="Workspace phone number"]').fill('9876543210');
    await page.locator('#register-submit').click();

    // ══════════════════════════════════════════════════════════════
    // PART 3: MANUFACTURER PORTAL (DASHBOARD & OPERATIONS)
    // ══════════════════════════════════════════════════════════════

    // Wait to land on dashboard
    await expect(page).toHaveURL(/\/manufacturer\/dashboard/, { timeout: 20000 });
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(3000); // Allow Chart.js charts to draw

    // 9. Dashboard Overview
    console.log("Capturing Manufacturer Dashboard...");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'manufacturer_3_dashboard.png') });

    // 10. AI Risk Assessment Modal
    console.log("Capturing AI Risk Assessment modal...");
    await page.locator('#risk-assessment-btn').click();
    await page.waitForSelector('text=Compliance:', { timeout: 25000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'manufacturer_4_dashboard_ai_risk.png') });
    await page.locator('button:has-text("✕")').click(); // Close modal
    await page.waitForTimeout(500);

    // 11. AI Intelligence Briefing Panel
    console.log("Capturing AI Insights panel...");
    await page.locator('#ai-insights-btn').click();
    await page.waitForSelector('text=Analyzing...', { state: 'detached', timeout: 25000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'manufacturer_5_dashboard_ai_insights.png') });

    // 12. Products Catalog Page
    console.log("Capturing Products Catalog...");
    await page.goto('/manufacturer/products');
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'manufacturer_6_products_catalog.png') });

    // 13. Add Product Drawer
    console.log("Capturing Add Product Drawer...");
    await page.locator('#add-product-btn').click();
    await page.waitForTimeout(1000); // Wait for sliding animation
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'manufacturer_7_add_product_drawer.png') });
    await page.locator('button:has-text("Cancel")').first().click(); // Close drawer
    await page.waitForTimeout(500);

    // 14. Batches Ledger Page
    console.log("Capturing Batches Ledger...");
    await page.goto('/manufacturer/batches');
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'manufacturer_8_batches_ledger.png') });

    // 15. Add Batch Drawer
    console.log("Capturing Add Batch Drawer...");
    await page.locator('#add-batch-btn').click();
    await page.waitForTimeout(1000); // Wait for sliding animation
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'manufacturer_9_add_batch_drawer.png') });
    await page.locator('button:has-text("Cancel")').first().click(); // Close drawer
    await page.waitForTimeout(500);

    // 16. QR Center Page (Ready state)
    console.log("Capturing QR Center (Select Product)...");
    await page.goto('/manufacturer/qr-center');
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'manufacturer_10_qr_center.png') });

    // 17. QR Center Page (Blister sheet layout preview)
    console.log("Capturing Blister Sheet QR Layout...");
    // Select Product and Batch from dropdowns
    await page.locator('select.mfr-select').first().selectOption({ index: 1 });
    await page.waitForTimeout(1000);
    await page.locator('select.mfr-select').last().selectOption({ index: 1 });
    await page.waitForTimeout(2000); // Let the A4 sheet grid draw QR codes
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'manufacturer_11_qr_center_preview.png') });

    console.log("All complete complete feature screenshots generated successfully!");
  });
});
