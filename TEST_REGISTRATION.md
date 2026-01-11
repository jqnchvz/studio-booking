# Testing User Registration API

This document provides test cases and commands for testing the user registration API endpoint.

## Prerequisites

1. PostgreSQL database is running
2. Environment variables are configured in `.env`
3. Prisma schema is pushed to database: `npm run db:push`
4. Development server is running: `npm run dev`

## Test Cases

### 1. Valid Registration (Success)

**Test**: Register a new user with valid data

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "emailVerified": false
  },
  "verificationToken": "..."
}
```

**Rate Limit Headers**:
- `X-RateLimit-Limit: 5`
- `X-RateLimit-Remaining: 4`
- `X-RateLimit-Reset: <timestamp>`

---

### 2. Duplicate Email (Conflict)

**Test**: Try to register with an email that already exists

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "AnotherPass123!",
    "name": "Another User"
  }'
```

**Expected Response** (409 Conflict):
```json
{
  "error": "Registration failed",
  "message": "An account with this email already exists"
}
```

---

### 3. Invalid Email Format

**Test**: Register with invalid email format

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

**Expected Response** (400 Bad Request):
```json
{
  "error": "Validation failed",
  "message": "Invalid input data",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

---

### 4. Weak Password

**Test**: Register with password that doesn't meet requirements

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "weak@example.com",
    "password": "weak",
    "name": "Test User"
  }'
```

**Expected Response** (400 Bad Request):
```json
{
  "error": "Validation failed",
  "message": "Invalid input data",
  "details": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    }
  ]
}
```

---

### 5. Missing Required Fields

**Test**: Register with missing name field

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "missing@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response** (400 Bad Request):
```json
{
  "error": "Validation failed",
  "message": "Invalid input data",
  "details": [
    {
      "field": "name",
      "message": "Required"
    }
  ]
}
```

---

### 6. Name Too Short

**Test**: Register with name less than 2 characters

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "short@example.com",
    "password": "SecurePass123!",
    "name": "A"
  }'
```

**Expected Response** (400 Bad Request):
```json
{
  "error": "Validation failed",
  "message": "Invalid input data",
  "details": [
    {
      "field": "name",
      "message": "Name must be at least 2 characters"
    }
  ]
}
```

---

### 7. Rate Limiting (Too Many Requests)

**Test**: Make 6 registration attempts from the same IP within 1 hour

```bash
# Run this command 6 times quickly
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"test$i@example.com\",
      \"password\": \"SecurePass123!\",
      \"name\": \"Test User $i\"
    }"
  echo "\n--- Request $i ---\n"
done
```

**Expected Response for 6th request** (429 Too Many Requests):
```json
{
  "error": "Too many registration attempts",
  "message": "Please try again later",
  "resetTime": "<ISO timestamp>"
}
```

**Rate Limit Headers** (6th request):
- `X-RateLimit-Limit: 5`
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: <timestamp>`

---

## Password Requirements

The password must meet the following criteria:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%*?&)

**Valid password examples**:
- `SecurePass123!`
- `MyP@ssw0rd`
- `Test1234!`

**Invalid password examples**:
- `password` (no uppercase, number, or special char)
- `PASSWORD123!` (no lowercase)
- `Password!` (no number)
- `Pass123` (no special character)

---

## Rate Limiting Details

- **Limit**: 5 requests per hour per IP address
- **Window**: 60 minutes (3600 seconds)
- **Tracking**: IP-based (checks `x-forwarded-for`, `x-real-ip`, or direct IP)
- **Storage**: In-memory (development) - upgrade to Redis for production
- **Headers**: Returns rate limit information in response headers

---

## Testing with Different IPs

To test rate limiting with different IPs, you can use a proxy or modify the request headers:

```bash
# Simulate different client IPs (for local testing only)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 192.168.1.1" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

---

## Database Verification

After successful registration, verify the user in the database:

```sql
-- Connect to PostgreSQL
psql -U user -d reservapp_dev

-- Check the created user
SELECT id, email, name, "emailVerified", "createdAt"
FROM users
WHERE email = 'test@example.com';

-- Check password hash is stored (should not be the plain password)
SELECT "passwordHash" FROM users WHERE email = 'test@example.com';

-- Check verification token exists
SELECT "verificationToken", "verificationTokenExpiry"
FROM users
WHERE email = 'test@example.com';
```

---

## Notes

1. **Verification Token**: In development, the verification token is returned in the response for testing. In production, this should only be sent via email.

2. **Email Sending**: Email sending is marked with `TODO(human)` in the code and will be implemented in task RES-9.

3. **HTTPS**: In production, ensure the API is served over HTTPS to protect passwords in transit.

4. **JWT_SECRET**: Make sure to use a strong, random secret in production (not the example one).
