# CLAUDE.md - Development Guidelines

## Project Overview

**Reservapp** is a subscription-based studio booking system built with modern web technologies. The application enables users to register, authenticate, reserve studio time slots, manage subscriptions, and process payments through MercadoPago.

### Key Features
- User authentication and management
- Studio booking and reservation system
- Subscription management
- Payment processing with MercadoPago
- Email notifications
- Admin dashboard

## Tech Stack

### Core Technologies
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 20.19+ (LTS recommended)
- **Package Manager**: npm

### Frontend
- **UI Library**: React 19+
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form
- **Validation**: Zod

### Backend
- **Database**: PostgreSQL
- **ORM**: Prisma 7.x
- **Authentication**: JWT + bcrypt
- **Session Store**: Redis
- **Email**: Resend
- **Payment Gateway**: MercadoPago

### Development Tools
- **Testing**: Vitest 4.x + Testing Library
- **Linting**: ESLint 8.x (stable)
- **Config**: eslint-config-next 14.x
- **Code Formatting**: Prettier
- **Type Checking**: TypeScript strict mode

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth-related routes group
│   ├── (dashboard)/       # Dashboard routes group
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # shadcn/ui components (auto-generated)
│   └── features/          # Feature-specific components
│       ├── auth/          # Authentication components
│       ├── booking/       # Booking components
│       ├── subscription/  # Subscription components
│       └── admin/         # Admin components
├── lib/
│   ├── services/          # Business logic services
│   │   ├── auth.ts        # Authentication service
│   │   ├── booking.ts     # Booking service
│   │   ├── payment.ts     # Payment service
│   │   └── email.ts       # Email service
│   ├── validations/       # Zod validation schemas
│   │   ├── auth.ts        # Auth schemas
│   │   ├── booking.ts     # Booking schemas
│   │   └── payment.ts     # Payment schemas
│   ├── utils/             # Utility functions
│   ├── db.ts              # Prisma client instance
│   └── redis.ts           # Redis client instance
├── types/                 # TypeScript type definitions
│   ├── auth.ts
│   ├── booking.ts
│   └── payment.ts
└── middleware.ts          # Next.js middleware (auth, etc.)
```

## Pre-Commit Checklist

**MANDATORY: Run these checks before EVERY commit to avoid CI failures:**

```bash
# 1. Install dependencies (if package.json changed)
npm install

# 2. Generate Prisma types (if schema changed)
npm run db:generate

# 3. Run linter
npm run lint

# 4. Run type check
npm run type-check

# 5. Run all tests
npm test

# 6. Verify build succeeds
npm run build
```

**If ANY of these fail, fix the issues before committing.**

## Dependency Management Rules

### Version Selection Strategy

**IMPORTANT: Avoid bleeding-edge versions in production projects**

1. **Prefer Stable Versions (N-1 or LTS)**
   - Use proven, stable versions rather than latest
   - Example: ESLint 8.x over 9.x, Node 20 LTS over latest
   - Check compatibility matrices before upgrading

2. **Check Node.js Requirements**
   - ALWAYS verify Node.js version requirements when adding/upgrading packages
   - Update CI workflow Node versions if requirements change
   - Document minimum Node.js version in README

3. **Dependency Compatibility**
   - Test that all dependencies work together BEFORE committing
   - Be especially careful with:
     - Next.js + ESLint config versions
     - Prisma + PostgreSQL adapter versions
     - Testing libraries + framework versions

4. **Lock File Management**
   - **ALWAYS commit `package-lock.json`** to repository
   - NEVER add `package-lock.json` to `.gitignore`
   - Use `npm ci` in CI/CD (requires lock file)
   - Use `npm install` in local development

### Known Compatibility Issues

| Package Combination | Issue | Solution |
|-------------------|-------|----------|
| Next.js 16 + ESLint 9 | Circular dependency errors | Use ESLint 8.x + eslint-config-next 14.x |
| Prisma 7 | Requires Node 20+ | Update CI to Node 20+, document in README |
| Vitest 4 | Requires Node 20+ | Ensure Node 20+ in development and CI |

## CI/CD Setup Guidelines

### Required CI Steps (in order)

When setting up GitHub Actions or any CI/CD:

```yaml
1. Checkout code
2. Setup Node.js (check dependencies for minimum version!)
3. Install dependencies (npm ci)
4. Generate Prisma types (npm run db:generate) ← CRITICAL
5. Run linter (npm run lint)
6. Run type check (npm run type-check)
7. Run tests (npm test)
8. Build project (npm run build)
```

### Common CI Pitfalls

#### 1. Missing package-lock.json
**Problem:** `npm ci` requires `package-lock.json`
**Solution:** Remove from `.gitignore` and commit it
```bash
# Check if it's ignored
cat .gitignore | grep package-lock

