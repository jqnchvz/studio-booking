FROM node:22-slim AS base

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build (no migrations here — they run at startup)
COPY . .
RUN npx prisma generate && \
    npm run build && \
    if [ -d public ]; then cp -r public .next/standalone/public; fi && \
    cp -r .next/static .next/standalone/.next/static

# Production image
FROM node:22-slim AS runner

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
# Copy Prisma files for runtime migrations
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=base /app/node_modules/prisma ./node_modules/prisma
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
