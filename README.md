# Reservapp - Studio Booking System

A modern, subscription-based studio reservation system built with Next.js 14 and TypeScript.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT sessions with bcrypt
- **Forms**: React Hook Form + Zod validation
- **UI Components**: shadcn/ui
- **Payment Gateway**: MercadoPago
- **Email Service**: Resend
- **Cache/Sessions**: Redis

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- PostgreSQL database
- Redis server (for sessions/caching)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jqnchvz/studio-booking.git
cd studio-booking
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Then edit `.env` with your actual values:
- Database connection string
- JWT and session secrets
- MercadoPago API credentials
- Resend API key
- Redis URL
- Application URL

4. Set up the database:
```bash
# See prisma/README.md for detailed database setup instructions
npm run db:migrate
```

Or push the schema directly for development:
```bash
npm run db:push
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Build

Create a production build:

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Linting

Check code quality:

```bash
npm run lint
```

## UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) for UI components. Components are built with Radix UI and styled with Tailwind CSS.

### Available Components

- **Button** - Interactive buttons with multiple variants (default, secondary, destructive, outline, ghost, link)
- **Card** - Container component with header, content, and footer sections
- **Input** - Form input fields
- **Label** - Accessible form labels
- **Badge** - Small status indicators and labels
- **Alert** - Notification and message components
- **Dialog** - Modal dialogs and overlays
- **Form** - Form components with react-hook-form integration

### Component Usage

Components are located in `src/components/ui/` and can be imported directly:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello World</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

### Testing Components

Visit `/ui-test` in development to see all components in action with different variants and configurations.

### Adding New Components

To add more shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add dropdown-menu
```

See the full component list at [shadcn/ui components](https://ui.shadcn.com/docs/components).

## Project Structure

```
src/
├── app/                    # Next.js app directory (App Router)
├── components/
│   ├── ui/                # shadcn/ui components
│   └── features/          # Feature-specific components
├── lib/
│   ├── services/          # Business logic services
│   └── validations/       # Zod validation schemas
└── types/                 # TypeScript type definitions
```

## Environment Variables

See `.env.example` for all required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `SESSION_SECRET`: Secret key for session management
- `MERCADOPAGO_ACCESS_TOKEN`: MercadoPago API access token
- `MERCADOPAGO_PUBLIC_KEY`: MercadoPago public key
- `MERCADOPAGO_WEBHOOK_SECRET`: Secret for webhook verification
- `RESEND_API_KEY`: Resend email service API key
- `EMAIL_FROM`: Email address for sending emails
- `REDIS_URL`: Redis connection URL
- `NEXT_PUBLIC_APP_URL`: Application base URL
- `TZ`: Timezone (default: America/Santiago)

## License

ISC

## Author

Joaquín Chávez
