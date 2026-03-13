const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db.js');

const EMOJIS = ['🍎', '🍊', '🍋', '🍒', '🍇', '🍉'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slot')
        .setDescription('Slot makinesi oynayın!')
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
            
            const slot1 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
            const slot2 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
            const slot3 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
            
            let multiplier = 0;
            if (slot1 === slot2 && slot2 === slot3) {
                multiplier = 5; // 3 match = 5x payout (net +4x profit)
            } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
                multiplier = 2; // 2 match = 2x payout (net +1x profit)
            }
            
            let newBalance = userData.balance;
            let resultText = '';
            let color = 0xFF0000; // default lose
            
            if (multiplier > 0) {
                const winAmount = bet * multiplier - bet; // Net profit
                newBalance += winAmount;
                resultText = `🎉 Kazandınız! (x${multiplier}) **+${winAmount}** 🪙`;
                color = 0x00FF00;
            } else {
                newBalance -= bet;
                resultText = `😢 Kaybettiniz. **-${bet}** 🪙`;
            }
            
            await db.updateUser(interaction.user.id, newBalance, userData.last_daily);
            
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('🎰 Slot Makinesi')
                .setDescription(`Bahis: **${bet}** 🪙\n\n[ ${slot1} | ${slot2} | ${slot3} ]\n\n${resultText}\nGüncel Bakiye: **${newBalance} 🪙**`)
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Oyun sırasında bir hata oluştu.', ephemeral: true });
        }
    },
};
