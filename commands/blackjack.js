const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const db = require('../db.js');

const SUITS = ['♥', '♦', '♣', '♠'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
    let deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            let value = parseInt(rank);
            if (['J', 'Q', 'K'].includes(rank)) value = 10;
            if (rank === 'A') value = 11;
            deck.push({ suit, rank, value });
        }
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function calculateScore(hand) {
    let score = 0;
    let aces = 0;
    for (const card of hand) {
        score += card.value;
        if (card.rank === 'A') aces += 1;
    }
    while (score > 21 && aces > 0) {
        score -= 10;
        aces -= 1;
    }
    return score;
}

function formatHand(hand) {
    return hand.map(c => `[${c.rank}${c.suit}]`).join(' ');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Kruvazöre karşı Blackjack (21) oynayın!')
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
            
            let deck = createDeck();
            let playerHand = [deck.pop(), deck.pop()];
            let botHand = [deck.pop(), deck.pop()];
            
            let playerScore = calculateScore(playerHand);
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('hit')
                        .setLabel('Kart Çek (Hit)')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('stand')
                        .setLabel('Dur (Stand)')
                        .setStyle(ButtonStyle.Danger),
                );

            const initialEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🃏 Blackjack')
                .setDescription(`Bahis: **${bet} 🪙**\n\n**Senin Elin:** ${formatHand(playerHand)}\nToplam: **${playerScore}**\n\n**Kasanın Eli:** [${botHand[0].rank}${botHand[0].suit}] [?]`)
                .setTimestamp();
                
            const response = await interaction.reply({ embeds: [initialEmbed], components: [row], fetchReply: true });
            
            if (playerScore === 21) {
                const newB = userData.balance + Math.floor(bet * 1.5);
                await db.updateUser(interaction.user.id, newB, userData.last_daily);
                const winEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🃏 Blackjack - KAZANDINIZ!')
                    .setDescription(`**BLACKJACK!**\n\n**Senin Elin:** ${formatHand(playerHand)} (21)\n**Kasanın Eli:** ${formatHand(botHand)} (${calculateScore(botHand)})\n\nKazanılan: **${Math.floor(bet * 1.5)} 🪙**\nGüncel Bakiye: **${newB} 🪙**`)
                    .setTimestamp();
                return interaction.editReply({ embeds: [winEmbed], components: [] });
            }
            
            const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });
            
            // To properly acknowledge the last button press 
            // without ending up with "interaction failed"
            let lastInteraction = null;

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: 'Bu oyunu sadece başlatan kişi oynayabilir!', ephemeral: true });
                }
                
                lastInteraction = i;

                if (i.customId === 'hit') {
                    playerHand.push(deck.pop());
                    playerScore = calculateScore(playerHand);
                    
                    if (playerScore > 21) {
                        return collector.stop('bust');
                    }
                    
                    const hitEmbed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('🃏 Blackjack')
                        .setDescription(`Bahis: **${bet} 🪙**\n\n**Senin Elin:** ${formatHand(playerHand)}\nToplam: **${playerScore}**\n\n**Kasanın Eli:** [${botHand[0].rank}${botHand[0].suit}] [?]`)
                        .setTimestamp();
                        
                    await i.update({ embeds: [hitEmbed], components: [row] });
                } else if (i.customId === 'stand') {
                    collector.stop('stand');
                }
            });
            
            collector.on('end', async (collected, reason) => {
                let botScore = calculateScore(botHand);
                
                if (reason === 'stand') {
                    while (botScore < 17) {
                        botHand.push(deck.pop());
                        botScore = calculateScore(botHand);
                    }
                }
                
                let resultMsg = '';
                let color = 0x0000FF;
                let newBalance = userData.balance;
                
                if (reason === 'bust') {
                    newBalance -= bet;
                    color = 0xFF0000;
                    resultMsg = `**Bust (21'i geçtin)!** Kaybettin. **-${bet} 🪙**`;
                } else if (reason === 'time') {
                    newBalance -= bet;
                    color = 0xFF0000;
                    resultMsg = `Zaman aşımı! Kaybettin. **-${bet} 🪙**`;
                } else {
                    if (botScore > 21) {
                        newBalance += bet;
                        color = 0x00FF00;
                        resultMsg = `Kasa patladı! Kazandın. **+${bet} 🪙**`;
                    } else if (playerScore > botScore) {
                        newBalance += bet;
                        color = 0x00FF00;
                        resultMsg = `Kasanın elinden daha yüksek! Kazandın. **+${bet} 🪙**`;
                    } else if (botScore > playerScore) {
                        newBalance -= bet;
                        color = 0xFF0000;
                        resultMsg = `Kasanın eli daha yüksek! Kaybettin. **-${bet} 🪙**`;
                    } else {
                        color = 0xFFFF00; // draw
                        resultMsg = `Berabere! Paranız iade edildi.`;
                    }
                }
                
                await db.updateUser(interaction.user.id, newBalance, userData.last_daily);
                
                const finalEmbed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle('🃏 Blackjack - BİTTİ')
                    .setDescription(`Bahis: **${bet} 🪙**\n\n**Senin Elin:** ${formatHand(playerHand)} (${playerScore})\n**Kasanın Eli:** ${formatHand(botHand)} (${botScore})\n\n${resultMsg}\nGüncel Bakiye: **${newBalance} 🪙**`)
                    .setTimestamp();
                    
                if (lastInteraction && reason === 'stand') {
                    await lastInteraction.update({ embeds: [finalEmbed], components: [] });
                } else {
                    await interaction.editReply({ embeds: [finalEmbed], components: [] });
                }
            });
            
        } catch (error) {
            console.error(error);
            try {
                await interaction.editReply({ content: 'Oyun sırasında bir hata oluştu.', components: [] });
            } catch (e) {}
        }
    },
};
