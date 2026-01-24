# Complete Claude Code Prompts - Ready for Jira

Copy and paste these prompts directly into your Jira task descriptions.

---

# Complete Claude Code Prompts - Ready for Jira

Copy and paste these prompts directly into your Jira task descriptions.

---

## RES-2: [Story] Project Setup and Infrastructure

### Claude Code Prompt

```
This is a Story (parent task) that encompasses RES-3, RES-4, and RES-5.

Complete these child tasks in order:
1. RES-3: Initialize Next.js 14 project
2. RES-4: Configure Prisma ORM with PostgreSQL
3. RES-5: Setup shadcn/ui component library

After completing all three tasks:
- Verify npm run dev starts successfully
- Verify database connection works
- Verify UI components render correctly
- Commit initial project setup to git

This establishes the foundation for all future development.
```

---

## RES-6: [Story] User Registration System

### Claude Code Prompt

```
This is a Story (parent task) that encompasses RES-7, RES-8, and RES-9.

Complete these child tasks in order:
1. RES-7: Create user registration API endpoint
2. RES-8: Build user registration form UI  
3. RES-9: Implement email verification system

After completing all three tasks:
- Test complete registration flow end-to-end
- Verify user can register, receive email, and verify
- Verify validation works on both client and server
- Test error cases (duplicate email, invalid data)

This completes the user registration feature.
```

---

## RES-10: [Story] User Login System

### Claude Code Prompt

```
This is a Story (parent task) that encompasses RES-11 and RES-12.

Complete these child tasks in order:
1. RES-11: Implement login API with JWT sessions
2. RES-12: Build user login form UI

After completing both tasks:
- Test complete login flow end-to-end
- Verify JWT token is set correctly
- Verify session persists across page refreshes
- Test error cases (wrong password, unverified email)
- Verify forgot password link is functional

This completes the user login feature.
```

---

## RES-52: [Story] Password Recovery System  

### Claude Code Prompt

```
This is a Story (parent task) that encompasses RES-53 and RES-54.

Complete these child tasks in order:
1. RES-53: Implement forgot password flow
2. RES-54: Implement password reset flow

After completing both tasks:
- Test complete password recovery flow end-to-end
- User can request reset, receive email, set new password
- Verify token expiry works (1 hour)
- Test rate limiting (3 requests per hour)
- Verify user can log in with new password

This completes the password recovery feature.
```

---

## RES-55: [Story] User Profile Management

### Claude Code Prompt

```
This is a Story (parent task) for RES-56.

Complete child task:
1. RES-56: User profile view and edit functionality

After completing the task:
- Test profile view and edit flow
- Verify name updates work
- Verify email change triggers re-verification
- Test validation on profile updates
- Verify changes persist in database

This completes the user profile management feature.
```

---

## RES-30: [Auth] Implement forgot password flow

### Claude Code Prompt

```
Implement forgot password functionality (same as RES-53):

1. Verify User model has resetToken fields (added in RES-4):
   - resetToken (String?, @unique)
   - resetTokenExpiry (DateTime?)
   - If missing, add to schema and run migration

2. Create forgot password API at src/app/api/auth/forgot-password/route.ts:
   - Accept POST requests
   - Validate email with Zod: z.object({ email: z.string().email() })
   - Find user by email in database
   - If user not found: still return success (security - don't reveal if email exists)
   - If user found:
     - Generate reset token (JWT with 1 hour expiry)
     - Store resetToken and resetTokenExpiry (1 hour from now) in database
     - Send reset email (placeholder for now, implement in RES-65)
     - Log: console.log('Reset URL:', `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`)
   - Always return: { success: true, message: 'If email exists, reset link sent' }
   - Apply rate limiting: 3 requests per hour per email

3. Create forgot password page at src/app/(auth)/forgot-password/page.tsx:
   - Simple form with email input
   - Submit to POST /api/auth/forgot-password
   - On success: show message 'Check your email for reset link'
   - Link back to login page

4. Create ForgotPasswordForm component:
   - Single email field
   - React Hook Form with email validation
   - Loading state during submission
   - Success state with message
   - 'Back to Login' link

5. Rate limiting implementation:
   - Track by email address (not IP)
   - Store in Map: email -> array of timestamps
   - Allow max 3 requests per hour
   - Return 429 if exceeded
   - Clean up old entries periodically

6. Security considerations:
   - Always return same response (success) whether email exists or not
   - Token is single-use (will be cleared on password reset)
   - Token expires in 1 hour
   - Use cryptographically secure token generation

7. Test the flow:
   - Submit with valid email
   - Check console for reset URL
   - Verify resetToken stored in database
   - Test with non-existent email (should still show success)
   - Test rate limiting (4th request should fail)
   - Verify token expiry timestamp
```

