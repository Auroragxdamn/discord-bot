const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listele')
        .setDescription('Bu hafta onerilen tum sarkilari gor'),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda kullanilabilir.', ephemeral: true });
        }

        let guildSuggestions;

        try {
            guildSuggestions = await db.getSongSuggestionsByGuild(interaction.guildId);
        } catch (error) {
            console.error('[listele] Oneriler okunamadi:', error);
            return interaction.reply({ content: 'Sarki listesi su anda kullanilamiyor.', ephemeral: true });
        }

        if (guildSuggestions.length === 0) {
            return interaction.reply('Bu hafta henuz hic sarki onerilmemis.');
        }

        const lines = guildSuggestions.slice(0, 20).map((suggestion, index) => {
            const title = suggestion.title || 'Bilinmeyen Sarki';
            return `**${index + 1}. ${title}**\n[Linke Git](${suggestion.link})\nKullanici: **${suggestion.username}** | Gun: **${suggestion.day_label}**`;
        });

        const embed = new EmbedBuilder()
            .setTitle('Haftalik Sarki Listesi')
            .setColor('#FF0000')
            .setDescription(lines.join('\n\n'))
            .setFooter({
                text: guildSuggestions.length > 20
                    ? `${interaction.guild.name} onerileri | Ilk 20 kayit gosteriliyor`
                    : `${interaction.guild.name} onerileri`
            })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
