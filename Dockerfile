FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the Vite frontend
RUN pnpm run build

# Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy files from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/server.ts ./server.ts

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Use tsx to run the server
CMD ["npx", "tsx", "server.ts"]