### Files to Create
- src/app/api/auth/forgot-password/route.ts
- src/app/(auth)/forgot-password/page.tsx
- src/components/features/auth/ForgotPasswordForm.tsx

### Definition of Done
- Generates valid reset tokens
- Tokens expire after 1 hour
- Rate limiting works (3 per hour per email)
- Always returns success message
- Token stored in database
- Form is user-friendly

---

## RES-31: [Auth] Implement password reset flow

### Claude Code Prompt

```
Implement password reset functionality (same as RES-54):

1. Create API route at src/app/api/auth/reset-password/route.ts:
   - Accept POST with { token, newPassword }
   - Find user by resetToken
   - Check token not expired (resetTokenExpiry > now)
   - Validate new password with Zod (same rules as registration)
   - Hash new password with bcrypt
   - Update user: passwordHash = hashed, clear resetToken and resetTokenExpiry
   - Return success response

2. Create reset password page at src/app/(auth)/reset-password/page.tsx:
   - Get token from URL query params
   - Form with: newPassword, confirmPassword fields
   - Validate passwords match
   - Submit to API
   - Show success and redirect to login
   - Handle expired/invalid token errors

3. Create ResetPasswordForm component:
   - Two password fields with visibility toggle
   - Password strength indicator
   - Validate passwords match
   - Submit to POST /api/auth/reset-password

4. Test: valid token works, expired token fails, password updated in DB
```

### Files to Create
- src/app/api/auth/reset-password/route.ts
- src/app/(auth)/reset-password/page.tsx
- src/components/features/auth/ResetPasswordForm.tsx

### Definition of Done
- Valid token allows password reset
- Expired/invalid token shows error
- Password updated successfully
- User can log in with new password

---

## RES-32: [Story] User Profile Management

### Claude Code Prompt

```
This is a Story (parent task) for RES-33.

Complete child task:
1. RES-33: User profile view and edit functionality

After completing the task:
- Test profile view and edit flow
- Verify name updates work
- Verify email change triggers re-verification
- Test validation on profile updates
- Verify changes persist in database

This completes the user profile management feature.
```

---

## RES-33: [Profile] User profile view and edit

### Claude Code Prompt

```
Create user profile management (same as RES-56):

1. Create src/app/api/user/profile/route.ts:
   - GET: Return current user from session (without password)
   - PATCH: Update name and/or email
   - If email changes: set emailVerified=false, generate new token, send verification

2. Create src/app/dashboard/profile/page.tsx:
   - Display user info (name, email, verification status)
   - "Edit Profile" button opens form

3. Create ProfileEditForm component:
   - Pre-populate with current data
   - Validate with Zod
   - Submit to PATCH /api/user/profile
   - Show success message
   - If email changed: show "Please verify new email"

4. Test: name update works, email change triggers verification
```

### Files to Create
- src/app/api/user/profile/route.ts
- src/app/dashboard/profile/page.tsx
- src/components/features/profile/ProfileEditForm.tsx

### Definition of Done
- User can view profile
- User can update name
- Email change triggers re-verification
- Changes saved to database

---

## RES-54: [Auth] Implement password reset flow

### Claude Code Prompt

