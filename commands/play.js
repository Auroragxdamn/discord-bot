const { SlashCommandBuilder } = require('discord.js');
const youtubedl = require('youtube-dl-exec');
const {
    QueryType,
    Track,
    createFFmpegStream,
    useMasterPlayer
} = require('../discord-player-bootstrap');

const LOUDNORM_ARGS = ['-af', 'loudnorm=I=-14:TP=-1:LRA=11'];

function isYouTubeUrl(value) {
    return value.includes('youtube.com') || value.includes('youtu.be');
}

function formatDuration(seconds) {
    const totalSeconds = Math.max(0, Number(seconds) || 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

async function resolveTrackData(query, requestedBy, player) {
    const info = await youtubedl(query, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: [
            'referer:youtube.com',
            'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
        ]
    });

    const formats = Array.isArray(info.formats) ? info.formats : [];
    let bestFormat = formats
        .filter((format) => format.vcodec === 'none' && format.acodec !== 'none' && format.url)
        .sort((a, b) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0))[0];

    if (!bestFormat) {
        bestFormat = formats
            .filter((format) => format.acodec !== 'none' && format.url)
            .sort((a, b) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0))[0];
    }

    if (!bestFormat || !bestFormat.url) {
        throw new Error('YouTube üzerinden oynatilabilir ses akisi alinmadi.');
    }

    return new Track(player, {
        title: info.title || 'Bilinmeyen şarkı',
        description: info.description || '',
        author: info.uploader || info.channel || 'Bilinmeyen sanatçı',
        url: query,
        thumbnail: info.thumbnail || 'https://i.ytimg.com/vi/default/hqdefault.jpg',
        duration: formatDuration(info.duration),
        views: Number(info.view_count) || 0,
        requestedBy,
        queryType: QueryType.ARBITRARY,
        source: 'arbitrary',
        raw: {
            source: 'arbitrary',
            engine: bestFormat.url
        }
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('YouTube linkiyle şarkı çal')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('YouTube şarkı linki')
                .setRequired(true)),
    async execute(interaction) {
        const player = useMasterPlayer();
        const channel = interaction.member.voice.channel;

        if (!channel) {
            return interaction.reply({ content: 'Müzik çalmak için bir ses kanalında olmalısın!', ephemeral: true });
        }

        const query = interaction.options.getString('song', true).trim();

        if (!isYouTubeUrl(query)) {
            return interaction.reply({ content: 'Sadece YouTube linkleri destekleniyor. Bir YouTube linki yapıştır.', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const track = await resolveTrackData(query, interaction.user, player);

            const { track: queuedTrack } = await player.play(channel, track, {
                nodeOptions: {
                    metadata: interaction,
                    volume: 80,
                    leaveOnEnd: false,
                    leaveOnEmpty: false,
                    onBeforeCreateStream: async (requestedTrack) => {
                        const streamUrl = requestedTrack.raw?.engine;

                        if (requestedTrack.raw?.source !== 'arbitrary' || !streamUrl) {
                            return null;
                        }

                        return createFFmpegStream(streamUrl, {
                            fmt: 's16le',
                            encoderArgs: LOUDNORM_ARGS
                        });
                    }
                }
            });

            const title = queuedTrack?.title || track.title || 'Bilinmeyen şarkı';
            return interaction.followUp(`🎶 **${title}** kuyruğa eklendi ve çalınıyor!`);
        } catch (error) {
            console.error('Player play error:', error);
            const errorMessage = error.message || 'Bilinmeyen bir hata oluştu.';
            return interaction.followUp(`Müzik çalınırken bir hata ile karşılaşıldı: ${errorMessage}`);
        }
    }
};
