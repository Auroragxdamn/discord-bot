const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ordeck')
        .setDescription('Replies with Ordeck!'),
    async execute(interaction) {
        await interaction.reply('Ordeck!');
    },
};