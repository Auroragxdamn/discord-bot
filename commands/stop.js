const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Müziği durdur ve ses kanalından ayrıl'),
    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'Şu anda çalan bir müzik yok!', ephemeral: true });
        }

        queue.delete();
        await interaction.reply('🛑 Müzik durduruldu ve kuyruk temizlendi.');
    },
};
