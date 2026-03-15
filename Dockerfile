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

# 1. Create the database directory explicitly
# 2. Ensure it exists before we copy files or switch users
RUN mkdir -p /app/db

# Copy compiled modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy the rest of the application code
COPY . .

# IMPORTANT: Ensure the 'bot' user owns the app directory AND the db folder
# This allows the bot to create/write the .sqlite file inside /app/db
RUN chown -R bot:bot /app

# Switch to the non-root user
USER bot

# Start the application
CMD ["npm", "start"]