```
Implement password reset functionality:

1. Create API route at src/app/api/auth/reset-password/route.ts:
   - Accept POST with { token, newPassword }
   - Find user by resetToken
   - Check token not expired (resetTokenExpiry > now)
   - Validate new password with Zod (same rules as registration)
   - Hash new password with bcrypt
   - Update user: passwordHash = hashed, clear resetToken and resetTokenExpiry
   - Return success response

2. Create reset password page at src/app/(auth)/reset-password/page.tsx:
   - Get token from URL query params
   - Form with: newPassword, confirmPassword fields
   - Validate passwords match
   - Submit to API
   - Show success and redirect to login
   - Handle expired/invalid token errors

3. Create ResetPasswordForm component
4. Test: valid token works, expired token fails, password updated in DB
```

---

## RES-56: [Profile] User profile view and edit

### Claude Code Prompt

```
Create user profile management:

1. Create src/app/api/user/profile/route.ts:
   - GET: Return current user from session (without password)
   - PATCH: Update name and/or email
   - If email changes: set emailVerified=false, generate new token, send verification

2. Create src/app/dashboard/profile/page.tsx:
   - Display user info (name, email, verification status)
   - "Edit Profile" button opens form

3. Create ProfileEditForm component:
   - Pre-populate with current data
   - Validate with Zod
   - Submit to PATCH /api/user/profile
   - Show success message
   - If email changed: show "Please verify new email"

4. Test: name update works, email change triggers verification
```

---

## RES-16: [Payment] Define subscription plans in database

### Claude Code Prompt

```
Create subscription plan management with Prisma models:

1. Update prisma/schema.prisma - Add these models:

model SubscriptionPlan {
  id          String   @id @default(cuid())
  name        String
  description String
  price       Int      // in CLP cents (9990 = $9.990 CLP)
  interval    String   @default("monthly")
  features    Json
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  subscriptions Subscription[]
}

model Subscription {
  id                   String    @id @default(cuid())
  userId               String    @unique
  user                 User      @relation(fields: [userId], references: [id])
  planId               String
  plan                 SubscriptionPlan @relation(fields: [planId], references: [id])
  mercadopagoSubId     String?   @unique
  preferenceId         String?
  status               String    // active, cancelled, suspended, past_due, pending
  planPrice            Int
  nextBillingDate      DateTime
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  gracePeriodEnd       DateTime?
  cancelledAt          DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  
  payments Payment[]
}

model Payment {
  id             String    @id @default(cuid())
  userId         String
  user           User      @relation(fields: [userId], references: [id])
  subscriptionId String?
  subscription   Subscription? @relation(fields: [subscriptionId], references: [id])
  mercadopagoId  String    @unique
  amount         Int
  penaltyFee     Int       @default(0)
  totalAmount    Int
  status         String
  dueDate        DateTime
  paidAt         DateTime?
  metadata       Json?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

2. Run migration:
   - npx prisma migrate dev --name add_subscription_models

3. Create seed file at prisma/seed.ts:
   - Import PrismaClient
   - Create Basic plan: 9990 CLP, ["10 reservas/mes", "Soporte email", "Analiticas basicas"]
   - Create Pro plan: 19990 CLP, ["Reservas ilimitadas", "Soporte prioritario", "Analiticas avanzadas", "API"]
   - Use upsert to avoid duplicates
   - Add to package.json: "prisma": { "seed": "tsx prisma/seed.ts" }

4. Create GET /api/subscription-plans:
   - Query active plans (isActive = true)
   - Order by price ascending
   - Return formatted plans

5. Create src/lib/utils/format.ts:
   - formatCLP function to convert cents to readable CLP format

6. Run seed and test endpoint
```

---

## RES-17: [Payment] Create subscription payment preference

### Claude Code Prompt

```
Implement MercadoPago subscription creation:

1. Update src/lib/services/mercadopago.service.ts:
   - Implement createSubscriptionPreference(planId, userId, planPrice):
     - Create preapproval (recurring payment)
     - Set frequency: 1 month
     - Set amount in CLP
     - Add back URLs for success/failure/pending
     - Return preference with init_point

2. Create src/app/api/subscriptions/create-preference/route.ts (POST):
   - Get current user from session
   - Validate user doesn't have active subscription
   - Find plan by planId
   - Create subscription record with status="pending"
   - Call mercadopago.createSubscriptionPreference()
   - Store preferenceId in subscription
   - Return { init_point, subscriptionId }

3. Handle errors: already has subscription, plan not found, MP API error

4. Test: creates preference, returns checkout URL, subscription in DB
```

