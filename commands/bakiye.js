const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bakiye')
        .setDescription('Kendi bakiyenizi veya bir başkasının bakiyesini gösterir.')
        .addUserOption(option => 
            option.setName('kullanici')
                .setDescription('Bakiyesine bakmak istediğiniz kullanıcı')
                .setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici') || interaction.user;
        
        try {
            const userData = await db.getUser(targetUser.id);
            const balance = userData.balance;
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('💰 Bakiye Bilgisi')
                .setDescription(`**${targetUser.username}** adlı kullanıcının mevcut bakiyesi: **${balance} 🪙**`)
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Bakiye sorgulanırken bir hata oluştu.', ephemeral: true });
        }
    },
};
