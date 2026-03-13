# ── Build Stage ──────────────────────────────────────────────
# We use the full image for building because it has GCC/Make/Python pre-installed
FROM node:20-bookworm AS builder

WORKDIR /app
COPY package*.json ./

# 1. Force sqlite3 to compile for your server's specific GLIBC
# 2. Skip python check for yt-dlp here
ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1
RUN npm ci --build-from-source sqlite3 --omit=dev

# ── Runtime Stage ────────────────────────────────────────────
# Use slim for the final run to save RAM
FROM node:20-bookworm-slim

# Install runtime dependencies (FFmpeg + Python for yt-dlp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Security: Non-root user
RUN groupadd -r bot && useradd -r -g bot -m bot
WORKDIR /app

# Copy the modules we just compiled in the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Ensure the bot user owns the files
RUN chown -R bot:bot /app
USER bot

CMD ["npm", "start"]