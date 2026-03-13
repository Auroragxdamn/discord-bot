# ── Build Stage ──────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Runtime Stage ────────────────────────────────────────────
FROM node:20-slim

# Install runtime dependencies: FFmpeg for audio + Python for yt-dlp
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg python3 \
    && rm -rf /var/lib/apt/lists/*

# Non-root user for security
RUN groupadd -r bot && useradd -r -g bot -m bot
WORKDIR /app

# Copy dependencies from build stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY package*.json ./
COPY index.js deploy-commands.js ./
COPY commands/ ./commands/
COPY events/ ./events/

# Switch to non-root user
USER bot

CMD ["npm", "start"]