# If found, remove the line and commit
git add .gitignore package-lock.json
git commit -m "fix(ci): commit package-lock.json for reproducible builds"
```

#### 2. Prisma Types Not Generated
**Problem:** TypeScript can't find `PrismaClient` type
**Solution:** Always run `npm run db:generate` before type-checking
```yaml
- name: Generate Prisma types
  run: npm run db:generate
```

#### 3. Node.js Version Mismatch
**Problem:** Dependencies require Node 20+ but CI uses Node 18
**Solution:** Check `package.json` for engine requirements, update CI matrix
```json
"engines": {
  "node": ">=20.19.0"
}
```

#### 4. ESLint Configuration Errors
**Problem:** ESLint 9 flat config incompatibility
**Solution:** Use ESLint 8.x with traditional .eslintrc.json
```bash
npm install -D eslint@^8 eslint-config-next@14
```

#### 5. Environment Variables Missing
**Problem:** Tests fail because required env vars aren't set
**Solution:** Set test env vars in CI configuration
```yaml
env:
  JWT_SECRET: test-jwt-secret-ci
  SESSION_SECRET: test-session-secret-ci
  NODE_ENV: test
```

## Testing Infrastructure Requirements

### Before Adding Tests

1. **Install testing framework**
   ```bash
   npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
   ```

2. **Create configuration files**
   - `vitest.config.ts` - Vitest configuration
   - `vitest.setup.ts` - Test environment setup

3. **Add test scripts to package.json**
   ```json
   {
     "test": "vitest run",
     "test:watch": "vitest",
     "test:ui": "vitest --ui",
     "test:coverage": "vitest run --coverage"
   }
   ```

4. **Verify setup works BEFORE writing tests**
   ```bash
   npm test  # Should run (even with 0 tests)
   ```

### TypeScript in Tests

**Common Issues:**

1. **Read-only property assignments** (NODE_ENV, etc.)
   ```typescript
   // ❌ Wrong - TypeScript error
   process.env.NODE_ENV = 'test';

   // ✅ Correct - Type assertion
   (process.env as any).NODE_ENV = 'test';
   ```

2. **Incomplete mock objects**
   ```typescript
   // ❌ Wrong - Missing required fields
   const mockUser = {
     id: 'user-123',
     email: 'test@example.com',
   };

   // ✅ Correct - All Prisma model fields
   const mockUser = {
     id: 'user-123',
     email: 'test@example.com',
     name: 'Test User',
     passwordHash: 'hash',
     emailVerified: true,
     isAdmin: false,
     createdAt: new Date(),
     updatedAt: new Date(),
     verificationToken: null,
     verificationTokenExpiry: null,
     resetToken: null,      // Don't forget these!
     resetTokenExpiry: null,
   };

   // ✅ When including Prisma relations - use type assertion
   vi.mocked(db.resource.findUnique).mockResolvedValueOnce({
     id: 'resource-123',
     name: 'Test Resource',
     isActive: true,
     capacity: 10,
     // ... other base Resource fields ...
     availability: [  // This relation isn't in base Resource type
       {
         id: 'avail-1',
         dayOfWeek: 1,
         startTime: '09:00',
         endTime: '18:00',
         isActive: true,
         createdAt: new Date(),
         updatedAt: new Date(),
       }
     ],
   } as any);  // Type assertion needed for relations
   ```

   **Why `as any` for relations**: Prisma's base types (e.g., `Resource`) don't include
   relations (e.g., `availability`). When mocking queries with `include` or `select` that
   add relations, TypeScript needs a type assertion. This is a test-only pattern - production
   code uses Prisma's generated types correctly. Without `as any`, you'll get CI errors like:
   `Object literal may only specify known properties, and 'availability' does not exist`.

3. **Missing type definitions**
   ```bash
   # If you get "Could not find declaration file" errors
   npm install -D @types/package-name

   # Common ones for this project:
   npm install -D @types/pg @types/bcrypt @types/jsonwebtoken
   ```

## Common Mistakes and How to Avoid Them

### 1. Forgetting to Test Locally

**Mistake:** Committing code without running tests locally, discovering failures in CI

**Prevention:**
- Use pre-commit hooks (optional but recommended)
- ALWAYS run the full checklist above before committing
- If tests take too long, at least run type-check and lint

### 2. Using Incompatible Dependency Versions

**Mistake:** Upgrading to latest versions without checking compatibility

**Prevention:**
- Check release notes before upgrading major versions
- Test locally with new versions before committing
- Update CI if Node.js requirements change

### 3. Not Understanding CI Error Messages

**Mistake:** Making random changes hoping to fix CI

**Prevention:**
- Read the FULL error message in CI logs
- Look for specific errors like:
  - "Module has no exported member" → Missing type generation
  - "Unsupported engine" → Node.js version mismatch
  - "Cannot find module" → Missing dependency or types
- Fix the root cause, not the symptoms

### 4. Committing Generated Files

**Mistake:** Committing Prisma generated files or build artifacts

**Already in .gitignore:**
```
.next/
/dist/
/build/
/src/generated/prisma
```

**Prevention:** Always check `.gitignore` before adding new generated files

### 5. Breaking Changes Without Testing

**Mistake:** Changing core config files without verifying everything still works

**Prevention:**
- After modifying:
  - `package.json` → Run `npm install && npm run build`
  - `.eslintrc.json` → Run `npm run lint`
  - `tsconfig.json` → Run `npm run type-check`
  - `vitest.config.ts` → Run `npm test`
  - `prisma/schema.prisma` → Run `npm run db:generate && npm run type-check`

## Development Workflow

### 1. Task Management with Jira

Every task should follow this workflow:

1. **Fetch Jira Task**: Read and understand the complete task description
   - Review Epic, Story, and related tasks for context
   - Identify acceptance criteria and requirements

2. **Transition to "In Progress"**: Update Jira task status
   ```bash
   # Use Atlassian MCP tools or Jira interface
   # Status: "To Do" → "In Progress"
   ```

3. **Create New Branch**: ALWAYS create a new branch before starting work
   - Branch naming: `type_of_task/RES-X-task-title`
   - `type_of_task` must be either `feature` or `fix`
   - Example: `feature/RES-3-initialize-nextjs-project`
   - Example: `fix/RES-15-auth-token-expiration`

4. **Create Todo List**: Use TodoWrite tool to track subtasks

5. **Implement**: Follow task requirements step by step
   - Make small, incremental commits as you work
   - Each commit should represent a logical unit of work
   - Use conventional commit format: `type(scope): description (RES-X)`

6. **Test**: Verify functionality works as expected

7. **Add Jira Comment**: Document what was accomplished
   - Summarize key changes and implementations
   - Mention any important decisions or trade-offs
   - List files created/modified
   - Include any relevant technical notes

8. **Final Commit**: Commit any remaining changes

9. **Push Branch**: Push all commits to remote repository

10. **Create Pull Request**: Create PR for code review
    - Use format: `[RES-X] Task Title`
    - Include comprehensive PR description
    - Link to Jira task

11. **Transition to "In Review"**: Update Jira task status
    ```bash
    # Status: "In Progress" → "In Review"
    ```

12. **Code Review**: Address review comments if any

13. **Merge**: After approval, merge PR to master

14. **Transition to "Done"**: Update Jira task status
    ```bash
    # Status: "In Review" → "Done"
    ```

> **IMPORTANT**:
> - Never work directly on the master/main branch. Every task MUST have its own branch.
> - Make small, incremental commits throughout development.
> - Every task MUST go through a Pull Request before merging to master.
> - Always keep Jira task status updated to reflect current work state.

### 1.1 Jira Status Workflow

```
To Do → In Progress → In Review → Done
  ↓         ↓            ↓          ↓
