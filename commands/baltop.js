const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('baltop')
        .setDescription('Sunucudaki en zengin kullanıcıların sıralamasını gösterir.'),
    async execute(interaction) {
        try {
            // db.js'den en yüksek bakiyeye sahip 10 kişiyi seç
            const getTopUsers = () => {
                return db.getTopUsers(10);
            };

            const topUsers = await getTopUsers();

            if (!topUsers || topUsers.length === 0) {
                return interaction.reply({ content: 'Henüz kimsenin bakiyesi bulunmuyor!', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(0xFFD700) // Altın sarısı renk
                .setTitle('🏆 En Zenginler Listesi (Baltop)')
                .setDescription('İşte sunucunun en çok paraya sahip olan oyuncuları:')
                .setTimestamp();

            let leaderboardText = '';
            for (let i = 0; i < topUsers.length; i++) {
                const userRow = topUsers[i];
                let medal = '🏅'; // Varsayılan madalya
                
                if (i === 0) medal = '🥇';
                else if (i === 1) medal = '🥈';
                else if (i === 2) medal = '🥉';

                leaderboardText += `${medal} **${i + 1}.** <@${userRow.id}> - **${userRow.balance}** 🪙\n`;
            }

            embed.addFields({ name: '\u200b', value: leaderboardText });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Sıralama alınırken bir hata oluştu.', ephemeral: true });
        }
    },
};
