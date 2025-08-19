import { test, expect } from '@playwright/test';

// Test credentials from previous setup
const SUPER_ADMIN_EMAIL = 'brandon@offr.ai';
const SUPER_ADMIN_PASSWORD = 'your-super-admin-password'; // Replace with actual
const TENANT_ADMIN_EMAIL = 'brandon@ignitegtm.com';
const TENANT_ADMIN_PASSWORD = 'your-tenant-admin-password'; // Replace with actual
const OFFR_TENANT_ID = '8fd7f491-f7bf-4b8d-9b15-235b0bb0671e';

test.describe('Tenant Isolation & Super Admin Flow', () => {
  
  test('Tenant admin sees empty dashboard (IgniteGTM)', async ({ page }) => {
    // Login as IgniteGTM tenant admin
    await page.goto('/login');
    await page.fill('input[type="email"]', TENANT_ADMIN_EMAIL);
    await page.fill('input[type="password"]', TENANT_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/dashboard\/admin/);
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check stats cards show zero
    await expect(page.locator('text=Total Clients').locator('..').locator('text=0')).toBeVisible();
    await expect(page.locator('text=Total Forms').locator('..').locator('text=0')).toBeVisible();
    await expect(page.locator('text=Files Uploaded').locator('..').locator('text=0')).toBeVisible();
    
    // Check empty states are shown
    await expect(page.locator('text=No files yet')).toBeVisible();
    await expect(page.locator('text=No users yet')).toBeVisible();
    
    // Navigate to Files page
    await page.click('text=File Upload');
    await expect(page.locator('text=No files have been added yet')).toBeVisible();
    
    // Navigate to Forms page
    await page.click('text=Forms');
    await expect(page.locator('text=No forms yet')).toBeVisible();
  });

  test('Super admin lands on /super portal', async ({ page }) => {
    // Login as super admin
    await page.goto('/login');
    await page.fill('input[type="email"]', SUPER_ADMIN_EMAIL);
    await page.fill('input[type="password"]', SUPER_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Should redirect to super admin portal
    await expect(page).toHaveURL('/super');
    
    // Check super admin elements
    await expect(page.locator('text=Mission Control')).toBeVisible();
    await expect(page.locator('text=Quick Tenant Access')).toBeVisible();
    
    // Check tenant cards are present
    await expect(page.locator('text=offr.app')).toBeVisible();
    await expect(page.locator('text=IgniteGTM')).toBeVisible();
    
    // Check "View as Tenant" buttons
    await expect(page.locator('button:has-text("View as Tenant")')).toHaveCount(2);
  });

  test('View as Tenant from super portal', async ({ page }) => {
    // Start from super admin portal
    await page.goto('/login');
    await page.fill('input[type="email"]', SUPER_ADMIN_EMAIL);
    await page.fill('input[type="password"]', SUPER_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/super');
    
    // Click "View as Tenant" for offr.app
    await page.locator('text=offr.app').locator('..').locator('button:has-text("View as Tenant")').click();
    
    // Should redirect to admin dashboard with tenant context
    await expect(page).toHaveURL(/\/dashboard\/admin\?tenant_id=/);
    
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Check we see offr.app data (should have files/users)
    const totalClientsCard = page.locator('text=Total Clients').locator('..');
    await expect(totalClientsCard.locator('text=0')).not.toBeVisible({ timeout: 5000 });
    
    // Check scope header shows tenant viewing mode
    await expect(page.locator('text=Viewing:')).toBeVisible();
    await expect(page.locator('button:has-text("Super Admin")')).toBeVisible();
    
    // Navigate to Files page and verify we see offr.app files
    await page.click('text=File Upload');
    await expect(page.locator('text=Marc Rose')).toBeVisible(); // Should see offr.app files
    
    // Switch back to Super Admin
    await page.click('button:has-text("Super Admin")');
    await expect(page).toHaveURL('/super');
  });

  test('API guard blocks unauthorized tenant access', async ({ page, request }) => {
    // Login as IgniteGTM admin to get token
    await page.goto('/login');
    await page.fill('input[type="email"]', TENANT_ADMIN_EMAIL);
    await page.fill('input[type="password"]', TENANT_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for auth
    await page.waitForTimeout(2000);
    
    // Get auth token from page context
    const token = await page.evaluate(async () => {
      const { supabase } = await import('/src/supabaseClient.js');
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token;
    });
    
    if (!token) {
      throw new Error('Could not get auth token from page');
    }
    
    // Test API call without tenant header (should return empty)
    const noHeaderResponse = await request.get('http://localhost:3001/api/files?limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    expect(noHeaderResponse.status()).toBe(200);
    const noHeaderData = await noHeaderResponse.json();
    expect(noHeaderData.files).toEqual([]);
    
    // Test API call with wrong tenant header (should return 403)
    const wrongTenantResponse = await request.get('http://localhost:3001/api/files?limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': OFFR_TENANT_ID, // IgniteGTM admin trying to access offr.app
        'Content-Type': 'application/json'
      }
    });
    
    expect(wrongTenantResponse.status()).toBe(403);
    const wrongTenantData = await wrongTenantResponse.json();
    expect(wrongTenantData.error).toContain('not a member of this tenant');
  });

});
