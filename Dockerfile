# ── Build Stage ──────────────────────────────────────────────
FROM node:20-bookworm AS builder

WORKDIR /app
COPY package*.json ./

# 1. Force sqlite3 to compile for your server's specific GLIBC
# 2. Skip python check for yt-dlp here
ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1
RUN npm ci --build-from-source sqlite3 --omit=dev

# ── Runtime Stage ────────────────────────────────────────────
FROM node:20-bookworm-slim

# Install runtime dependencies (FFmpeg + Python for yt-dlp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Security: Create non-root user
RUN groupadd -r bot && useradd -r -g bot -m bot
WORKDIR /app

# Create writable data directories for local fallback and container persistence
RUN mkdir -p /app/db /data /var/lib/discord-bot

# Copy compiled modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy the rest of the application code
COPY . .

# Ensure the bot user can write both app-local and mounted data directories
RUN chown -R bot:bot /app /data /var/lib/discord-bot

# Switch to the non-root user
USER bot

# Start the application
CMD ["npm", "start"]