Start    Coding      PR Created  PR Merged
Task    + Commits
```

**Status Transitions:**

1. **To Do → In Progress**
   - When: As soon as you start working on the task
   - Actions:
     - Fetch and read task details
     - Create feature/fix branch
     - Begin implementation

2. **Add Jira Comment (while In Progress)**
   - When: After completing implementation, before creating PR
   - Content should include:
     ```
     ✅ Implementation Complete

     Summary:
     - Brief overview of what was implemented

     Key Changes:
     - File 1: Description of changes
     - File 2: Description of changes

     Technical Notes:
     - Any important decisions made
     - Libraries/dependencies added
     - Security considerations

     Testing:
     - How to test the changes
     - Test cases covered
     ```

3. **In Progress → In Review**
   - When: Immediately after creating the Pull Request
   - Actions:
     - PR has been created and is ready for review
     - All commits are pushed
     - Implementation is complete

4. **In Review → Done**
   - When: After PR has been merged to master
   - Actions:
     - PR is merged and branch is deleted
     - Task is fully complete
     - Ready to move to next task

### 2. Code Implementation Guidelines

#### Always Follow This Pattern:

```typescript
// 1. Read existing code first
// Use Read tool to understand current implementation

// 2. Plan changes
// Use TodoWrite to track implementation steps

// 3. Implement incrementally
// Make small, focused changes

// 4. Test immediately
// Verify each change works before moving on
```

#### Never:
- ❌ Modify code you haven't read
- ❌ Add features not requested
- ❌ Over-engineer solutions
- ❌ Create unnecessary abstractions
- ❌ Add comments to unchanged code
- ❌ Implement backward-compatibility hacks for new code

#### Always:
- ✅ Read files before modifying them
- ✅ Use strict TypeScript types
- ✅ Follow existing code patterns
- ✅ Keep solutions simple and focused
- ✅ Validate at system boundaries (user input, APIs)
- ✅ Use Zod for all validation schemas
- ✅ Handle errors appropriately

## Coding Standards

### TypeScript

```typescript
// Use strict types - avoid 'any'
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Use Zod for validation
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

