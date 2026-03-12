# Discord.js v14 Music Bot

A modern, clean, and dynamic command handler setup for a Discord bot using Discord.js v14, featuring a high-quality music player.

## Features
- **Advanced Music Player:** Play high-quality audio from YouTube and Spotify via a custom SoundCloud DRM-bypass bridge.
- **Discord DAVE Protocol Ready:** Fully supports Discord's new End-to-End Encryption (E2EE) voice channels.
- **Dynamic Command Handling:** Drop new command files into the `commands/` folder and they are automatically loaded.
- **Dynamic Event Handling:** Drop new event listener files into the `events/` folder to keep your main file clean.
- **Slash Command Registration:** Easily register and update application (`/`) commands (`/play`, `/stop`, `/skip`).
- **Auto-restarting Dev Environment:** Uses `nodemon` to automatically refresh the bot when you save changes to your code.

## Getting Started

### 1. Prerequisites
- Node.js installed (LTS version recommended)
- A Discord Developer Application and Bot Token
- Your Application ID (Client ID)
- Your Discord Server ID (Guild ID)

### 2. Configuration
1. Open `config.json`.
2. Replace the placeholder values with your actual bot credentials from the [Discord Developer Portal](https://discord.com/developers/applications):
```json
{
	"token": "YOUR_BOT_TOKEN_HERE",
	"clientId": "YOUR_CLIENT_ID_HERE",
	"guildId": "YOUR_GUILD_ID_HERE"
}
```

### 3. Running the Bot Locally
To start the bot in development mode, simply run:
```bash
npm run dev
```
This command automatically:
1. Registers your current slash commands to your test server (`deploy-commands.js`).
2. Starts the bot using `nodemon` so it auto-restarts on code changes (`index.js`).

## Deployment (Dokploy)
This bot is pre-configured to be deployed securely via Dokploy using environment variables.

1. Create a new Application in Dokploy linked to your GitHub repository.
2. Under **Build Type**, keep the default **Nixpacks** (it will automatically build and run the `npm run start` script).
3. Go to the **Environment** tab in your Dokploy application and add the following variables:
   - `TOKEN` (Your Discord bot token)
   - `CLIENT_ID` (Your application ID)
   - `GUILD_ID` (Your test server ID)
4. Click **Deploy**.

## Folder Structure
- `commands/` - Place your slash command `.js` files here. They must export a `data` (SlashCommandBuilder) and an `execute` function.
- `events/` - Place your event `.js` files here (e.g., `ready.js`, `interactionCreate.js`).
- `deploy-commands.js` - Utility script to send command data to the Discord API.
- `config.json` - Your local bot credentials (do not share or commit this file!).
- `index.js` - The main entry point that boots up the bot and loads the handler.
