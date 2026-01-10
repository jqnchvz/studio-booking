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
