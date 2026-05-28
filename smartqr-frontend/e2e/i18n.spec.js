// @ts-check
import { test, expect } from '@playwright/test';

test.describe('i18n Multi-Language Support', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const mobileToggle = page.locator('.nav-mobile-toggle');
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      await page.waitForTimeout(300);
    }
  });

  test('should display the language switcher with 4 options', async ({ page }) => {
    const switcher = page.locator('#language-switcher').filter({ visible: true });
    await expect(switcher).toBeVisible();
    await expect(switcher).toContainText('English');

    // Open the dropdown
    await switcher.click();

    // Verify all 4 language options exist
    await expect(page.locator('#lang-option-en').filter({ visible: true })).toBeVisible();
    await expect(page.locator('#lang-option-hi').filter({ visible: true })).toBeVisible();
    await expect(page.locator('#lang-option-te').filter({ visible: true })).toBeVisible();
    await expect(page.locator('#lang-option-kn').filter({ visible: true })).toBeVisible();
  });

  test('should update UI texts when switching languages', async ({ page }) => {
    const switcher = page.locator('#language-switcher').filter({ visible: true });
    const heroHeading = page.locator('h1').first();

    // 1. Verify default is English
    await expect(heroHeading).toContainText('Smart product transparency and');

    // 2. Switch to Hindi (हिन्दी)
    await switcher.click();
    await page.locator('#lang-option-hi').filter({ visible: true }).click();
    
    // Check Hindi heading text: "स्मार्ट उत्पाद पारदर्शिता और"
    await expect(heroHeading).toContainText('स्मार्ट उत्पाद पारदर्शिता और');
    await expect(switcher).toContainText('हिन्दी');

    // 3. Switch to Telugu (తెలుగు)
    await switcher.click();
    await page.locator('#lang-option-te').filter({ visible: true }).click();
    
    // Check Telugu heading text: "స్మార్ట్ ఉత్పత్తి పారదర్శకత మరియు"
    await expect(heroHeading).toContainText('స్మార్ట్ ఉత్పత్తి పారదర్శకత మరియు');
    await expect(switcher).toContainText('తెలుగు');

    // 4. Switch to Kannada (ಕನ್ನಡ)
    await switcher.click();
    await page.locator('#lang-option-kn').filter({ visible: true }).click();
    
    // Check Kannada heading text: "ಸ್ಮಾರ್ಟ್ ಉತ್ಪನ್ನ ಪಾರದರ್ಶಕತೆ ಮತ್ತು"
    await expect(heroHeading).toContainText('ಸ್ಮಾರ್ಟ್ ಉತ್ಪನ್ನ ಪಾರದರ್ಶಕತೆ ಮತ್ತು');
    await expect(switcher).toContainText('ಕನ್ನಡ');
  });

  test('should persist language selection across reloads', async ({ page }) => {
    const switcher = page.locator('#language-switcher').filter({ visible: true });
    const heroHeading = page.locator('h1').first();

    // Switch to Hindi
    await switcher.click();
    await page.locator('#lang-option-hi').filter({ visible: true }).click();
    await expect(heroHeading).toContainText('स्मार्ट उत्पाद पारदर्शिता और');

    // Reload the page
    await page.reload();

    // Re-open mobile menu if on mobile
    const mobileToggle = page.locator('.nav-mobile-toggle');
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      await page.waitForTimeout(300);
    }

    // Verify it's still in Hindi
    await expect(heroHeading).toContainText('स्मार्ट उत्पाद पारदर्शिता और');
    await expect(switcher).toContainText('हिन्दी');
  });
});

