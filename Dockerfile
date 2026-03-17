# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ .

# ── Stage 2: Production image ────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed deps and source
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

# Create data and logs directories with correct ownership
RUN mkdir -p data logs && chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "src/server.js"]
