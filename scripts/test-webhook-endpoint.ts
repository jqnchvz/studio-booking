/**
 * Manual test script for MercadoPago webhook endpoint (RES-18)
 *
 * Prerequisites:
 * 1. Development server must be running (npm run dev)
 * 2. Database must be accessible
 *
 * Usage:
 *   npx tsx scripts/test-webhook-endpoint.ts
 */

import 'dotenv/config';
import crypto from 'crypto';

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
  headers?: HeadersInit
) {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { ...defaultHeaders, ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  return { response, data };
}

/**
 * Generate mock webhook signature
 */
function generateMockSignature(
  dataId: string,
  eventType: string,
  timestamp: string
): string {
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return 'mock-signature-no-secret';
  }

  const manifest = `id=${dataId}&type=${eventType}&ts=${timestamp}`;
  const hash = crypto
    .createHmac('sha256', webhookSecret)
    .update(manifest)
    .digest('hex');

  return `ts=${timestamp},v1=${hash}`;
}

/**
 * Test: GET endpoint returns information
 */
async function testGetEndpoint() {
  console.log('\n📋 Test 1: GET webhook endpoint');

  try {
    const { response, data } = await apiRequest(
      '/api/webhooks/mercadopago',
      'GET'
    );

    if (response.status === 200 && data.endpoint) {
      results.push({
        test: 'GET webhook information',
        status: 'PASS',
        message: 'Returns webhook endpoint information',
        data,
      });
      console.log('✅ PASS: Returns webhook information');
      console.log('   Endpoint:', data.endpoint);
      console.log('   Events:', data.events?.join(', '));
    } else {
      results.push({
        test: 'GET webhook information',
        status: 'FAIL',
        message: `Expected 200, got ${response.status}`,
        data,
      });
      console.log(`❌ FAIL: Expected 200, got ${response.status}`);
    }
  } catch (error) {
    results.push({
      test: 'GET webhook information',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ FAIL:', error);
  }
}

/**
 * Test: POST with valid payment.created event
 */
async function testPaymentCreatedEvent() {
  console.log('\n📋 Test 2: POST payment.created event');

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const dataId = 'payment_123456';
    const eventType = 'payment';

    const mockEvent = {
      id: Date.now(),
      action: 'created',
      api_version: 'v1',
      data: {
        id: dataId,
      },
      date_created: new Date().toISOString(),
      live_mode: false,
      type: eventType,
      user_id: '123456',
    };

    const signature = generateMockSignature(dataId, eventType, timestamp);

    const { response, data } = await apiRequest(
      '/api/webhooks/mercadopago',
      'POST',
      mockEvent,
      {
        'x-signature': signature,
        'x-request-id': 'test-request-123',
      }
    );

    if (response.status === 200 && data.success) {
      results.push({
        test: 'payment.created webhook',
        status: 'PASS',
        message: 'Successfully processed payment.created event',
        data,
      });
      console.log('✅ PASS: payment.created event processed');
    } else {
      results.push({
        test: 'payment.created webhook',
        status: 'FAIL',
        message: `Expected 200 with success, got ${response.status}`,
        data,
      });
      console.log(`❌ FAIL: Expected 200, got ${response.status}`);
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    results.push({
      test: 'payment.created webhook',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ FAIL:', error);
  }
}

/**
 * Test: POST with subscription.updated event
 */
async function testSubscriptionUpdatedEvent() {
  console.log('\n📋 Test 3: POST subscription.updated event');

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const dataId = 'sub_789012';
    const eventType = 'subscription';

    const mockEvent = {
      id: Date.now() + 1,
      action: 'updated',
      api_version: 'v1',
      data: {
        id: dataId,
      },
      date_created: new Date().toISOString(),
      live_mode: false,
      type: eventType,
      user_id: '123456',
    };

    const signature = generateMockSignature(dataId, eventType, timestamp);

    const { response, data } = await apiRequest(
      '/api/webhooks/mercadopago',
      'POST',
      mockEvent,
      {
        'x-signature': signature,
        'x-request-id': 'test-request-456',
      }
    );

    if (response.status === 200) {
      results.push({
        test: 'subscription.updated webhook',
        status: 'PASS',
        message: 'Successfully processed subscription.updated event',
        data,
      });
      console.log('✅ PASS: subscription.updated event processed');
    } else {
      results.push({
        test: 'subscription.updated webhook',
        status: 'FAIL',
        message: `Expected 200, got ${response.status}`,
        data,
      });
      console.log(`❌ FAIL: Expected 200, got ${response.status}`);
    }
  } catch (error) {
    results.push({
      test: 'subscription.updated webhook',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ FAIL:', error);
  }
}

/**
 * Test: POST duplicate event (idempotency)
 */
async function testIdempotency() {
  console.log('\n📋 Test 4: POST duplicate event (idempotency check)');

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const dataId = 'payment_idempotent_test';
    const eventType = 'payment';
    const eventId = Date.now() + 2;

    const mockEvent = {
      id: eventId,
      action: 'created',
      api_version: 'v1',
      data: {
        id: dataId,
      },
      date_created: new Date().toISOString(),
      live_mode: false,
      type: eventType,
      user_id: '123456',
    };

    const signature = generateMockSignature(dataId, eventType, timestamp);

    // Send first time
    await apiRequest('/api/webhooks/mercadopago', 'POST', mockEvent, {
      'x-signature': signature,
      'x-request-id': 'test-idempotent-1',
    });

    // Send second time (duplicate)
    const { response, data } = await apiRequest(
      '/api/webhooks/mercadopago',
      'POST',
      mockEvent,
      {
        'x-signature': signature,
        'x-request-id': 'test-idempotent-2',
      }
    );

    if (response.status === 200) {
      results.push({
        test: 'Idempotency',
        status: 'PASS',
        message: 'Duplicate event handled gracefully',
        data,
      });
      console.log('✅ PASS: Idempotency working (duplicate handled)');
    } else {
      results.push({
        test: 'Idempotency',
        status: 'FAIL',
        message: `Expected 200, got ${response.status}`,
        data,
      });
      console.log(`❌ FAIL: Expected 200, got ${response.status}`);
    }
  } catch (error) {
    results.push({
      test: 'Idempotency',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ FAIL:', error);
  }
}

/**
 * Test: POST with invalid signature (should reject)
 */
async function testInvalidSignature() {
  console.log('\n📋 Test 5: POST with invalid signature');

  // Skip if no webhook secret configured (development mode)
  if (!process.env.MERCADOPAGO_WEBHOOK_SECRET) {
    console.log('⏭️  SKIP: No webhook secret configured (development mode)');
    return;
  }

  try {
    const mockEvent = {
      id: Date.now() + 3,
      action: 'created',
      api_version: 'v1',
      data: {
        id: 'payment_invalid_sig',
      },
      date_created: new Date().toISOString(),
      live_mode: false,
      type: 'payment',
      user_id: '123456',
    };

    const { response, data } = await apiRequest(
      '/api/webhooks/mercadopago',
      'POST',
      mockEvent,
      {
        'x-signature': 'ts=1234567890,v1=invalid_signature',
        'x-request-id': 'test-invalid-sig',
      }
    );

    if (response.status === 401) {
      results.push({
        test: 'Invalid signature rejection',
        status: 'PASS',
        message: 'Correctly rejected invalid signature',
        data,
      });
      console.log('✅ PASS: Invalid signature rejected with 401');
    } else {
      results.push({
        test: 'Invalid signature rejection',
        status: 'FAIL',
        message: `Expected 401, got ${response.status}`,
        data,
      });
      console.log(`❌ FAIL: Expected 401, got ${response.status}`);
    }
  } catch (error) {
    results.push({
      test: 'Invalid signature rejection',
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
  console.log('🧪 Starting MercadoPago Webhook Endpoint Tests (RES-18)');
  console.log('='.repeat(60));

  await testGetEndpoint();
  await testPaymentCreatedEvent();
  await testSubscriptionUpdatedEvent();
  await testIdempotency();
  await testInvalidSignature();

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
