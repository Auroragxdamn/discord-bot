const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Yazı tura (coinflip) oynayarak paranızı ikiye katlayın!')
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
            
            const isWin = Math.random() >= 0.5;
            const newBalance = isWin ? userData.balance + bet : userData.balance - bet;
            
            await db.updateUser(interaction.user.id, newBalance, userData.last_daily);
            
            const embed = new EmbedBuilder()
                .setColor(isWin ? 0x00FF00 : 0xFF0000)
                .setTitle('🪙 Yazı Tura')
                .setDescription(`Bahis: **${bet} 🪙**\n\nPara atıldı... **${isWin ? 'TURA!' : 'YAZI!'}**\n\n${isWin ? `🎉 Kazandınız! **+${bet} 🪙**` : `😢 Kaybettiniz. **-${bet} 🪙**`}\nGüncel Bakiye: **${newBalance} 🪙**`)
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Oyun sırasında bir hata oluştu.', ephemeral: true });
        }
    },
};
