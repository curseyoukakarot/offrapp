// Test setup and utilities for Playwright tests

export const TEST_USERS = {
  SUPER_ADMIN: {
    email: 'brandon@offr.ai',
    password: process.env.SUPER_ADMIN_PASSWORD || 'UpdateThisPassword123!',
  },
  TENANT_ADMIN: {
    email: 'brandon@ignitegtm.com', 
    password: process.env.TENANT_ADMIN_PASSWORD || 'UpdateThisPassword123!',
  }
};

export const TEST_TENANTS = {
  OFFR_APP: '8fd7f491-f7bf-4b8d-9b15-235b0bb0671e',
  IGNITE_GTM: '7b7af77b-17c3-4522-9d9a-11581e3f9568',
};

/**
 * Login helper that handles the auth flow and waits for redirect
 */
export async function loginAs(page, userType) {
  const user = TEST_USERS[userType];
  if (!user) throw new Error(`Unknown user type: ${userType}`);
  
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to complete
  await page.waitForTimeout(3000);
}

/**
 * Get auth token from the current page session
 */
export async function getAuthToken(page) {
  return await page.evaluate(async () => {
    const { supabase } = await import('/src/supabaseClient.js');
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  });
}

/**
 * Wait for dashboard data to load
 */
export async function waitForDashboardLoad(page) {
  // Wait for loading states to disappear
  await page.waitForFunction(() => {
    const loadingElements = document.querySelectorAll('text=Loading');
    return loadingElements.length === 0;
  }, { timeout: 10000 });
  
  // Additional wait for API calls
  await page.waitForTimeout(2000);
}
