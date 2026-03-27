const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    try {
        const command = require(filePath);
        if (command?.data?.toJSON) {
            commands.push(command.data.toJSON());
        } else {
            console.warn(`[WARNING] Slash command export is invalid: ${filePath}`);
        }
    } catch (error) {
        console.error(`[COMMAND DEPLOY LOAD ERROR] ${filePath}`);
        console.error(error);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all global commands with the current set
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();
