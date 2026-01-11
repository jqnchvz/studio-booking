# Database Setup

## Prerequisites

- PostgreSQL 12 or higher installed locally or accessible remotely

## Local Development Setup

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from https://www.postgresql.org/download/windows/

### 2. Create Development Database

```bash
# Connect to PostgreSQL as superuser
psql postgres

# Create database
CREATE DATABASE reservapp_dev;

# Create user (if needed)
CREATE USER postgres WITH ENCRYPTED PASSWORD 'password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE reservapp_dev TO postgres;

# Exit
\q
```

### 3. Configure Environment

Ensure your `.env` file has the correct DATABASE_URL:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/reservapp_dev"
```

### 4. Run Migrations

```bash
# Create and apply initial migration
npm run db:migrate

# Or push schema directly (for rapid development)
npm run db:push
```

### 5. Verify Setup

Open Prisma Studio to view and manage your database:

```bash
npm run db:studio
```

## Database Commands

- `npm run db:migrate` - Create and apply new migration
- `npm run db:push` - Sync schema without creating migration (dev only)
- `npm run db:studio` - Open Prisma Studio GUI
- `npm run db:generate` - Regenerate Prisma Client after schema changes

## Prisma Studio

Prisma Studio provides a visual interface to:
- View all tables and data
- Create, update, and delete records
- Test queries
- Manage relationships

Access at: http://localhost:5555

## Schema Changes

When you modify `prisma/schema.prisma`:

1. **Development:** Run `npm run db:push` to quickly sync changes
2. **Production:** Run `npm run db:migrate` to create proper migrations

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running: `brew services list` (macOS) or `systemctl status postgresql` (Linux)
- Check DATABASE_URL in `.env` matches your PostgreSQL configuration

### Authentication Failed
- Verify username and password in DATABASE_URL
- Check PostgreSQL user has proper permissions

### Database Does Not Exist
- Create the database: `createdb reservapp_dev`
- Or use SQL: `CREATE DATABASE reservapp_dev;`

## Production Setup

For production, use a managed PostgreSQL service:
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Supabase](https://supabase.com/) - Open-source Firebase alternative
- [Railway](https://railway.app/) - Easy deployment platform
- [AWS RDS](https://aws.amazon.com/rds/) - Amazon's managed database

Set the production DATABASE_URL in your deployment platform's environment variables.
