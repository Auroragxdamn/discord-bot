const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const DEFAULT_TIMEZONE = 'Europe/Istanbul';
const FALLBACK_DATA_FILE = path.join(__dirname, '..', 'db', 'sarkilar.json');
const PERSISTENT_DATA_FILE = '/data/sarkilar.json';

function resolveDataFile() {
    if (process.env.SARKI_DATA_FILE) {
        return process.env.SARKI_DATA_FILE;
    }

    if (fs.existsSync('/data')) {
        return PERSISTENT_DATA_FILE;
    }

    return FALLBACK_DATA_FILE;
}

const DATA_FILE = resolveDataFile();

function ensureDataDirectory() {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

function getDateParts(date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: DEFAULT_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const parts = formatter.formatToParts(date);
    const values = {};

    for (const part of parts) {
        if (part.type !== 'literal') {
            values[part.type] = Number(part.value);
        }
    }

    return {
        year: values.year,
        month: values.month,
        day: values.day
    };
}

function getWeekdayLabel(date = new Date()) {
    return new Intl.DateTimeFormat('tr-TR', {
        timeZone: DEFAULT_TIMEZONE,
        weekday: 'long'
    }).format(date);
}

function getDateLabel(date = new Date()) {
    return new Intl.DateTimeFormat('tr-TR', {
        timeZone: DEFAULT_TIMEZONE
    }).format(date);
}

function getWeekKey(date = new Date()) {
    const { year, month, day } = getDateParts(date);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    const dayNumber = utcDate.getUTCDay() || 7;

    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);

    const isoYear = utcDate.getUTCFullYear();
    const yearStart = new Date(Date.UTC(isoYear, 0, 1));
    const weekNumber = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);

    return `${isoYear}-W${String(weekNumber).padStart(2, '0')}`;
}

function normalizeStore(rawData) {
    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
        return {
            weekKey: getWeekKey(),
            guilds: {}
        };
    }

    if (rawData.guilds && typeof rawData.guilds === 'object' && !Array.isArray(rawData.guilds)) {
        return {
            weekKey: typeof rawData.weekKey === 'string' ? rawData.weekKey : getWeekKey(),
            guilds: rawData.guilds
        };
    }

    return {
        weekKey: getWeekKey(),
        guilds: rawData
    };
}

function loadStore() {
    try {
        ensureDataDirectory();

        if (!fs.existsSync(DATA_FILE)) {
            return normalizeStore(null);
        }

        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        if (!raw.trim()) {
            return normalizeStore(null);
        }

        return normalizeStore(JSON.parse(raw));
    } catch (error) {
        console.error('[sarki] Veri dosyasi okunamadi:', error);
        return normalizeStore(null);
    }
}

function saveStore(store) {
    ensureDataDirectory();
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

let store = loadStore();

function ensureCurrentWeek() {
    const currentWeekKey = getWeekKey();

    if (store.weekKey !== currentWeekKey) {
        store = {
            weekKey: currentWeekKey,
            guilds: {}
        };
        saveStore(store);
    }
}

function isYouTubeUrl(value) {
    try {
        const url = new URL(value);
        const host = url.hostname.replace(/^www\./, '').toLowerCase();
        return ['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'].includes(host);
    } catch {
        return false;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sarki')
        .setDescription('Sarki oneri ve listeleme sistemi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('oneri')
                .setDescription('Bir YouTube linki oner')
                .addStringOption(option =>
                    option
                        .setName('link')
                        .setDescription('YouTube video linki')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('listele')
                .setDescription('Bu hafta onerilen tum sarkilari gor')),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda kullanilabilir.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        try {
            ensureCurrentWeek();
        } catch (error) {
            console.error('[sarki] Haftalik veri hazirlanamadi:', error);
            return interaction.reply({ content: 'Sarki listesi su anda kullanilamiyor.', ephemeral: true });
        }

        if (subcommand === 'oneri') {
            const link = interaction.options.getString('link', true).trim();

            if (!isYouTubeUrl(link)) {
                return interaction.reply({ content: 'Lutfen gecerli bir YouTube linki girin.', ephemeral: true });
            }

            const entry = {
                user: interaction.user.username,
                userId: interaction.user.id,
                link,
                gun: getWeekdayLabel(),
                tarih: getDateLabel(),
                createdAt: new Date().toISOString()
            };

            if (!Array.isArray(store.guilds[guildId])) {
                store.guilds[guildId] = [];
            }

            store.guilds[guildId].push(entry);

            try {
                saveStore(store);
            } catch (error) {
                console.error('[sarki] Oneri kaydedilemedi:', error);
                return interaction.reply({ content: 'Oneri kaydedilirken bir hata olustu.', ephemeral: true });
            }

            return interaction.reply(`**${interaction.user.username}**, oneriniz kaydedildi! (${entry.gun})`);
        }

        const guildSuggestions = Array.isArray(store.guilds[guildId]) ? store.guilds[guildId] : [];

        if (guildSuggestions.length === 0) {
            return interaction.reply('Bu hafta henuz hic sarki onerilmemis.');
        }

        const lines = guildSuggestions.slice(0, 20).map((suggestion, index) =>
            `**${index + 1}.** [Linke Git](${suggestion.link})\nKullanici: **${suggestion.user}** | Gun: **${suggestion.gun}**`
        );

        const embed = new EmbedBuilder()
            .setTitle('Haftalik Sarki Listesi')
            .setColor('#FF0000')
            .setDescription(lines.join('\n\n'))
            .setFooter({
                text: guildSuggestions.length > 20
                    ? `${interaction.guild.name} onerileri | Ilk 20 kayit gosteriliyor`
                    : `${interaction.guild.name} onerileri`
            })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