type UserInput = z.infer<typeof UserSchema>;
```

### React Components

```typescript
// Use TypeScript for props
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 rounded',
        variant === 'primary' ? 'bg-blue-600' : 'bg-gray-600'
      )}
    >
      {children}
    </button>
  );
}
```

### API Routes

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/lib/validations/auth';
import { authenticateUser } from '@/lib/services/auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate input
    const body = await request.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      );
    }

    // 2. Execute business logic
    const user = await authenticateUser(result.data);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 3. Return response
    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Database with Prisma

```typescript
// Use transactions for related operations
import { db } from '@/lib/db';

export async function createBookingWithPayment(data: BookingData) {
  return await db.$transaction(async (tx) => {
    // Create booking
    const booking = await tx.booking.create({
      data: {
        userId: data.userId,
        studioId: data.studioId,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });

    // Create payment record
    const payment = await tx.payment.create({
      data: {
        bookingId: booking.id,
        amount: data.amount,
        status: 'pending',
      },
    });

    return { booking, payment };
  });
}
```

## Security Guidelines

### Authentication
- Always hash passwords with bcrypt (minimum 10 rounds)
- Use JWT for session tokens with appropriate expiration
- Store JWT secrets in environment variables
- Implement password reset with time-limited tokens
- Require email verification for new accounts

### Authorization
- Validate user permissions on every protected route
- Use middleware for route protection
- Check ownership before allowing modifications
- Implement role-based access control (RBAC)

### Input Validation
- Validate ALL user input with Zod schemas
- Sanitize data before database operations
- Use parameterized queries (Prisma handles this)
- Validate file uploads (type, size, content)

### Environment Variables
- Never commit .env files
- Use .env.example for documentation
- Validate required env vars on startup
- Use different secrets for development/production

## Testing Strategy

### Testing Framework

We use **Vitest** as our test runner with the following setup:

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run type checking
npm run type-check
```

### Test Coverage Requirements

**Coverage enforcement is enabled in CI to maintain code quality.**

#### Coverage Thresholds

The project enforces minimum test coverage thresholds via Vitest:
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 60% (lower due to edge cases in auth/payment)
- **Statements**: 70%

**CI will fail** if coverage drops below these thresholds.

#### Priority Coverage Targets

Different parts of the codebase have different coverage expectations:

**🔴 Critical - Aim for 90%+ coverage:**
- `src/lib/services/auth.service.ts` - Authentication logic
- `src/lib/services/payment.service.ts` - Payment processing
- `src/lib/services/mercadopago.service.ts` - MercadoPago integration
- `src/lib/auth/session.ts` - Session management
- `src/lib/auth/get-current-user.ts` - User retrieval

**Rationale**: Bugs in these areas can cause:
- Security vulnerabilities (auth bypass)
- Lost revenue (payment failures)
- Data breaches (session hijacking)

**🟡 Important - Aim for 70-80% coverage:**
- `src/lib/services/booking.service.ts` - Booking logic
- `src/app/api/**/*.ts` - API route handlers
- `src/lib/validations/*.ts` - Validation schemas
- `src/lib/middleware/*.ts` - Middleware functions

**🟢 Nice to Have - Aim for 50-60% coverage:**
- `src/components/**/*.tsx` - UI components
- `src/lib/utils/*.ts` - Utility functions
- Type definitions

#### Running Coverage

```bash
# Run tests with coverage report
npm run test:coverage

# View HTML coverage report (opens in browser)
open coverage/index.html
```

#### Coverage Best Practices

1. **Focus on behavior, not percentages**: 70% well-tested is better than 100% poorly-tested
2. **Test edge cases**: Error handling, timeouts, race conditions
3. **Prioritize critical paths**: Payment flows, authentication, booking logic
4. **Don't chase 100%**: Some code (config files, type definitions) doesn't need tests
5. **Update tests when refactoring**: Keep tests in sync with implementation

### Test File Structure

Test files are colocated with the code they test:
```
src/
├── lib/
│   ├── auth/
│   │   ├── session.ts
│   │   └── session.test.ts       # Tests for session.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── auth.service.test.ts  # Tests for auth.service.ts
│   └── middleware/
│       ├── rate-limit.ts
│       └── rate-limit.test.ts    # Tests for rate-limit.ts
```

### Test Coverage Status

Current test coverage:
- ✅ **Session Management** (`src/lib/auth/session.ts`) - 13 tests
  - JWT token generation and verification
  - Cookie configuration
  - Environment variable validation
- ✅ **Auth Service** (`src/lib/services/auth.service.ts`) - 20 tests
  - Password hashing and verification
  - Credential validation
  - Email verification token management
- ✅ **Rate Limiting** (`src/lib/middleware/rate-limit.ts`) - 14 tests
  - Request throttling
  - IP-based tracking
  - Configuration options
- ✅ **Reservation Validation** (`src/lib/validations/reservation.ts`) - 19 tests
  - Duration validations (30min-8hr)
  - Future date validation
  - Field constraints and refinements
- ✅ **Reservation Service** (`src/lib/services/reservation.service.ts`) - 14 tests
  - Resource availability checking
  - Rate limiting (10/day per user)
  - Transaction-based creation with double-booking prevention
- ✅ **MercadoPago Service** (`src/lib/services/mercadopago.service.ts`) - 34 tests
  - Payment preference creation
  - Subscription management
  - Webhook signature verification
- ✅ **Webhook Handlers** (`src/lib/services/webhook-handlers.service.ts`) - 47 tests
  - Payment status transitions
  - Subscription lifecycle
  - Penalty fee calculations
- ✅ **Penalty Service** (`src/lib/services/penalty.service.ts`) - 18 tests
  - Grace period calculations
  - Progressive penalty rates
  - Payment date handling
- ✅ **Additional coverage** - Multiple workers, API routes, user profile, grace periods

**Total: 214 tests passing** (15 test files)
**Coverage**: 79% statements, 72% functions, 79% lines, 72% branches

### What to Test

#### High Priority (Critical Auth Paths)
✅ **Completed:**
- Session utilities (JWT generation/verification)
- Auth service (validateCredentials, password hashing)
- Rate limiting middleware

🔜 **Todo:**
- API Routes:
  - POST /api/auth/register
  - POST /api/auth/verify-email
  - POST /api/auth/login
- Authentication middleware (when implemented)
- Email sending service

#### Medium Priority
- Validation schemas (Zod)
- Utility functions
- Cookie management

#### Lower Priority
- UI components
- E2E flows

### Writing Tests

#### Unit Tests Pattern

```typescript
// src/lib/utils/example.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { yourFunction } from './example';

describe('YourFunction', () => {
  beforeEach(() => {
    // Reset state before each test
    vi.clearAllMocks();
  });

  it('should do what it is supposed to do', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(() => yourFunction('')).toThrow('Invalid input');
  });
});
```

#### Mocking Database Calls

```typescript
import { describe, it, expect, vi } from 'vitest';
import { db } from '@/lib/db';

// Mock the database module
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Function with DB calls', () => {
  it('should query database correctly', async () => {
    // Setup mock
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: 'user-123',
      email: 'test@example.com',
      // ... other fields
    });

    // Test your function
    const result = await yourFunction();

    // Verify
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
    expect(result).toBeDefined();
  });
});
```

#### Testing Environment Variables

```typescript
describe('Function requiring env vars', () => {
  it('should throw if env var is missing', () => {
    const originalValue = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    expect(() => yourFunction()).toThrow('JWT_SECRET environment variable is not set');

    // Restore
    process.env.JWT_SECRET = originalValue;
  });
});
```

### CI/CD Integration

Tests run automatically on every push and pull request via GitHub Actions:

```yaml
# .github/workflows/ci.yml
- Run on Node.js 18.x and 20.x
- Execute linting, type checking, tests, and build
- Set test environment variables
- Fail PR if any check fails
```

### Test Best Practices

1. **Test behavior, not implementation** - Focus on what the function does, not how
2. **One assertion per test** - Keep tests focused and easy to debug
3. **Use descriptive test names** - Clearly state what is being tested
4. **Mock external dependencies** - Database, APIs, file system, etc.
5. **Test edge cases** - Empty strings, null, undefined, boundary values
6. **Clean up after tests** - Reset mocks and restore environment variables
7. **Keep tests fast** - Avoid unnecessary delays or heavy operations

### Example: Complete Test File

```typescript
// src/lib/auth/session.test.ts
import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken } from './session';

describe('Session Utilities', () => {
  const mockPayload = {
    userId: 'user-123',
    email: 'test@example.com',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should encode payload data in token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
    });
  });

  describe('verifyToken', () => {
    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid.token.here');
      expect(decoded).toBeNull();
    });
  });
});
```

### Critical Feature Patterns

#### Double-Booking Prevention (Reservation System)

**Pattern**: Pessimistic locking with PostgreSQL `FOR UPDATE SKIP LOCKED`

```typescript
// In reservation.service.ts
export async function createReservation(data: CreateReservationInput, userId: string) {
  return await db.$transaction(async (tx) => {
    // CRITICAL: Re-check availability INSIDE transaction with row locking
    const overlapping = await tx.$queryRaw`
      SELECT id FROM "Reservation"
      WHERE "resourceId" = ${data.resourceId}
        AND status IN ('pending', 'confirmed')
        AND (
          ("startTime" <= ${startTime} AND "endTime" > ${startTime})
          OR ("startTime" < ${endTime} AND "endTime" >= ${endTime})
          OR ("startTime" >= ${startTime} AND "endTime" <= ${endTime})
        )
      FOR UPDATE SKIP LOCKED  -- Prevents race conditions
    `;

    if (overlapping.length > 0) {
      throw new Error('Resource already booked');
    }

    // Create reservation atomically
    return await tx.reservation.create({ data });
  });
}
```

**Why `FOR UPDATE SKIP LOCKED`**:
- Locks only conflicting rows, not entire table
- `SKIP LOCKED` allows concurrent reservations for different time slots
- Prevents race condition where two requests check availability simultaneously
- Re-checking availability inside transaction is CRITICAL - prevents time-of-check to time-of-use bugs

**Three overlap scenarios to detect**:
```
Scenario 1: New reservation starts during existing
  Existing: [====]
  New:         [====]
  Check: startTime <= newStart AND endTime > newStart

Scenario 2: New reservation ends during existing
  Existing:    [====]
  New:      [====]
  Check: startTime < newEnd AND endTime >= newEnd

Scenario 3: New reservation encompasses existing
  Existing:   [==]
  New:      [======]
  Check: startTime >= newStart AND endTime <= newEnd
```

#### Chile Timezone Handling

**Context**: All datetime operations must respect Chile timezone (`America/Santiago`) for:
- Day-of-week calculations (ResourceAvailability matching)
- Email formatting
- User-facing date displays

```typescript
// Extract day-of-week in Chile timezone for availability matching
const dayOfWeek = new Date(
  startTime.toLocaleString('en-US', { timeZone: 'America/Santiago' })
).getDay();  // 0-6 (Sunday-Saturday)

// Format times for availability checking (HH:MM format)
const timeStr = startTime.toLocaleTimeString('en-US', {
  timeZone: 'America/Santiago',
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
});  // Returns "14:00"

// Format dates for email templates
const formattedDate = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  dateStyle: 'full',
}).format(startTime);  // "lunes, 9 de febrero de 2026"
```

**Storage vs Display**:
- **Store**: Always UTC in PostgreSQL (Prisma handles this automatically)
- **Convert to Chile timezone only for**:
  - Day-of-week matching with ResourceAvailability
  - Email templates
  - User-facing displays
- **Never convert for**: Database queries, date comparisons, duration calculations (use UTC)

**Common pitfall**: Don't extract day-of-week from UTC date - it may be a different day in Chile!
```typescript
// ❌ Wrong - may be wrong day in Chile timezone
const dayOfWeek = startTime.getDay();

// ✅ Correct - respects Chile timezone
const dayOfWeek = new Date(
  startTime.toLocaleString('en-US', { timeZone: 'America/Santiago' })
).getDay();
```

## Common Patterns

### Form Handling

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema } from '@/lib/validations/auth';

