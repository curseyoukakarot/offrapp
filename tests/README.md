# E2E Tests

## Setup

1. Install Playwright:
```bash
npm install
npx playwright install
```

2. Set test passwords in environment:
```bash
export SUPER_ADMIN_PASSWORD="your-actual-super-admin-password"
export TENANT_ADMIN_PASSWORD="your-actual-tenant-admin-password"  
```

3. Start dev servers:
```bash
npm run dev:all
```

## Running Tests

```bash
# Run all tests
npm test

# Run with browser visible
npm run test:headed

# Run with UI mode
npm run test:ui

# Run specific test
npx playwright test tenant-isolation
```

## Test Coverage

- **Tenant Isolation**: IgniteGTM admin sees zero data
- **Super Admin Routing**: Super admin lands on `/super`
- **View as Tenant**: Super admin can switch to tenant view
- **API Guards**: Cross-tenant API access blocked

## Expected Results

- ✅ IgniteGTM dashboard shows 0 files, 0 forms, 0 users
- ✅ Super admin lands on Mission Control page
- ✅ "View as Tenant" switches to offr.app admin view
- ✅ API returns 403 for unauthorized tenant access