---

## RES-18: [Payment] Implement webhook handler

### Claude Code Prompt

```
Create MercadoPago webhook handler:

1. Add WebhookEvent model to prisma/schema.prisma:
   - id, eventType, eventId (unique), data (Json), processed, createdAt
   - Run migration

2. Create src/lib/services/webhook-handlers.service.ts:
   - handlePaymentCreated(data): log event
   - handlePaymentUpdated(data): if approved -> activate subscription
   - handleSubscriptionCreated(data): store mercadopagoSubId
   - handleSubscriptionUpdated(data): update status

3. Create src/app/api/webhooks/mercadopago/route.ts (POST):
   - Verify signature with MERCADOPAGO_WEBHOOK_SECRET
   - Check if event already processed (use eventId)
   - Log event in WebhookEvent table
   - Route to appropriate handler based on event type
   - Mark as processed
   - Always return 200 OK

4. Test: send test webhook, verify logged, handler called
```

---

## RES-19: [Payment] Activate subscription on payment success

### Claude Code Prompt

```
Implement subscription activation:

1. In src/lib/services/webhook-handlers.service.ts:
   - In handlePaymentUpdated, when status === "approved":
     - Find subscription by mercadopagoId or userId
     - Create Payment record with status="approved"
     - Update Subscription:
       - status = "active"
       - currentPeriodStart = now
       - currentPeriodEnd = now + 1 month
       - nextBillingDate = now + 1 month
     - Send subscription activated email (placeholder)

2. Test: webhook with approved payment activates subscription
3. Verify: subscription status="active", dates set correctly
```

---

## RES-25: [Email] Setup Resend and React Email

### Claude Code Prompt

```
Configure email service:

1. Install: npm install resend react-email @react-email/components

2. Create src/lib/email/client.ts:
   - Initialize Resend with RESEND_API_KEY
   - Export resend instance

3. Create src/lib/email/send-email.ts:
   - sendEmail function with parameters: to, subject, react component, userId, type
   - Use resend.emails.send()
   - Log to EmailLog table (add model if needed)
   - Handle errors gracefully

4. Setup React Email:
   - Create emails/ directory
   - Add "email:preview": "email dev" to package.json

5. Create emails/test-email.tsx as template example

6. Add env: RESEND_API_KEY, EMAIL_FROM

7. Test: send test email, check received, verify EmailLog
```

---

## RES-26: [Penalty] Penalty calculation service

### Claude Code Prompt

```
Create penalty fee calculation:

1. Create src/lib/services/penalty.service.ts:
   - calculatePenalty(baseAmount, dueDate, currentDate):
     - Grace period: 2 days (no penalty)
     - Base penalty: 5% of amount
     - Daily penalty: +0.5% per day after grace
     - Max penalty: 50% of base amount
     - Formula: baseAmount * (0.05 + daysLate * 0.005)
     - Return penalty in cents

2. Add tests for various scenarios:
   - 0 days late: 0 penalty
   - 1-2 days late: 0 penalty (grace)
   - 3 days late: 5% penalty
   - 5 days late: 5% + 1.5% = 6.5%
   - Very late: capped at 50%

3. Export types: PenaltyCalculation interface
```

---

## RES-27: [Reservation] Database schema

### Claude Code Prompt

```
Create reservation database models:

1. Update prisma/schema.prisma - Add models:

model Resource {
  id          String   @id @default(cuid())
  name        String
  description String
  type        String   // room, equipment, service
  capacity    Int?
  isActive    Boolean  @default(true)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  reservations Reservation[]
  availability ResourceAvailability[]
}

model Reservation {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  resourceId  String
  resource    Resource @relation(fields: [resourceId], references: [id])
  title       String?
  description String?
  startTime   DateTime
  endTime     DateTime
  status      String   // pending, confirmed, cancelled, completed
  attendees   Int      @default(1)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId])
  @@index([resourceId])
  @@index([startTime, endTime])
}

model ResourceAvailability {
  id          String   @id @default(cuid())
  resourceId  String
  resource    Resource @relation(fields: [resourceId], references: [id])
  dayOfWeek   Int      // 0-6 (Sunday-Saturday)
  startTime   String   // HH:MM format
  endTime     String   // HH:MM format
  isActive    Boolean  @default(true)
  
  @@index([resourceId])
}

2. Run migration: npx prisma migrate dev --name add_reservation_models
3. Verify tables created
```

