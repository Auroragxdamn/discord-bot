const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Şu anki müzik kuyruğunu göster'),
    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'Şu anda çalan bir müzik yok!', ephemeral: true });
        }

        const currentTrack = queue.currentTrack;
        const tracks = queue.tracks.toArray();

        // Safety check for metadata
        const trackTitle = currentTrack.title && currentTrack.title !== 'videoplayback' ? currentTrack.title : 'Bilinmeyen Şarkı';
        const trackUrl = currentTrack.url && currentTrack.url.length < 500 ? currentTrack.url : 'https://youtube.com';

        const embed = new EmbedBuilder()
            .setTitle('🎶 Müzik Kuyruğu')
            .setColor(0x5865F2)
            .setDescription(
                `**Şu anda çalıyor:**\n` +
                `🎵 [${trackTitle.substring(0, 100)}](${trackUrl})`
            );

        if (tracks.length > 0) {
            const upcomingList = tracks
                .slice(0, 10)
                .map((track, i) => {
                    const title = track.title && track.title !== 'videoplayback' ? track.title : 'Bilinmeyen Şarkı';
                    const url = track.url && track.url.length < 500 ? track.url : 'https://youtube.com';
                    return `**${i + 1}.** [${title.substring(0, 100)}](${url})`;
                })
                .join('\n');

            embed.addFields({
                name: `📋 Sıradaki Şarkılar (${tracks.length})`,
                value: upcomingList.substring(0, 1024)
            });

            if (tracks.length > 10) {
                embed.setFooter({ text: `...ve ${tracks.length - 10} şarkı daha` });
            }
        } else {
            embed.addFields({
                name: '📋 Sıradaki Şarkılar',
                value: 'Kuyrukta başka şarkı yok.'
            });
        }

        try {
            return await interaction.reply({ embeds: [embed] });
        } catch (e) {
            console.error('Queue Embed Error:', e);
            return interaction.reply({ content: 'Kuyruk gösterilirken bir hata oluştu!', ephemeral: true });
        }
    },
};
