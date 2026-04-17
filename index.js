const crypto = require('node:crypto');
if (typeof globalThis !== 'undefined' && !globalThis.crypto) {
    globalThis.crypto = crypto.webcrypto;
}

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { Player } = require('./discord-player-bootstrap');
require('dotenv').config();
require('./db.js');

const token = process.env.TOKEN;

if (!token) {
    throw new Error('TOKEN environment variable is missing.');
}

process.on('unhandledRejection', (error) => {
    console.error('[UNHANDLED REJECTION]');
    console.error(error);
});

process.on('uncaughtException', (error) => {
    console.error('[UNCAUGHT EXCEPTION]');
    console.error(error);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once('ready', () => {
    console.log(`[BOT] Discord istemcisi hazir: ${client.user.tag}`);
});

client.on('error', (error) => {
    console.error('[CLIENT ERROR]');
    console.error(error);
});

client.on('warn', (message) => {
    console.warn(`[CLIENT WARN] ${message}`);
});

const player = new Player(client, {
    autoRegisterExtractor: false,
    ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25
    }
});

// Leave voice channel after 5 minutes of idle (no songs in queue)
player.events.on('emptyQueue', (queue) => {
    setTimeout(() => {
        if (!queue.isPlaying()) {
            queue.delete();
        }
    }, 5 * 60 * 1000); // 5 minutes
});

// Leave voice channel after 5 minutes if current channel is empty
player.events.on('emptyChannel', (queue) => {
    setTimeout(() => {
        if (queue.channel.members.size <= 1) { // Only bot left
            queue.delete();
        }
    }, 5 * 60 * 1000); // 5 minutes
});

player.events.on('playerStart', (queue, track) => {
    // Skip generic titles from raw stream URLs (e.g. YouTube CDN "videoplayback")
    if (!track.title || track.title === 'videoplayback' || track.title.startsWith('http')) return;
    queue.metadata.followUp(`🎶 **${track.title}** çalmaya başladı!`);
});

player.events.on('error', (queue, error) => {
    console.log(`[Player Event Error] ${error.message}`);
});
player.events.on('playerError', (queue, error) => {
    console.log(`[Audio Player Error] ${error.message}`);
});
player.events.on('debug', (queue, message) => {
    console.log(`[Player Debug] ${message}`);
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    } catch (error) {
        console.error(`[COMMAND LOAD ERROR] ${filePath}`);
        console.error(error);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

async function startBot() {
    const extractorLoadResult = await player.extractors.loadDefault();

    if (extractorLoadResult?.error) {
        throw new Error(`Default extractors yuklenemedi: ${extractorLoadResult.error.message || extractorLoadResult.error}`);
    }

    console.log('[BOT] Discord girisi baslatiliyor...');
    await client.login(token);
    console.log('[BOT] Discord girisi istegi gonderildi.');
}

startBot().catch((error) => {
    console.error('[BOT] Baslangic basarisiz.');
    console.error(error);
    process.exit(1);
});