---

## RES-57: [Payment] Handle payment failure

### Claude Code Prompt

```
Handle failed payments and suspension:

1. In webhook-handlers.service.ts, add handlePaymentRejected:
   - Create Payment record with status="rejected"
   - Count consecutive failed payments for subscription
   - Update subscription based on failure count:
     - 1st failure: status="past_due", send retry notification
     - 2nd failure: status="past_due", send urgent notification  
     - 3rd failure: status="suspended", send suspension notification

2. Update middleware to block suspended users from /reservations

3. Test: 3 failed payments suspends subscription, access blocked
```

---

## RES-58: [Payment] Build checkout UI

### Claude Code Prompt

```
Create subscription checkout flow:

1. Create src/app/dashboard/subscribe/page.tsx:
   - Fetch plans from GET /api/subscription-plans
   - Display in grid of PlanCard components
   - Each card shows: name, price, features, Subscribe button

2. Create PlanCard component:
   - Shows plan details
   - Highlights recommended plan
   - Subscribe button

3. Create SubscribeButton component:
   - onClick: call POST /api/subscriptions/create-preference
   - On success: redirect to init_point (MercadoPago)
   - Show loading spinner
   - Handle errors

4. Style with shadcn/ui Cards, responsive grid
```

---

## RES-59: [Payment] Callback pages

### Claude Code Prompt

```
Create payment callback pages:

1. src/app/subscription/callback/success/page.tsx:
   - Show "Payment Successful!" message
   - Display subscription details
   - "Go to Dashboard" button
   - Auto-redirect after 3 seconds

2. src/app/subscription/callback/failure/page.tsx:
   - Show "Payment Failed" message
   - List possible reasons
   - "Try Again" and "Contact Support" buttons

3. src/app/subscription/callback/pending/page.tsx:
   - Show "Payment Pending" message
   - "Processing..." indicator
   - "Go to Dashboard" button

4. Use consistent styling, appropriate icons
```

---

## RES-60: [Subscription] Display subscription details

### Claude Code Prompt

```
Show user's subscription information:

1. Create GET /api/subscriptions/current:
   - Return user's subscription with plan and recent payments

2. Create src/app/dashboard/subscription/page.tsx:
   - Display subscription card with:
     - Plan name and price
     - Status badge (colored by status)
     - Next billing date
     - Cancel button (if active)

3. Create SubscriptionDetails component
4. Create PaymentHistory component (table of last 12 payments)

5. Format dates in Chile timezone, prices in CLP
```

---

## RES-61: [Subscription] Cancel subscription

### Claude Code Prompt

```
Allow subscription cancellation:

1. Create POST /api/subscriptions/cancel:
   - Get user's subscription
   - Call mercadopago.cancelSubscription(mercadopagoSubId)
   - Update: status="cancelled", cancelledAt=now
   - Keep currentPeriodEnd (access until then)
   - Send cancellation email

2. Create CancelSubscriptionModal component:
   - Show consequences (lose access after period end)
   - Require confirmation checkbox
   - "Cancel" and "Keep" buttons

3. Add cancel button to subscription page (only if active)

4. Test: cancels in MP, updates DB, access continues until period end
```

---

## RES-62: [Subscription] Change plans

### Claude Code Prompt

```
Implement plan upgrade/downgrade:

1. Create POST /api/subscriptions/change-plan:
   - Accept { newPlanId }
   - Calculate if upgrade or downgrade
   - Upgrade: charge pro-rated amount immediately, update now
   - Downgrade: schedule for next billing period
   - Update mercadopago subscription

2. Create ChangePlanModal:
   - Show current vs new plan comparison
   - Display price difference
   - Show pro-rated amount (upgrades)
   - Show effective date (downgrades)
   - Require confirmation

3. Test: upgrade works with pro-rating, downgrade scheduled correctly
```

