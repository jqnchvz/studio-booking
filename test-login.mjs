#!/usr/bin/env node

/**
 * Login API Testing Script
 *
 * Usage: node test-login.mjs <email> <password>
 * Example: node test-login.mjs test@example.com Test123!
 */

async function testLogin(email, password) {
  try {
    console.log('\n🔐 Testing Login API');
    console.log(`Email: ${email}`);
    console.log(`Password: ${'*'.repeat(password.length)}\n`);

    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    console.log(`Status: ${response.status} ${response.statusText}\n`);

    if (response.ok) {
      console.log('✅ Login Successful!\n');
      console.log('User Data:');
      console.log(JSON.stringify(data.user, null, 2));

      // Check for session cookie
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        console.log('\n🍪 Session Cookie Set:');
        console.log(setCookie.split(';')[0]); // Show cookie name and value only
      }
    } else {
      console.log('❌ Login Failed\n');
      console.log('Error:', data.error);
      console.log('Message:', data.message);

      if (data.details) {
        console.log('\nValidation Errors:');
        data.details.forEach((detail) => {
          console.log(`  - ${detail.field}: ${detail.message}`);
        });
      }

      if (data.resetTime) {
        console.log(`\nRate limit resets at: ${new Date(data.resetTime).toLocaleString()}`);
      }
    }

    console.log('');
  } catch (error) {
    console.error('\n❌ Request Failed:', error.message);
    console.error('\nMake sure your dev server is running: npm run dev\n');
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('\n📝 Login API Test Script\n');
  console.log('Usage: node test-login.mjs <email> <password>');
  console.log('\nExamples:');
  console.log('  node test-login.mjs test@example.com Test123!');
  console.log('  node test-login.mjs user@mail.com MyPassword1@\n');
  process.exit(0);
}

const [email, password] = args;

// Run test
testLogin(email, password);
