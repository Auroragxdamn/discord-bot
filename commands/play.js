const { SlashCommandBuilder } = require('discord.js');
const { spawn } = require('node:child_process');
const youtubedl = require('youtube-dl-exec');
const {
    QueryType,
    Track,
    useMasterPlayer
} = require('../discord-player-bootstrap');

const LOUDNORM_ARGS = ['-af', 'loudnorm=I=-14:TP=-1:LRA=11'];
const YTDLP_HEADERS = [
    'referer:youtube.com',
    'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
];

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
        addHeader: YTDLP_HEADERS
    });

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
            engine: query
        }
    });
}

function createYtDlpProcess(query) {
    return youtubedl.exec(query, {
        format: 'bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio/best',
        output: '-',
        noPlaylist: true,
        noCheckCertificates: true,
        noWarnings: true,
        addHeader: YTDLP_HEADERS
    }, {
        stdio: ['ignore', 'pipe', 'pipe']
    });
}

function createPlayableStream(query) {
    const ytDlpProcess = createYtDlpProcess(query);
    const ffmpegProcess = spawn('ffmpeg', [
        '-loglevel', 'error',
        '-i', 'pipe:0',
        '-analyzeduration', '0',
        '-f', 's16le',
        '-ar', '48000',
        '-ac', '2',
        ...LOUDNORM_ARGS,
        'pipe:1'
    ], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    ytDlpProcess.stdout.pipe(ffmpegProcess.stdin);

    const destroyChildren = () => {
        if (!ytDlpProcess.killed) {
            ytDlpProcess.kill('SIGKILL');
        }

        if (!ffmpegProcess.killed) {
            ffmpegProcess.kill('SIGKILL');
        }
    };

    ytDlpProcess.on('close', () => {
        if (!ffmpegProcess.killed) {
            ffmpegProcess.stdin.end();
        }
    });

    ytDlpProcess.on('error', (error) => {
        console.error('[yt-dlp process error]', error);
        destroyChildren();
    });

    ffmpegProcess.on('error', (error) => {
        console.error('[ffmpeg process error]', error);
        destroyChildren();
    });

    ytDlpProcess.stderr?.on('data', (chunk) => {
        const message = String(chunk).trim();
        if (message) {
            console.log(`[yt-dlp] ${message}`);
        }
    });

    ffmpegProcess.stderr?.on('data', (chunk) => {
        const message = String(chunk).trim();
        if (message) {
            console.log(`[ffmpeg] ${message}`);
        }
    });

    ffmpegProcess.stdout.on('close', destroyChildren);
    ffmpegProcess.stdout.on('error', destroyChildren);

    return ffmpegProcess.stdout;
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
                        const sourceUrl = requestedTrack.raw?.engine;

                        if (requestedTrack.raw?.source !== 'arbitrary' || !sourceUrl) {
                            return null;
                        }

                        return createPlayableStream(sourceUrl);
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