---

## RES-63: [Subscription] Reactivate subscription

### Claude Code Prompt

```
Allow reactivation of cancelled/suspended:

1. Create POST /api/subscriptions/reactivate:
   - Verify subscription is cancelled or suspended
   - Create new payment preference (not recurring yet)
   - Return init_point for checkout
   - On webhook payment success: reactivate

2. Update webhook handler for reactivation payments

3. Update subscription page:
   - Show "Reactivate" button for cancelled/suspended
   - Redirect to payment on click

4. Test: payment required, subscription reactivates on success
```

---

## RES-64: [Subscription] Grace period

### Claude Code Prompt

```
Implement 3-day grace period:

1. In webhook payment failure handler:
   - Set status="past_due"
   - Set gracePeriodEnd = now + 3 days
   - Queue daily reminder emails (days 1, 2, 3)

2. Update middleware:
   - Allow access if status="past_due" AND gracePeriodEnd > now
   - Block if grace period expired

3. Create worker: src/workers/check-grace-periods.ts
   - Daily job at 10 AM Chile time
   - Find expired grace periods
   - Update status="suspended"
   - Send suspension email

4. Test: access allowed during grace, blocked after expiry
```

---

## RES-65: [Email] Create email templates

### Claude Code Prompt

```
Create all email templates with React Email:

1. Create in emails/ directory:
   - verify-email.tsx: verification button, 24h expiry notice
   - password-reset.tsx: reset button, 1h expiry, security notice
   - payment-reminder.tsx: amount due, due date, payment button, days until (7/3/1)
   - payment-overdue.tsx: overdue notice, penalty breakdown, grace period
   - payment-success.tsx: confirmation, receipt details, next billing
   - subscription-activated.tsx: welcome, plan details, next steps
   - subscription-cancelled.tsx: confirmation, access until date, reactivation
   - subscription-suspended.tsx: suspension notice, reactivation instructions

2. Use @react-email/components for consistent styling
3. Make mobile responsive
4. Include brand colors and logo
5. Test in email preview (npm run email:preview)
```

---

## RES-66: [Email] Integrate email sending

### Claude Code Prompt

```
Integrate emails into application flows:

1. Update EmailLog model if needed (id, userId, type, recipient, status, error)

2. Update auth flows:
   - Registration: send verify-email
   - Forgot password: send password-reset
   - Email change: send verify-email

3. Update subscription flows:
   - Payment approved: send payment-success + subscription-activated
   - Payment failed: send payment-failed
   - Cancelled: send subscription-cancelled
   - Suspended: send subscription-suspended

4. Implement sendEmail utility with logging
5. Test: emails sent at correct times, logged in DB
```

---

## RES-67: [Email] Payment reminders scheduler

### Claude Code Prompt

```
Schedule automated payment reminders:

1. Install: npm install bullmq ioredis

2. Create src/lib/queue/redis.ts: initialize Redis connection

3. Create src/lib/queue/email-queue.ts: create BullMQ queue

4. Create src/workers/payment-reminders.ts:
   - Daily job at 9 AM Chile time
   - Find subscriptions with nextBillingDate in 7, 3, or 1 days
   - Check EmailLog to avoid duplicates
   - Queue reminder emails

5. Create src/workers/email-worker.ts: process email queue

6. Create src/lib/queue/setup-jobs.ts: schedule recurring jobs

7. Initialize in app startup

8. Test: job runs daily, emails queued correctly
```

---

## RES-68: [Penalty] Auto-apply penalties

### Claude Code Prompt

```
Automatically apply penalties to late payments:

1. Create src/workers/apply-penalties.ts:
   - Daily job at 10 AM Chile time
   - Find payments where dueDate + grace period < now AND penaltyFee = 0
   - Calculate penalty using penalty.service
   - Update payment: penaltyFee, totalAmount
   - Update subscription: status="past_due"
   - Queue penalty notification email

2. Add to job scheduler

3. Test: overdue payment gets penalty, idempotent (doesn't apply twice)
```

---

## RES-69: [Penalty] Payment with penalties

