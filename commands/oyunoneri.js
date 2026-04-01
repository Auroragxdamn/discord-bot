const { SlashCommandBuilder } = require('discord.js');
const db = require('../db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('oyunoneri')
        .setDescription('Oyun icin gizli onerini kaydeder.')
        .addStringOption(option =>
            option
                .setName('tur')
                .setDescription('Oneri kategorisi')
                .setRequired(true)
                .addChoices(
                    { name: 'kart', value: 'kart' },
                    { name: 'ozellik', value: 'ozellik' }
                ))
        .addStringOption(option =>
            option
                .setName('metin')
                .setDescription('Oneri metni')
                .setRequired(true)),

    async execute(interaction) {
        const category = interaction.options.getString('tur', true);
        const suggestion = interaction.options.getString('metin', true).trim();

        if (!suggestion) {
            return interaction.reply({
                content: 'Oneri metni bos olamaz.',
                ephemeral: true
            });
        }

        try {
            await db.addGameSuggestion({
                guildId: interaction.guildId,
                channelId: interaction.channelId,
                userId: interaction.user.id,
                username: interaction.user.username,
                category,
                suggestion,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('[oyunoneri] Oneri kaydedilemedi:', error);
            return interaction.reply({
                content: 'Oneri kaydedilirken bir hata olustu.',
                ephemeral: true
            });
        }

        return interaction.reply({
            content: `Onerin gizli olarak kaydedildi. Kategori: **${category}**`,
            ephemeral: true
        });
    }
};
