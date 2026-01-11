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
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 18.17+
- **Package Manager**: npm

### Frontend
- **UI Library**: React 19+
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form
- **Validation**: Zod

### Backend
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Session Store**: Redis
- **Email**: Resend
- **Payment Gateway**: MercadoPago

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

### Unit Tests
- Test business logic in /lib/services
- Test validation schemas
- Test utility functions

### Integration Tests
- Test API routes
- Test database operations
- Test authentication flow

### E2E Tests
- Test critical user flows
- Test booking process
- Test payment integration

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
