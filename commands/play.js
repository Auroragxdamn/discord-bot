const { SlashCommandBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const playdl = require('play-dl');
const youtubedl = require('youtube-dl-exec');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube or Spotify')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('The name or URL of the song to play')
                .setRequired(true)),
    async execute(interaction) {
        const player = useMainPlayer();
        const channel = interaction.member.voice.channel;

        if (!channel) {
            return interaction.reply({ content: 'You must be in a voice channel to play music!', ephemeral: true });
        }

            await interaction.deferReply();

            const query = interaction.options.getString('song');
            
            try {
                // Configure play-dl client ID to bypass DRM
                const client_id = await playdl.getFreeClientID();
                await playdl.setToken({ soundcloud : { client_id } });

                let finalSearchQuery = query;

                // If user pasted a YouTube link, play it natively using youtube-dl-exec
                if (query.includes('youtube.com') || query.includes('youtu.be')) {
                    console.log(`[Play Command] Detected YouTube Link. Bypassing node libraries via yt-dlp...`);
                    const info = await youtubedl(query, {
                        dumpSingleJson: true,
                        noCheckCertificates: true,
                        noWarnings: true,
                        preferFreeFormats: true,
                        addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36']
                    });

                    let bestFormat = info.formats.filter(f => f.vcodec === 'none' && f.acodec !== 'none').sort((a,b) => b.tbr - a.tbr)[0];
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

                // Clean the title from random tags like (Official Video) for SoundCloud
                const cleanTitle = finalSearchQuery.replace(/(https?:\/\/[^\s]+)/g, '').replace(/(\(Official.*?\)|\[Official.*?\]|Official Music Video|Music Video|Lyrics|Audio|Video)/gi, '').trim() || finalSearchQuery;
                
                console.log(`[Play Command] Searching SoundCloud via play-dl for: ${cleanTitle}`);
                const searchResult = await playdl.search(cleanTitle, { source: { soundcloud: 'tracks' }, limit: 1 });
                
                if (!searchResult.length) {
                    return interaction.followUp('Şarkı SoundCloud üzerinde bulunamadı!');
                }

                const track = searchResult[0];
                console.log(`[Play Command] Found track: ${track.name} from ${track.url}. Extracting unencrypted stream...`);

                const streamInfo = await playdl.stream(track.url);
                console.log(`[Play Command] Extracted Stream URL: ${streamInfo.url.substring(0, 50)}...`);

                // Send the raw unencrypted stream URL to the discord-player pipeline
                await player.play(channel, streamInfo.url, {
                    nodeOptions: {
                        metadata: interaction,
                        // We attach the track data so the event handler knows the name
                        volume: 80 
                    }
                });
                
                // Manually trigger the followUp since playerStart won't have the track object metadata properly attached
                return interaction.followUp(`🎶 **${track.name}** kuyruğa eklendi ve çalınıyor!`);
                
            } catch (error) {
            console.error('Player play error:', error);
            const errorMessage = error.message || 'Bilinmeyen bir hata oluştu.';
            return interaction.followUp(`Müzik çalınırken bir hata ile karşılaşıldı: ${errorMessage}`);
        }
    },
};
