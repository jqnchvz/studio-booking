#!/usr/bin/env tsx

/**
 * Test MercadoPago SDK Connection
 * Verifies that MercadoPago credentials are valid and API is reachable
 *
 * Usage:
 *   npx tsx scripts/test-mercadopago.ts
 *
 * Requirements:
 *   - MERCADOPAGO_ACCESS_TOKEN must be set in .env
 *   - MERCADOPAGO_PUBLIC_KEY must be set in .env
 *   - MERCADOPAGO_WEBHOOK_SECRET must be set in .env
 */

// Load environment variables FIRST
import { config } from 'dotenv';
config();

// Main test function using dynamic imports
async function runTest() {
  // Dynamically import modules AFTER dotenv is loaded
  const { testMercadoPagoConnection } = await import(
    '../src/lib/services/mercadopago.service.js'
  );
  const { mercadopagoConfig } = await import(
    '../src/lib/config/mercadopago.config.js'
  );

  console.log('');
  console.log('🧪 Testing MercadoPago SDK Connection');
  console.log('=====================================');
  console.log('');

  // Show configuration (masked)
  console.log('Configuration:');
  console.log(
    `  Access Token: ${mercadopagoConfig.accessToken ? `${mercadopagoConfig.accessToken.substring(0, 15)}...` : '❌ NOT SET'}`
  );
  console.log(
    `  Public Key: ${mercadopagoConfig.publicKey ? `${mercadopagoConfig.publicKey.substring(0, 15)}...` : '❌ NOT SET'}`
  );
  console.log(
    `  Webhook Secret: ${mercadopagoConfig.webhookSecret ? '***' + mercadopagoConfig.webhookSecret.substring(mercadopagoConfig.webhookSecret.length - 4) : '❌ NOT SET'}`
  );
  console.log(`  App URL: ${mercadopagoConfig.appUrl}`);
  console.log('');

  try {
    const isConnected = await testMercadoPagoConnection();

    console.log('');
    console.log('=====================================');

    if (isConnected) {
      console.log('✅ MercadoPago SDK is configured correctly!');
      console.log('   You can now use MercadoPago for payments.');
      process.exit(0);
    } else {
      console.log('❌ MercadoPago connection failed.');
      console.log('   Please check your credentials and try again.');
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('❌ Fatal error during MercadoPago test:');

    if (error instanceof Error) {
      console.error(`   ${error.message}`);

      if (error.message.includes('Missing required')) {
        console.error('');
        console.error('💡 Tip: Make sure you have set all required environment variables:');
        console.error('   - MERCADOPAGO_ACCESS_TOKEN');
        console.error('   - MERCADOPAGO_PUBLIC_KEY');
        console.error('   - MERCADOPAGO_WEBHOOK_SECRET');
        console.error('');
        console.error('   You can get these from: https://www.mercadopago.cl/developers/panel/app');
      }
    } else {
      console.error('   Unknown error:', error);
    }

    console.error('');
    process.exit(1);
  }
}

// Run the test
runTest();
