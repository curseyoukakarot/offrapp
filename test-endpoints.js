#!/usr/bin/env node

/**
 * Test script to verify tenant isolation and API endpoint behavior
 * Run with: node test-endpoints.js
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3001';

// Test data - replace with actual tenant IDs and JWT tokens from your setup
const SUPER_ADMIN_TOKEN = process.env.SUPER_ADMIN_JWT || 'your-super-admin-jwt-here';
const TENANT_ADMIN_TOKEN = process.env.TENANT_ADMIN_JWT || 'your-tenant-admin-jwt-here';
const OFFR_TENANT_ID = process.env.OFFR_TENANT_ID || 'your-offr-tenant-id';
const IGNITE_TENANT_ID = process.env.IGNITE_TENANT_ID || 'your-ignite-tenant-id';

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 500));
    
    return { status: response.status, data };
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    return { error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting API endpoint tests...');
  console.log(`API Base: ${API_BASE}`);
  
  // Test 1: Super admin endpoints
  console.log('\n=== SUPER ADMIN TESTS ===');
  
  await testEndpoint(
    'Super admin - List tenants',
    `${API_BASE}/api/super/tenants`,
    {
      headers: {
        'Authorization': `Bearer ${SUPER_ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  await testEndpoint(
    'Super admin - Get tenant users (offr.app)',
    `${API_BASE}/api/super/tenant-users?id=${OFFR_TENANT_ID}`,
    {
      headers: {
        'Authorization': `Bearer ${SUPER_ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  // Test 2: Tenant-scoped endpoints WITH tenant header
  console.log('\n=== TENANT ADMIN TESTS (WITH TENANT HEADER) ===');
  
  await testEndpoint(
    'Tenant admin - Get forms (with tenant header)',
    `${API_BASE}/api/forms?limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${TENANT_ADMIN_TOKEN}`,
        'x-tenant-id': OFFR_TENANT_ID,
        'Content-Type': 'application/json'
      }
    }
  );
  
  await testEndpoint(
    'Tenant admin - Get files (with tenant header)',
    `${API_BASE}/api/files?limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${TENANT_ADMIN_TOKEN}`,
        'x-tenant-id': OFFR_TENANT_ID,
        'Content-Type': 'application/json'
      }
    }
  );
  
  await testEndpoint(
    'Tenant admin - Get tenant users',
    `${API_BASE}/api/files/tenant-users`,
    {
      headers: {
        'Authorization': `Bearer ${TENANT_ADMIN_TOKEN}`,
        'x-tenant-id': OFFR_TENANT_ID,
        'Content-Type': 'application/json'
      }
    }
  );
  
  // Test 3: Tenant-scoped endpoints WITHOUT tenant header (should fail/return empty)
  console.log('\n=== TENANT ADMIN TESTS (WITHOUT TENANT HEADER) ===');
  
  await testEndpoint(
    'Tenant admin - Get forms (no tenant header)',
    `${API_BASE}/api/forms?limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${TENANT_ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  await testEndpoint(
    'Tenant admin - Get files (no tenant header)',
    `${API_BASE}/api/files?limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${TENANT_ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  // Test 4: Cross-tenant access attempt
  console.log('\n=== CROSS-TENANT ACCESS TESTS ===');
  
  await testEndpoint(
    'Tenant admin - Try to access different tenant data',
    `${API_BASE}/api/forms?limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${TENANT_ADMIN_TOKEN}`,
        'x-tenant-id': IGNITE_TENANT_ID, // Different tenant
        'Content-Type': 'application/json'
      }
    }
  );
  
  // Test 5: Unauthenticated requests
  console.log('\n=== UNAUTHENTICATED TESTS ===');
  
  await testEndpoint(
    'No auth - Get forms',
    `${API_BASE}/api/forms?limit=10`
  );
  
  await testEndpoint(
    'No auth - Super admin endpoint',
    `${API_BASE}/api/super/tenants`
  );
  
  // Test 6: Health checks
  console.log('\n=== HEALTH CHECKS ===');
  
  await testEndpoint(
    'Health check',
    `${API_BASE}/api/health`
  );
  
  await testEndpoint(
    'Ping check',
    `${API_BASE}/api/ping`
  );
  
  console.log('\n✅ Tests completed!');
  console.log('\nExpected results:');
  console.log('- Super admin endpoints: 200 with data');
  console.log('- Tenant endpoints with header: 200 with scoped data');
  console.log('- Tenant endpoints without header: empty arrays or 403');
  console.log('- Cross-tenant access: 403 or empty');
  console.log('- No auth: 401 unauthorized');
  console.log('- Health checks: 200');
}

// Instructions for setup
if (!process.env.SUPER_ADMIN_JWT) {
  console.log('⚠️  Setup required:');
  console.log('1. Set environment variables:');
  console.log('   export SUPER_ADMIN_JWT="your-super-admin-jwt"');
  console.log('   export TENANT_ADMIN_JWT="your-tenant-admin-jwt"');
  console.log('   export OFFR_TENANT_ID="your-offr-tenant-id"');
  console.log('   export IGNITE_TENANT_ID="your-ignite-tenant-id"');
  console.log('2. Start your API server: npm run dev:api');
  console.log('3. Run: node test-endpoints.js\n');
}

runTests().catch(console.error);
