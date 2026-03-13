# 🎵 Discord Music Bot

A feature-rich Discord music bot built with **Discord.js v14** and **discord-player**, capable of playing audio from **YouTube** with full support for Discord's DAVE (E2EE) voice protocol.

## ✨ Features

- **YouTube Playback** — Play music from YouTube via `yt-dlp` with automatic best-quality audio extraction.
- **DAVE Protocol Ready** — Fully supports Discord's End-to-End Encrypted voice channels.
- **Slash Commands** — Modern `/play`, `/skip`, and `/stop` interaction commands.
- **Dynamic Handlers** — Auto-loading command and event handlers; just drop new `.js` files into `commands/` or `events/`.
- **Queue System** — Built-in track queue with skip and stop controls via `discord-player`.
- **Hot Reload** — Development mode with `nodemon` for instant restarts on code changes.

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16.9+ (LTS recommended)
- **FFmpeg** installed and available in PATH
- A [Discord Developer Application](https://discord.com/developers/applications) with a Bot Token
- Your **Application ID** (Client ID) and **Server ID** (Guild ID)

### Installation

```bash
git clone <your-repo-url>
cd discord-bot
npm install
```

### Configuration

The bot supports two configuration methods:

**Option A — Local `config.json` (for development):**
```json
{
    "token": "YOUR_BOT_TOKEN",
    "clientId": "YOUR_CLIENT_ID",
    "guildId": "YOUR_GUILD_ID"
}
```

**Option B — Environment variables (for production/Dokploy):**
Create a `.env` file or set these variables in your hosting platform:
```
TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_server_id
```

> Environment variables take priority over `config.json`.

### Running Locally

```bash
npm run dev
```

This command will:
1. Register slash commands to your guild (`deploy-commands.js`).
2. Start the bot with `nodemon` for auto-restart on file changes.

For production (no hot reload):
```bash
npm start
```

## 🤖 Commands

| Command | Description |
|---------|-------------|
| `/play <song>` | YouTube'dan şarkı adı veya URL ile çal |
| `/skip` | Şu anda çalan şarkıyı atla |
| `/queue` | Müzik kuyruğunu göster |
| `/stop` | Müziği durdur, kuyruğu temizle ve kanaldan ayrıl |

## ☁️ Deployment (Dokploy)

This bot is pre-configured for deployment via **Dokploy** with Nixpacks.

1. Create a new Application in Dokploy linked to your GitHub repository.
2. Keep the default **Nixpacks** build type — it will auto-install FFmpeg and run `npm start`.
3. Go to the **Environment** tab and add:
   - `TOKEN` — Your Discord bot token
   - `CLIENT_ID` — Your application ID
   - `GUILD_ID` — Your test server ID
4. Click **Deploy**.

## 📁 Project Structure

```
discord-bot/
├── commands/           # Slash command files
│   ├── play.js         # /play — YouTube playback
│   ├── skip.js         # /skip — Şarkı atla
│   ├── queue.js        # /queue — Kuyruğu göster
│   └── stop.js         # /stop — Durdur ve kanaldan ayrıl
├── events/             # Discord event listeners
│   ├── ready.js        # Bot ready event
│   └── interactionCreate.js  # Slash command router
├── index.js            # Main entry point — boots the bot & player
├── deploy-commands.js  # Registers slash commands with Discord API
├── config.json         # Local credentials (gitignored)
├── nixpacks.toml       # Nixpacks config (adds FFmpeg)
├── package.json        # Dependencies & scripts
└── .gitignore
```

## 🛠️ Tech Stack

- [Discord.js](https://discord.js.org/) v14 — Discord API wrapper
- [discord-player](https://discord-player.js.org/) v7 — Audio player framework
- [youtube-dl-exec](https://github.com/microlinkhq/youtube-dl-exec) — YouTube audio extraction via yt-dlp
- [dotenv](https://github.com/motdotla/dotenv) — Environment variable management
- [FFmpeg](https://ffmpeg.org/) — Audio transcoding

## 📝 License

ISC
