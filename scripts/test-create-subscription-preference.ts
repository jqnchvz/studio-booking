/**
 * Manual test script for subscription preference creation (RES-17)
 *
 * Prerequisites:
 * 1. User must be registered and email verified
 * 2. User must be logged in (have valid session token)
 * 3. Subscription plans must be seeded in database
 * 4. MercadoPago credentials must be configured
 *
 * Usage:
 *   tsx scripts/test-create-subscription-preference.ts
 */

import 'dotenv/config';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  data?: unknown;
}

const results: TestResult[] = [];

/**
 * Helper function to make API requests
 */
async function apiRequest(
  endpoint: string,
  method: string,
  body?: unknown,
  sessionToken?: string
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (sessionToken) {
    headers['Cookie'] = `session=${sessionToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  return { response, data };
}

/**
 * Test: Create subscription preference without authentication
 */
async function testUnauthenticated() {
  console.log('\n📋 Test 1: Create subscription preference (Unauthenticated)');

  try {
    const { response, data } = await apiRequest(
      '/api/subscriptions/create-preference',
      'POST',
      { planId: 'basic-monthly' }
    );

    if (response.status === 401) {
      results.push({
        test: 'Unauthenticated request',
        status: 'PASS',
        message: 'Correctly rejected unauthenticated request',
        data,
      });
      console.log('✅ PASS: Returns 401 for unauthenticated request');
    } else {
      results.push({
        test: 'Unauthenticated request',
        status: 'FAIL',
        message: `Expected 401, got ${response.status}`,
        data,
      });
      console.log(`❌ FAIL: Expected 401, got ${response.status}`);
    }
  } catch (error) {
    results.push({
      test: 'Unauthenticated request',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ FAIL:', error);
  }
}

/**
 * Test: Create subscription preference with invalid plan ID
 */
async function testInvalidPlanId(sessionToken: string) {
  console.log('\n📋 Test 2: Create subscription preference (Invalid Plan ID)');

  try {
    const { response, data } = await apiRequest(
      '/api/subscriptions/create-preference',
      'POST',
      { planId: 'non-existent-plan' },
      sessionToken
    );

    if (response.status === 404) {
      results.push({
        test: 'Invalid plan ID',
        status: 'PASS',
        message: 'Correctly rejected invalid plan ID',
        data,
      });
      console.log('✅ PASS: Returns 404 for invalid plan ID');
    } else {
      results.push({
        test: 'Invalid plan ID',
        status: 'FAIL',
        message: `Expected 404, got ${response.status}`,
        data,
      });
      console.log(`❌ FAIL: Expected 404, got ${response.status}`);
    }
  } catch (error) {
    results.push({
      test: 'Invalid plan ID',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ FAIL:', error);
  }
}

/**
 * Test: Create subscription preference with valid plan ID
 */
async function testValidSubscription(sessionToken: string) {
  console.log('\n📋 Test 3: Create subscription preference (Valid Plan ID)');

  try {
    const { response, data } = await apiRequest(
      '/api/subscriptions/create-preference',
      'POST',
      { planId: 'basic-monthly' },
      sessionToken
    );

    if (response.status === 201 && data.success) {
      results.push({
        test: 'Valid subscription creation',
        status: 'PASS',
        message: 'Successfully created subscription preference',
        data,
      });
      console.log('✅ PASS: Successfully created subscription preference');
      console.log('   Subscription ID:', data.data.subscriptionId);
      console.log('   Preference ID:', data.data.preferenceId);
      console.log('   Init Point:', data.data.initPoint);
      return data.data.subscriptionId;
    } else {
      results.push({
        test: 'Valid subscription creation',
        status: 'FAIL',
        message: `Expected 201, got ${response.status}`,
        data,
      });
      console.log(`❌ FAIL: Expected 201, got ${response.status}`);
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    results.push({
      test: 'Valid subscription creation',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ FAIL:', error);
  }

  return null;
}

/**
 * Test: Attempt to create duplicate subscription
 */
async function testDuplicateSubscription(sessionToken: string) {
  console.log('\n📋 Test 4: Create duplicate subscription (Should update existing)');

  try {
    // First create subscription
    await apiRequest(
      '/api/subscriptions/create-preference',
      'POST',
      { planId: 'basic-monthly' },
      sessionToken
    );

    // Try to create again with different plan
    const { response, data } = await apiRequest(
      '/api/subscriptions/create-preference',
      'POST',
      { planId: 'pro-monthly' },
      sessionToken
    );

    if (response.status === 201 && data.success) {
      results.push({
        test: 'Duplicate subscription handling',
        status: 'PASS',
        message: 'Successfully updated existing subscription',
        data,
      });
      console.log('✅ PASS: Successfully updated existing subscription to new plan');
    } else {
      results.push({
        test: 'Duplicate subscription handling',
        status: 'FAIL',
        message: `Expected 201, got ${response.status}`,
        data,
      });
      console.log(`❌ FAIL: Expected 201, got ${response.status}`);
    }
  } catch (error) {
    results.push({
      test: 'Duplicate subscription handling',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ FAIL:', error);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Starting Subscription Preference Creation Tests (RES-17)');
  console.log('='.repeat(60));

  // Test 1: Unauthenticated request
  await testUnauthenticated();

  // For the remaining tests, we need a valid session token
  console.log(
    '\n⚠️  MANUAL STEP REQUIRED: Please provide a valid session token'
  );
  console.log('   1. Register a user via POST /api/auth/register');
  console.log('   2. Verify email via POST /api/auth/verify-email');
  console.log('   3. Login via POST /api/auth/login');
  console.log('   4. Copy the session cookie value');
  console.log('   5. Set SESSION_TOKEN environment variable');
  console.log('\n   Example:');
  console.log('   SESSION_TOKEN="your-jwt-token" tsx scripts/test-create-subscription-preference.ts\n');

  const sessionToken = process.env.SESSION_TOKEN;

  if (!sessionToken) {
    console.log('⏭️  Skipping authenticated tests (no SESSION_TOKEN provided)');
    printSummary();
    return;
  }

  // Test 2: Invalid plan ID
  await testInvalidPlanId(sessionToken);

  // Test 3: Valid subscription creation
  const subscriptionId = await testValidSubscription(sessionToken);

  // Test 4: Duplicate subscription handling
  if (subscriptionId) {
    await testDuplicateSubscription(sessionToken);
  }

  // Print summary
  printSummary();
}

/**
 * Print test summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  results.forEach((result) => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${result.test}: ${result.message}`);
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
