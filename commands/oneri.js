const { SlashCommandBuilder } = require('discord.js');
const youtubedl = require('youtube-dl-exec');
const db = require('../db.js');
const {
    getDateLabel,
    getWeekdayLabel,
    isYouTubeUrl
} = require('../sarki-utils.js');

async function resolveSongTitle(link) {
    try {
        const info = await youtubedl(link, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0']
        });

        return info?.title || 'Bilinmeyen Sarki';
    } catch (error) {
        console.error('[oneri] Sarki adi alinamadi:', error.message || error);
        return 'Bilinmeyen Sarki';
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('oneri')
        .setDescription('Bir YouTube linki oner')
        .addStringOption(option =>
            option
                .setName('link')
                .setDescription('YouTube video linki')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda kullanilabilir.', ephemeral: true });
        }

        const link = interaction.options.getString('link', true).trim();

        if (!isYouTubeUrl(link)) {
            return interaction.reply({ content: 'Lutfen gecerli bir YouTube linki girin.', ephemeral: true });
        }

        await interaction.deferReply();

        const title = await resolveSongTitle(link);
        const entry = {
            guildId: interaction.guildId,
            userId: interaction.user.id,
            username: interaction.user.username,
            link,
            title,
            dayLabel: getWeekdayLabel(),
            dateLabel: getDateLabel(),
            weekKey: db.getCurrentWeekKey(),
            createdAt: new Date().toISOString()
        };

        try {
            await db.addSongSuggestion(entry);
        } catch (error) {
            console.error('[oneri] Oneri kaydedilemedi:', error);
            return interaction.editReply('Oneri kaydedilirken bir hata olustu.');
        }

        return interaction.editReply(`**${interaction.user.username}**, oneriniz kaydedildi: **${title}** (${entry.dayLabel})`);
    }
};
