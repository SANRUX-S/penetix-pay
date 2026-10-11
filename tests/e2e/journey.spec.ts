import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('PENETIX Pay Launcher and Journeys', () => {
  test('Splash opens full customer app automatically', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('A smarter way to pay.')).toBeVisible();
    await page.waitForURL('**/customer/home', {timeout: 15000});
    await expect(page.locator('h1').first()).toContainText('Hello, Aruni');
    await expect(page.getByText('PENETIX FIND MY DEAL')).toBeVisible();
    await expect(page.getByRole('button', {name: /Workspaces/i})).toBeVisible();
    await page.getByRole('button', {name: /Workspaces/i}).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', {name: /Merchant portal/i}).click();
    await page.waitForURL('**/merchant/overview', {timeout: 15000});
  });

  test('Customer role access and navigation', async ({ page, context }) => {
    await context.addCookies([
      { name: 'demo_role', value: 'customer', url: 'http://127.0.0.1:3000' }
    ]);
    await page.goto('/customer/home');
    await expect(page.locator('h1').first()).toContainText('Hello, Aruni');
    await expect(page.locator('text=PENETIX FIND MY DEAL')).toBeVisible();
    await expect(page.locator('text=MY PAYMENTS')).toBeVisible();
  });

  test('Customer full plan and decision flow', async ({ page, context }) => {
    await context.addCookies([
      { name: 'demo_role', value: 'customer', url: 'http://127.0.0.1:3000' }
    ]);
    await page.goto('/customer/explore');
    await expect(page.locator('h1').first()).toContainText('Find your next thing');
    
    // Click first product card
    await page.locator('.product-card').first().click();
    await page.waitForURL('**/customer/product/**');
    await expect(page.locator('text=Buy with PENETIX Pay')).toBeVisible();

    // Click Buy with PENETIX Pay
    await page.click('text=Buy with PENETIX Pay');
    await page.waitForURL('**/customer/plan/**');
    await expect(page.locator('text=Monthly payment').first()).toBeVisible();
    await expect(page.locator('text=Total repayable').first()).toBeVisible();

    // Continue to checkout
    await page.click('text=Continue to review');
    await page.waitForURL('**/customer/checkout/**');
    await expect(page.getByRole('heading', { name: 'Review your purchase' })).toBeVisible();
    await page.click('text=Continue to confirmation');

    // Consent checkbox
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Submit demo application")');

    // Approval screen
    await expect(page.locator('text=SIMULATED DECISION').first()).toBeVisible({ timeout: 15000 });
  });

  test('Find My Deal 3-step comparison flow', async ({ page, context }) => {
    await context.addCookies([
      { name: 'demo_role', value: 'customer', url: 'http://127.0.0.1:3000' }
    ]);
    await page.goto('/customer/find-my-deal');
    await expect(page.locator('h1').first()).toContainText('Find My Deal');
    
    // Step 1: Select product
    await expect(page.locator('text=Choose a sample product')).toBeVisible();
    await page.click('button:has-text("Set my limit")');

    // Step 2: Set limit & duration
    await expect(page.locator('text=Total cost')).toBeVisible();
    await expect(page.locator('text=Monthly payment')).toBeVisible();
    await page.click('button:has-text("Compare offers")');

    // Step 3: Compare voluntary offers
    await expect(page.locator('text=Where the money goes').first()).toBeVisible();
    await expect(page.locator('text=Choose this sample offer').first()).toBeVisible();
  });

  test('Merchant portal overview and net settlement transparency', async ({ page, context }) => {
    await context.addCookies([
      { name: 'demo_role', value: 'merchant', url: 'http://127.0.0.1:3000' }
    ]);
    await page.goto('/merchant/overview');
    await expect(page.locator('h1').first()).toContainText('A clear view of your business');
    await expect(page.locator('text=Pending net settlement')).toBeVisible();
    await expect(page.locator('text=Settlement transparency')).toBeVisible();
  });

  test('Bank partner workspace, simulator and honest readiness', async ({ page, context }) => {
    await context.addCookies([
      { name: 'demo_role', value: 'bank', url: 'http://127.0.0.1:3000' }
    ]);
    await page.goto('/bank/overview');
    await expect(page.locator('h1').first()).toContainText('Understand the opportunity');
    await expect(page.locator('text=Pre-launch · zero confirmed live users')).toBeVisible();

    // Navigate to simulator
    await page.goto('/bank/simulator');
    await expect(page.locator('h1').first()).toContainText('See what changes the result');
    await expect(page.locator('text=Contribution waterfall')).toBeVisible();

    // Navigate to readiness
    await page.goto('/bank/readiness');
    await expect(page.locator('h1').first()).toContainText('Start with the honest answers');
    await expect(page.locator('text=How many customers does PENETIX Pay have?')).toBeVisible();
    await expect(page.locator('text=Pre-launch; zero confirmed live users')).toBeVisible();
  });

  test('Access denied without proper role cookie', async ({ page }) => {
    // No cookie set
    await page.goto('/customer/home');
    await expect(page.locator('h1').first()).toContainText('Choose the right workspace');
    await expect(page.locator('text=This demo role cannot open this workspace')).toBeVisible();
  });

  test('Accessibility audit on launcher page', async ({ page }) => {
    await page.goto('/');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast']) // Color contrast verified via contrast-check.ts
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