### Claude Code Prompt

```
Handle penalty payment processing:

1. Update mercadopago.service:
   - createPenaltyPaymentPreference(payment): one-time payment with totalAmount

2. Update webhook handler:
   - On penalty payment approved: update payment status, reactivate subscription

3. Update subscription page:
   - Show OverduePaymentCard with amount + penalty breakdown
   - "Pay Now" button creates preference and redirects

4. Test: payment includes penalty, clears on payment, subscription reactivates
```

---

## RES-70: [Reservation] Create booking API

### Claude Code Prompt

```
Implement reservation creation:

1. Create src/lib/services/reservation.service.ts:
   - checkAvailability(resourceId, startTime, endTime): check resource exists, check schedule, check conflicts
   - createReservation(userId, data): validate, check availability, create in DB

2. Create POST /api/reservations:
   - Get current user
   - Verify active subscription
   - Validate: startTime future, endTime after start, max 4 hours, within 14 days
   - Check availability
   - Create reservation with status="confirmed"
   - Send confirmation email
   - Rate limit: 10/day per user

3. Create src/lib/validations/reservation.ts: Zod schema

4. Test: creates reservation, prevents double-booking, checks subscription
```

---

## RES-71: [Reservation] Booking form UI

### Claude Code Prompt

```
Build reservation booking form:

1. Install: npm install react-day-picker date-fns

2. Create src/app/dashboard/reservations/new/page.tsx:
   - Resource selector dropdown
   - Date picker (next 14 days)
   - Time slot selector
   - Duration selector (30min increments, max 4h)

3. Create BookingForm component:
   - Validate before submission
   - Show success modal with reservation details

4. Create AvailabilityCalendar component:
   - Show available dates
   - Highlight/disable dates

5. Create TimeSlotSelector component:
   - Grid of time slots
   - Check availability real-time
   - Visual states: available/booked/selected

6. Test: intuitive flow, shows only available slots, mobile responsive
```

---

## RES-72: [Reservation] List reservations

### Claude Code Prompt

```
Display user reservations:

1. Update GET /api/reservations:
   - Query params: status, timeframe (upcoming/past), page, limit
   - Return user's reservations with pagination
   - Include resource details

2. Create src/app/dashboard/reservations/page.tsx:
   - Filter tabs: All, Upcoming, Past, Cancelled
   - Grid of ReservationCard components
   - Pagination controls

3. Create ReservationCard:
   - Resource name/type, date/time, duration
   - Status badge (colored)
   - Quick actions: View, Cancel

4. Create ReservationFilters component

5. Test: filters work, pagination functional, responsive
```

---

## RES-73: [Reservation] Cancel reservation

### Claude Code Prompt

```
Allow reservation cancellation:

1. Create PATCH /api/reservations/[id]/cancel:
   - Verify user owns reservation
   - Check 24-hour policy (must be >24h before start)
   - Update status="cancelled"
   - Send cancellation email

2. Create CancelReservationModal:
   - Show policy (24h before)
   - Show deadline
   - Require confirmation
   - "Cancel Reservation" and "Keep" buttons

3. Update reservation detail page with cancel button (only if confirmed and >24h away)

4. Test: cancels correctly, 24h policy enforced, email sent
```

---

## RES-28: [Admin] Role and permissions

### Claude Code Prompt

```
Implement admin role system:

1. Verify User model has isAdmin field (added in RES-4)

2. Create admin middleware in src/lib/middleware/admin.ts:
   - Check user.isAdmin === true
   - Return 403 if not admin

3. Make first user admin automatically:
   - In seed or on first registration
   - Check user count, if 1st user: set isAdmin=true

4. Create POST /api/admin/users/[id]/promote:
   - Require admin role
   - Update user.isAdmin = true

5. Protect /admin routes in middleware

6. Test: admin can access /admin, non-admin redirected
```

---

## RES-74: [Admin] Dashboard overview

### Claude Code Prompt