export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: z.infer<typeof LoginSchema>) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Handle error
      return;
    }

    // Handle success
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Server Actions

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { BookingSchema } from '@/lib/validations/booking';

export async function createBooking(formData: FormData) {
  // 1. Get current user (from session)
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // 2. Validate input
  const result = BookingSchema.safeParse({
    studioId: formData.get('studioId'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
  });

  if (!result.success) {
    return { error: 'Invalid input' };
  }

  // 3. Create booking
  try {
    const booking = await db.booking.create({
      data: {
        ...result.data,
        userId: user.id,
      },
    });

    // 4. Revalidate and return
    revalidatePath('/dashboard/bookings');
    return { success: true, booking };

  } catch (error) {
    return { error: 'Failed to create booking' };
  }
}
```

## Environment Setup

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/reservapp"

# Authentication
JWT_SECRET="generate-strong-random-secret"
SESSION_SECRET="generate-strong-random-secret"

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN="your-access-token"
MERCADOPAGO_PUBLIC_KEY="your-public-key"
MERCADOPAGO_WEBHOOK_SECRET="your-webhook-secret"

# Email (Resend)
RESEND_API_KEY="your-api-key"
EMAIL_FROM="noreply@yourdomain.com"

# Redis
REDIS_URL="redis://localhost:6379"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
TZ="America/Santiago"
```

## Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Redis connection established
- [ ] Email service tested
- [ ] Payment gateway in production mode
- [ ] SSL/TLS certificates configured
- [ ] CORS policies configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Backups configured
- [ ] Monitoring enabled

## Git Workflow

### ⚠️ MANDATORY: Branch Creation Rule

**Every task MUST be worked on in a separate branch. Never work directly on master/main.**

### Branch Naming Convention

Format: `type_of_task/RES-X-task-title`

Where:
- `type_of_task` = `feature` or `fix`
- `RES-X` = Jira task code (e.g., RES-3, RES-15)
- `task-title` = Brief, kebab-case description

**Examples:**
- ✅ `feature/RES-3-initialize-nextjs-project`
- ✅ `feature/RES-7-user-registration-api`
- ✅ `fix/RES-15-auth-token-expiration`
- ✅ `fix/RES-28-booking-validation-error`
- ❌ `feature/add-login` (missing RES code)
- ❌ `RES-7` (missing type and description)
- ❌ `feature/RES-7` (missing description)

**How to create a branch:**
```bash
# From master/main branch
git checkout master
git pull origin master

# Create and switch to new branch
git checkout -b feature/RES-X-task-title

# Or for fixes
git checkout -b fix/RES-X-task-title
```

### Commit Strategy

**IMPORTANT: Make small, incremental commits as you work.**

#### Commit Frequency Best Practices:
- ✅ Commit after completing each logical unit of work
- ✅ Commit when a single feature/function is working
- ✅ Commit after fixing a specific issue
- ✅ Commit after adding tests
- ✅ Commit after updating documentation
- ❌ Do NOT wait until the entire task is done
- ❌ Do NOT commit broken/non-compiling code
- ❌ Do NOT commit multiple unrelated changes together

**Examples of good commit points:**
```bash
# After creating database schema
git add prisma/schema.prisma
git commit -m "feat(database): add User schema with auth fields (RES-4)"

# After adding validation
git add src/lib/validations/auth.ts
git commit -m "feat(auth): add user registration validation schema (RES-7)"

# After implementing API endpoint
git add src/app/api/auth/register/route.ts
git commit -m "feat(auth): implement user registration API endpoint (RES-7)"

# After adding tests
git add src/app/api/auth/register/route.test.ts
git commit -m "test(auth): add registration endpoint tests (RES-7)"
```

### Commit Message Format

Use conventional commits format:

```
<type>(<scope>): <description> (RES-X)

[optional body with bullet points]

[optional Related: RES-Y, RES-Z]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding tests
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(auth): implement JWT authentication (RES-7)

fix(booking): resolve timezone conversion error (RES-25)

refactor(database): optimize booking queries (RES-18)

test(payment): add MercadoPago integration tests (RES-31)

docs(readme): update setup instructions (RES-3)
```

### Before Committing
- [ ] Code follows style guidelines (Prettier)
- [ ] No linting errors (ESLint)
- [ ] TypeScript compiles without errors
- [ ] Tests pass (if applicable)
- [ ] No sensitive data committed
- [ ] Commit message follows format
- [ ] Changes are focused and logical

### Pull Request (PR) Requirements

**MANDATORY: Every completed task requires a Pull Request for review before merging to master.**

#### When to Create a PR:
- ✅ When the task is fully complete and tested
- ✅ After all commits are pushed to the feature/fix branch
- ✅ Before marking the Jira task as "Done"
- ❌ Do NOT merge directly to master without a PR
- ❌ Do NOT create PRs for incomplete work

#### PR Creation Process:

```bash
# 1. Ensure all changes are committed
git status

# 2. Push your branch to remote
git push -u origin feature/RES-X-task-title

# 3. Create PR using GitHub CLI (or via GitHub web interface)
gh pr create --base master --head feature/RES-X-task-title \
  --title "[RES-X] Task Title" \
  --body "$(cat <<'EOF'
## Summary
Brief description of what this PR accomplishes

## Changes
- List of key changes made
- Files affected
- New features added

## Testing
- [ ] Manual testing completed
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Dev server runs without errors

## Related Issues
Closes RES-X
Related: Epic RES-Y

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows project guidelines (CLAUDE.md)
- [ ] No linting errors
- [ ] TypeScript compiles
- [ ] Documentation updated
- [ ] Commit messages follow convention
EOF
)"
```

#### PR Title Format:
```
[RES-X] Brief description of changes
```

**Examples:**
- `[RES-3] Initialize Next.js 14 project with TypeScript`
- `[RES-7] Implement user registration API with email verification`
- `[RES-15] Fix authentication token expiration issue`

#### PR Description Requirements:
1. **Summary**: What the PR accomplishes
2. **Changes**: List of key changes and files affected
3. **Testing**: How the changes were tested
4. **Related Issues**: Link to Jira tasks (e.g., "Closes RES-X")
5. **Checklist**: Verification items completed

#### Review Process:
- PRs require at least one approval before merging
- Address all review comments
- Keep discussions in PR comments
- Request re-review after making changes
- Squash commits if needed before merging

#### After PR Approval:
```bash
# Merge via GitHub interface (preferred)
# Or via CLI:
gh pr merge --squash --delete-branch
```

## Performance Considerations

- Use React Server Components by default
- Add 'use client' only when needed
- Implement proper loading states
- Use Suspense for async components
- Optimize images with next/image
- Implement proper caching strategies
- Use database indexes appropriately
- Implement rate limiting on APIs

## Accessibility

- Use semantic HTML elements
- Add proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper color contrast
- Add alt text to images
- Use proper heading hierarchy

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zod Documentation](https://zod.dev)

## Notes for Claude Code

When working on tasks:
1. **Read Jira task description completely** - Fetch and understand requirements
2. **Transition Jira to "In Progress"** - Update status as soon as work begins
3. **ALWAYS create a new branch first** using format: `feature/RES-X-task-title` or `fix/RES-X-task-title`
4. Use TodoWrite to track progress through subtasks
5. Read existing files before making changes
6. **Make small, incremental commits as you work** - don't wait until the end
   - Commit after each logical unit of work (file, function, feature)
   - Use conventional commit format: `type(scope): description (RES-X)`
   - Push commits regularly
7. Test changes immediately after implementing
8. Follow the patterns established in this guide
9. Keep solutions simple and focused on requirements
10. **Add Jira comment** documenting what was accomplished
    - Summarize implementation
    - List key changes and files
    - Include technical notes
11. **When task is complete, create a Pull Request** with:
    - Title: `[RES-X] Task Title`
    - Comprehensive description of changes
    - Link to Jira task
12. **Transition Jira to "In Review"** after creating PR
13. **Transition Jira to "Done"** after PR is merged
14. Ask questions if requirements are unclear

Remember:
- **Never work directly on master/main branch**
- **Always commit in small increments** - don't make one giant commit at the end
- **Every task MUST have a Pull Request for review** before merging
- **Keep Jira status updated**: To Do → In Progress → In Review → Done
- Quality over speed. It's better to implement correctly than quickly.

---

## 🚀 Quick Reference Card

### Essential Commands (Run Before Every Commit)

```bash
npm install              # Install/update dependencies
npm run db:generate      # Generate Prisma types
npm run lint            # Check code style
npm run type-check      # Check TypeScript types
npm test                # Run all tests
npm run build           # Verify build works
```

### Common CI Fixes

| Error Message | Cause | Fix |
|--------------|-------|-----|
| `npm ci requires package-lock.json` | Lock file not committed | Remove from `.gitignore` and commit |
| `Module has no exported member 'PrismaClient'` | Types not generated | Add `npm run db:generate` to CI before type-check |
| `Unsupported engine: node 18.x` | Node version too old | Update CI to Node 20.x+ |
| `Converting circular structure to JSON` | ESLint 9 incompatibility | Downgrade to ESLint 8.x + eslint-config-next 14.x |
| `Cannot assign to 'NODE_ENV'` | Read-only property in tests | Use `(process.env as any).NODE_ENV = 'test'` |
| `Could not find declaration file` | Missing @types package | Install `@types/package-name` |

### Testing Checklist

```bash
# Before writing tests:
✅ Install vitest and testing libraries
✅ Create vitest.config.ts
✅ Create vitest.setup.ts
✅ Add test scripts to package.json
✅ Verify `npm test` runs (even with 0 tests)

# When writing tests:
✅ Mock database with vi.mock()
✅ Include ALL Prisma model fields in mocks
✅ Use (process.env as any) for env vars
✅ Install @types/package-name for type definitions
✅ Test runs locally before committing
```

### CI/CD Pipeline Order

```yaml
1. Checkout code
2. Setup Node.js 20.x/22.x
3. Install dependencies (npm ci)
4. Generate Prisma types ← CRITICAL, often forgotten
5. Lint
6. Type check
7. Test
8. Build
```

### Dependency Management

```bash
# Check Node requirements before installing
npm info package-name engines

# Install stable versions (not latest)
npm install package@8  # Not package@latest

# After adding dependencies:
git add package.json package-lock.json
npm run build  # Verify everything still works
```

### Git Workflow

```bash
# Start new task
git checkout master
git pull origin master
git checkout -b feature/RES-X-task-title

# Work in small commits
git add <files>
git commit -m "type(scope): description (RES-X)"
git push origin feature/RES-X-task-title

# After each commit, run locally:
npm run lint && npm run type-check && npm test
```

### When Things Break

1. **Read the FULL error message** - don't guess
2. **Check this document** - common issues are documented above
3. **Run commands locally** - reproduce the CI failure
4. **Fix root cause** - not symptoms
5. **Test the fix** - run all checks before pushing

### Remember

- ✅ Commit `package-lock.json` (NEVER ignore it)
- ✅ Run `db:generate` after schema changes
- ✅ Test locally before pushing to CI
- ✅ Use stable dependency versions (N-1)
- ✅ Check Node.js requirements when upgrading
- ✅ Small commits > one giant commit
- ✅ Read error messages completely

---

**Last Updated:** 2026-02-07 - Updated test coverage status (214 tests), added reservation double-booking prevention patterns, enhanced Prisma mock type assertion documentation based on RES-70 implementation experience.
