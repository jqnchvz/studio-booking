#!/bin/bash

# Test Login API Script
# Usage: ./scripts/test-login.sh

echo "🧪 Testing Login API..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000/api/auth/login"

# Test 1: Empty credentials
echo -e "${YELLOW}Test 1: Empty credentials${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"email":"","password":""}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 400 ]; then
  echo -e "${GREEN}✓ Pass${NC} - Returns 400 for empty credentials"
else
  echo -e "${RED}✗ Fail${NC} - Expected 400, got $http_code"
fi
echo "Response: $body"
echo ""

# Test 2: Invalid email format
echo -e "${YELLOW}Test 2: Invalid email format${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","password":"Password123!"}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 400 ]; then
  echo -e "${GREEN}✓ Pass${NC} - Returns 400 for invalid email"
else
  echo -e "${RED}✗ Fail${NC} - Expected 400, got $http_code"
fi
echo "Response: $body"
echo ""

# Test 3: Non-existent user
echo -e "${YELLOW}Test 3: Non-existent user${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"Password123!"}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 401 ]; then
  echo -e "${GREEN}✓ Pass${NC} - Returns 401 for non-existent user"
else
  echo -e "${RED}✗ Fail${NC} - Expected 401, got $http_code"
fi
echo "Response: $body"
echo ""

# Test 4: Valid credentials (requires existing user)
echo -e "${YELLOW}Test 4: Valid credentials${NC}"
echo "Note: This test requires a verified user to exist in the database"
echo "You can create one by:"
echo "1. Going to http://localhost:3000/register"
echo "2. Registering with: test@example.com / Test1234!"
echo "3. Verifying the email via the link in console logs"
echo ""
echo "Then uncomment and run this test with those credentials"
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@email.com","password":"Test123!","rememberMe":true}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
  echo -e "${GREEN}✓ Pass${NC} - Successfully logged in"
else
  echo -e "${RED}✗ Fail${NC} - Expected 200, got $http_code"
fi
echo "Response: $body"

echo -e "${YELLOW}Test Summary${NC}"
echo "✓ Tests completed"
echo "Note: Make sure the dev server is running (npm run dev)"
