const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gunluk')
        .setDescription('Günlük ödülünüzü almanızı sağlar.'),
    async execute(interaction) {
        try {
            const userData = await db.getUser(interaction.user.id);
            const now = Date.now();
            const cooldown = 24 * 60 * 60 * 1000; // 24 hours in ms
            
            if (now - userData.last_daily < cooldown) {
                const remaining = cooldown - (now - userData.last_daily);
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                
                return interaction.reply({ 
                    content: `⏳ Günlük ödülünüzü zaten aldınız! Tekrar almak için **${hours} saat ${minutes} dakika** beklemeniz gerekiyor.`,
                    ephemeral: true 
                });
            }
            
            // Generate random reward between 500 and 1000
            const reward = Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
            const newBalance = userData.balance + reward;
            
            await db.updateUser(interaction.user.id, newBalance, now);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎁 Günlük Ödül')
                .setDescription(`Tebrikler! Günlük ödülünüz olan **${reward} 🪙** hesabınıza eklendi.\nGüncel Bakiyeniz: **${newBalance} 🪙**`)
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Ödül alınırken bir hata oluştu.', ephemeral: true });
        }
    },
};
