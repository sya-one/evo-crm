# =========================
# STAGE 1 - BUILD
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy project
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app
RUN npm run build


# =========================
# STAGE 2 - RUNNER
# =========================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only required artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "server.js"]