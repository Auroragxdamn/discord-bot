const { SlashCommandBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const youtubedl = require('youtube-dl-exec');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('YouTube\'dan şarkı çal')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Çalınacak şarkının adı veya URL\'si')
                .setRequired(true)),
    async execute(interaction) {
        const player = useMainPlayer();
        const channel = interaction.member.voice.channel;

        if (!channel) {
            return interaction.reply({ content: 'Müzik çalmak için bir ses kanalında olmalısın!', ephemeral: true });
        }

        await interaction.deferReply();

        const query = interaction.options.getString('song');

        try {
            // If user pasted a YouTube link, extract audio natively via yt-dlp
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                console.log(`[Play Command] Detected YouTube Link. Extracting via yt-dlp...`);
                const info = await youtubedl(query, {
                    dumpSingleJson: true,
                    noCheckCertificates: true,
                    noWarnings: true,
                    preferFreeFormats: true,
                    addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36']
                });

                let bestFormat = info.formats.filter(f => f.vcodec === 'none' && f.acodec !== 'none').sort((a, b) => b.tbr - a.tbr)[0];
                if (!bestFormat) bestFormat = info.formats.filter(f => f.acodec !== 'none')[0];

                if (!bestFormat || !bestFormat.url) {
                    return interaction.followUp('YouTube üzerinden ses dosyası alınamadı!');
                }

                console.log(`[Play Command] YouTube Extracted Stream URL: ${bestFormat.url.substring(0, 50)}...`);

                await player.play(channel, bestFormat.url, {
                    nodeOptions: { metadata: interaction, volume: 80 }
                });

                return interaction.followUp(`🎶 **${info.title}** kuyruğa eklendi ve çalınıyor!`);
            }

            // For search queries, use discord-player's default extractors (YouTube search)
            console.log(`[Play Command] Searching YouTube for: ${query}`);

            const result = await player.play(channel, query, {
                nodeOptions: { metadata: interaction, volume: 80 }
            });

            return interaction.followUp(`🎶 **${result.track.title}** kuyruğa eklendi ve çalınıyor!`);

        } catch (error) {
            console.error('Player play error:', error);
            const errorMessage = error.message || 'Bilinmeyen bir hata oluştu.';
            return interaction.followUp(`Müzik çalınırken bir hata ile karşılaşıldı: ${errorMessage}`);
        }
    },
};
