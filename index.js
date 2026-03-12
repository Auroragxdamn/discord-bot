const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors, SoundCloudExtractor } = require('@discord-player/extractor');
require('dotenv').config();

let config = {};
try {
    config = require('./config.json');
} catch (e) {
    // Ignore require error in production (since config.json is in .gitignore)
}

const token = process.env.TOKEN || config.token;

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ] 
});

const player = new Player(client, {
    ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25
    }
});

// loadMulti is an async function in Discord-Player v6+.
player.extractors.loadMulti(DefaultExtractors).then(() => {
    console.log('Default Extractors loaded successfully.');
}).catch(console.error);

player.events.on('playerStart', (queue, track) => {
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
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
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

client.login(token);
