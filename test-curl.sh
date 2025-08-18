#!/bin/bash

# Test script using curl to verify tenant isolation
# Usage: ./test-curl.sh

API_BASE=${API_BASE:-"http://localhost:3001"}
SUPER_ADMIN_JWT=${SUPER_ADMIN_JWT:-"your-super-admin-jwt-here"}
TENANT_ADMIN_JWT=${TENANT_ADMIN_JWT:-"your-tenant-admin-jwt-here"}
OFFR_TENANT_ID=${OFFR_TENANT_ID:-"your-offr-tenant-id"}
IGNITE_TENANT_ID=${IGNITE_TENANT_ID:-"your-ignite-tenant-id"}

echo "🚀 Starting curl-based API tests..."
echo "API Base: $API_BASE"
echo ""

# Test 1: Super admin endpoints
echo "=== SUPER ADMIN TESTS ==="
echo ""

echo "🧪 Super admin - List tenants"
curl -s -w "\nStatus: %{http_code}\n" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  "$API_BASE/api/super/tenants" | jq -r '.' 2>/dev/null || cat
echo ""

echo "🧪 Super admin - Get tenant users (offr.app)"
curl -s -w "\nStatus: %{http_code}\n" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  "$API_BASE/api/super/tenant-users?id=$OFFR_TENANT_ID" | jq -r '.' 2>/dev/null || cat
echo ""

# Test 2: Tenant-scoped WITH header
echo "=== TENANT ADMIN TESTS (WITH TENANT HEADER) ==="
echo ""

echo "🧪 Tenant admin - Get forms (with tenant header)"
curl -s -w "\nStatus: %{http_code}\n" \
  -H "Authorization: Bearer $TENANT_ADMIN_JWT" \
  -H "x-tenant-id: $OFFR_TENANT_ID" \
  -H "Content-Type: application/json" \
  "$API_BASE/api/forms?limit=5" | jq -r '.' 2>/dev/null || cat
echo ""

echo "🧪 Tenant admin - Get files (with tenant header)"
curl -s -w "\nStatus: %{http_code}\n" \
  -H "Authorization: Bearer $TENANT_ADMIN_JWT" \
  -H "x-tenant-id: $OFFR_TENANT_ID" \
  -H "Content-Type: application/json" \
  "$API_BASE/api/files?limit=5" | jq -r '.' 2>/dev/null || cat
echo ""

# Test 3: Tenant-scoped WITHOUT header
echo "=== TENANT ADMIN TESTS (WITHOUT TENANT HEADER) ==="
echo ""

echo "🧪 Tenant admin - Get forms (no tenant header)"
curl -s -w "\nStatus: %{http_code}\n" \
  -H "Authorization: Bearer $TENANT_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  "$API_BASE/api/forms?limit=5" | jq -r '.' 2>/dev/null || cat
echo ""

echo "🧪 Tenant admin - Get files (no tenant header)"
curl -s -w "\nStatus: %{http_code}\n" \
  -H "Authorization: Bearer $TENANT_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  "$API_BASE/api/files?limit=5" | jq -r '.' 2>/dev/null || cat
echo ""

# Test 4: Cross-tenant access
echo "=== CROSS-TENANT ACCESS TESTS ==="
echo ""

echo "🧪 Tenant admin - Try to access different tenant data"
curl -s -w "\nStatus: %{http_code}\n" \
  -H "Authorization: Bearer $TENANT_ADMIN_JWT" \
  -H "x-tenant-id: $IGNITE_TENANT_ID" \
  -H "Content-Type: application/json" \
  "$API_BASE/api/forms?limit=5" | jq -r '.' 2>/dev/null || cat
echo ""

# Test 5: No auth
echo "=== UNAUTHENTICATED TESTS ==="
echo ""

echo "🧪 No auth - Get forms"
curl -s -w "\nStatus: %{http_code}\n" \
  -H "Content-Type: application/json" \
  "$API_BASE/api/forms?limit=5" | jq -r '.' 2>/dev/null || cat
echo ""

echo "🧪 No auth - Super admin endpoint"
curl -s -w "\nStatus: %{http_code}\n" \
  -H "Content-Type: application/json" \
  "$API_BASE/api/super/tenants" | jq -r '.' 2>/dev/null || cat
echo ""

# Test 6: Health
echo "=== HEALTH CHECKS ==="
echo ""

echo "🧪 Health check"
curl -s -w "\nStatus: %{http_code}\n" \
  "$API_BASE/api/health" | jq -r '.' 2>/dev/null || cat
echo ""

echo "🧪 Ping check"
curl -s -w "\nStatus: %{http_code}\n" \
  "$API_BASE/api/ping" | jq -r '.' 2>/dev/null || cat
echo ""

echo "✅ Tests completed!"
echo ""
echo "Expected results:"
echo "- Super admin endpoints: 200 with data"
echo "- Tenant endpoints with header: 200 with scoped data"
echo "- Tenant endpoints without header: empty arrays"
echo "- Cross-tenant access: 403 or empty"
echo "- No auth: 401 unauthorized"
echo "- Health checks: 200"
