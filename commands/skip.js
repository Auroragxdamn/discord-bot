const { SlashCommandBuilder } = require('discord.js');
const { useMasterPlayer } = require('../discord-player-bootstrap');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Şu anda çalan şarkıyı atla'),
    async execute(interaction) {
        const player = useMasterPlayer();
        const channel = interaction.member.voice.channel;

        if (!channel) {
            return interaction.reply({ content: 'Şarkı atlamak için bir ses kanalında olmalısın!', ephemeral: true });
        }

        const queue = player.nodes.get(interaction.guild);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'Şu anda çalan bir şarkı yok!', ephemeral: true });
        }

        // Get the current track before skipping for the message
        const currentTrack = queue.currentTrack;

        queue.node.skip();

        return interaction.reply(`⏭️ **${currentTrack.title}** şarkısı atlandı!`);
    },
};
