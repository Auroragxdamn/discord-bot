const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gonder')
        .setDescription('Başka bir kullanıcıya para gönderir.')
        .addUserOption(option => 
            option.setName('kullanici')
                .setDescription('Para göndermek istediğiniz kullanıcı')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('miktar')
                .setDescription('Gönderilecek miktar')
                .setRequired(true)
                .setMinValue(1)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici');
        const amount = interaction.options.getInteger('miktar');
        
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({ content: 'Kendinize para gönderemezsiniz!', ephemeral: true });
        }
        if (targetUser.bot) {
            return interaction.reply({ content: 'Botlara para gönderemezsiniz!', ephemeral: true });
        }
        
        try {
            const senderData = await db.getUser(interaction.user.id);
            
            if (senderData.balance < amount) {
                return interaction.reply({ 
                    content: `Yetersiz bakiye! Bu işlemi gerçekleştirmek için **${amount - senderData.balance} 🪙** daha paraya ihtiyacınız var.`, 
                    ephemeral: true 
                });
            }
            
            // Deduct from sender
            await db.updateUser(interaction.user.id, senderData.balance - amount, senderData.last_daily);
            
            // Add to receiver
            await db.addBalance(targetUser.id, amount);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('💸 Para Transferi Başarılı')
                .setDescription(`Başarıyla ${targetUser} kullanıcısına **${amount} 🪙** gönderdiniz!\nKalan Bakiyeniz: **${senderData.balance - amount} 🪙**`)
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Para transferi sırasında bir hata oluştu.', ephemeral: true });
        }
    },
};