```
Create admin dashboard with metrics:

1. Install: npm install recharts

2. Create GET /api/admin/stats:
   - Calculate: activeSubscriptions count, MRR (sum active planPrices)
   - Payment success rate (last 30 days)
   - Upcoming reservations (next 7 days)
   - Failed payments (last 30 days)
   - Revenue by month (last 12 months)

3. Create src/app/admin/page.tsx:
   - Grid of MetricCard components
   - RevenueChart (line chart)
   - ActivityFeed (recent events)

4. Create admin layout with navigation

5. Test: metrics accurate, charts display, only admin access
```

---

## RES-75: [Admin] User management

### Claude Code Prompt

```
Create user management interface:

1. Create GET /api/admin/users:
   - Params: search, subscriptionStatus, emailVerified, page, limit
   - Return users with subscriptions

2. Create GET /api/admin/users/[id]: full user details

3. Create POST /api/admin/users/[id]/suspend: manually suspend
4. Create POST /api/admin/users/[id]/activate: manually activate

5. Create src/app/admin/users/page.tsx:
   - UserTable with columns: name, email, verified, subscription, plan, actions
   - Search and filters
   - Pagination

6. Create UserDetailsModal:
   - Tabs: Profile, Subscription, Payments, Reservations
   - Admin actions: Suspend, Activate, Promote

7. Test: can list/search users, view details, manage subscriptions
```

---

## RES-76: [Admin] Payment monitoring

### Claude Code Prompt

```
Create payment monitoring interface:

1. Create GET /api/admin/payments:
   - Params: status, startDate, endDate, userId, page, limit
   - Return payments with user and subscription info

2. Create src/app/admin/payments/page.tsx:
   - PaymentTable: date, user, plan, base amount, penalty, total, status, MP ID
   - Date range picker, status filter, user search
   - Export to CSV button

3. Create PaymentDetailsModal:
   - Full payment details
   - Link to MercadoPago dashboard
   - Related webhook events
   - Admin actions if needed

4. Create CSV export utility

5. Test: filters work, export works, details complete
```

```

---

## EPIC TASKS (For Reference Only)

These are Epic-level tasks that group related stories and tasks. They don't need Claude Code prompts as they're organizational containers.

### RES-1: [Epic] User Authentication & Management
Parent epic for all authentication-related tasks (RES-2 through RES-13, RES-52-56).

### RES-14: [Epic] MercadoPago Integration  
Parent epic for all payment integration tasks (RES-15 through RES-19, RES-57-61).

### RES-20: [Epic] Subscription Management
Parent epic for subscription management features (RES-62-64).

**RES-20 Note:** This epic covers advanced subscription features:
- RES-62: Plan upgrade/downgrade
- RES-63: Reactivate subscriptions
- RES-64: Grace period implementation

### RES-21: [Epic] Email Notification System
Parent epic for email functionality (RES-25, RES-65-67).

**RES-21 Note:** This epic covers all email features:
- RES-25: Email service setup
- RES-65: Email templates
- RES-66: Email integration
- RES-67: Automated reminders

### RES-22: [Epic] Penalty Fee System
Parent epic for penalty management (RES-26, RES-68-69).

**RES-22 Note:** This epic covers penalty calculation and application:
- RES-26: Penalty calculation logic
- RES-68: Automated penalty application
- RES-69: Penalty payment processing

### RES-23: [Epic] Reservation System
Parent epic for reservation features (RES-27, RES-70-73).

**RES-23 Note:** This epic covers complete reservation functionality:
- RES-27: Database schema
- RES-70: Booking API
- RES-71: Booking UI
- RES-72: List reservations
- RES-73: Cancel reservations

### RES-24: [Epic] Admin Dashboard
Parent epic for admin features (RES-28, RES-74-76).

**RES-24 Note:** This epic covers admin tools:
- RES-28: Admin roles and permissions
- RES-74: Dashboard overview with metrics
- RES-75: User management interface
- RES-76: Payment monitoring interface

---

# Summary

All 57 tasks now have detailed Claude Code prompts ready!

Simply copy the prompt for any task and paste it into Claude Code to start development.

Each prompt includes:
✅ Step-by-step instructions
✅ Exact commands and file paths
✅ Code patterns and examples
✅ Testing procedures
✅ Clear outcomes

Happy coding! 🚀
