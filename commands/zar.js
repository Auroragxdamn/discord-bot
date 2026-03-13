const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('zar')
        .setDescription('Bota karşı zar atın!')
        .addIntegerOption(option => 
            option.setName('miktar')
                .setDescription('Bahis miktarı')
                .setRequired(true)
                .setMinValue(1)),
    async execute(interaction) {
        const bet = interaction.options.getInteger('miktar');
        
        try {
            const userData = await db.getUser(interaction.user.id);
            if (userData.balance < bet) {
                return interaction.reply({ content: 'Yetersiz bakiye!', ephemeral: true });
            }
            
            const userRoll = Math.floor(Math.random() * 6) + 1;
            const botRoll = Math.floor(Math.random() * 6) + 1;
            
            let resultText = '';
            let newBalance = userData.balance;
            let color = 0x0000FF; // draw
            
            if (userRoll > botRoll) {
                newBalance += bet;
                resultText = `🎉 Kazandınız! **+${bet}** 🪙`;
                color = 0x00FF00;
            } else if (userRoll < botRoll) {
                newBalance -= bet;
                resultText = `😢 Kaybettiniz. **-${bet}** 🪙`;
                color = 0xFF0000;
            } else {
                resultText = `🤝 Berabere! Paranız iade edildi.`;
            }
            
            await db.updateUser(interaction.user.id, newBalance, userData.last_daily);
            
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('🎲 Zar Oyunu')
                .setDescription(`Bahis: **${bet}** 🪙\n\nSenin Zarın: **${userRoll}**\nBotun Zarı: **${botRoll}**\n\n${resultText}\nGüncel Bakiye: **${newBalance} 🪙**`)
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Oyun sırasında bir hata oluştu.', ephemeral: true });
        }
    },
};
