const { SlashCommandBuilder } = require('discord.js');
const { QueryType, useMainPlayer } = require('../discord-player-bootstrap');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('YouTube linkiyle şarkı çal')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('YouTube şarkı linki')
                .setRequired(true)),
    async execute(interaction) {
        const player = useMainPlayer();
        const channel = interaction.member.voice.channel;

        if (!channel) {
            return interaction.reply({ content: 'Müzik çalmak için bir ses kanalında olmalısın!', ephemeral: true });
        }

        const query = interaction.options.getString('song', true).trim();

        if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
            return interaction.reply({ content: 'Sadece YouTube linkleri destekleniyor. Bir YouTube linki yapıştır.', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const { track } = await player.play(channel, query, {
                searchEngine: QueryType.YOUTUBE_VIDEO,
                nodeOptions: {
                    metadata: interaction,
                    volume: 80,
                    leaveOnEnd: false,
                    leaveOnEmpty: false,
                    encoderArgs: ['-af', 'loudnorm=I=-14:TP=-1:LRA=11']
                }
            });

            const title = track?.title || 'Bilinmeyen şarkı';
            return interaction.followUp(`🎶 **${title}** kuyruğa eklendi ve çalınıyor!`);
        } catch (error) {
            console.error('Player play error:', error);
            const errorMessage = error.message || 'Bilinmeyen bir hata oluştu.';
            return interaction.followUp(`Müzik çalınırken bir hata ile karşılaşıldı: ${errorMessage}`);
        }
    }
};
