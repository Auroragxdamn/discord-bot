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

        const embed = new EmbedBuilder()
            .setTitle('🎶 Müzik Kuyruğu')
            .setColor(0x5865F2)
            .setDescription(
                `**Şu anda çalıyor:**\n` +
                `🎵 [${currentTrack.title}](${currentTrack.url}) — \`${currentTrack.duration}\``
            );

        if (tracks.length > 0) {
            const upcomingList = tracks
                .slice(0, 10)
                .map((track, i) => `**${i + 1}.** [${track.title}](${track.url}) — \`${track.duration}\``)
                .join('\n');

            embed.addFields({
                name: `📋 Sıradaki Şarkılar (${tracks.length})`,
                value: upcomingList
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

        return interaction.reply({ embeds: [embed] });
    },
};
