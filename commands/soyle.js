const { SlashCommandBuilder } = require('discord.js');

const ALLOWED_USER_ID = '1163124552084226069';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('soyle')
        .setDescription('.')
        .addStringOption(option =>
            option
                .setName('metin')
                .setDescription('.')
                .setRequired(true)),

    async execute(interaction) {
        if (interaction.user.id !== ALLOWED_USER_ID) {
            return interaction.reply({
                content: 'Bu komutu kullanamazsin.',
                ephemeral: true
            });
        }

        const message = interaction.options.getString('metin', true).trim();

        if (!message) {
            return interaction.reply({
                content: 'Gonderilecek metin bos olamaz.',
                ephemeral: true
            });
        }

        await interaction.reply({
            content: 'Mesaj gonderildi.',
            ephemeral: true
        });

        return interaction.channel.send(message);
    }
};
