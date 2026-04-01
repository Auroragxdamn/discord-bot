const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DEFAULT_TIMEZONE = 'Europe/Istanbul';
const dataDir = process.env.DB_DIR || path.join(__dirname, 'db');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(`[DB] SQLite baglantisi kurulamadı: ${dbPath}`);
        console.error(err);
        return;
    }

    console.log(`[DB] SQLite baglantisi hazir: ${dbPath}`);
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        balance INTEGER DEFAULT 0,
        last_daily INTEGER DEFAULT 0
    )`, (err) => {
        if (err) {
            console.error('[DB] users tablosu hazirlanamadi.');
            console.error(err);
            return;
        }

        console.log('[DB] users tablosu hazir.');
    });

    db.run(`CREATE TABLE IF NOT EXISTS song_suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        title TEXT NOT NULL,
        link TEXT NOT NULL,
        day_label TEXT NOT NULL,
        date_label TEXT NOT NULL,
        week_key TEXT NOT NULL,
        created_at TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('[DB] song_suggestions tablosu hazirlanamadi.');
            console.error(err);
            return;
        }

        console.log('[DB] song_suggestions tablosu hazir.');
    });

    db.run(`CREATE TABLE IF NOT EXISTS game_suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        channel_id TEXT,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        category TEXT NOT NULL,
        suggestion TEXT NOT NULL,
        created_at TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('[DB] game_suggestions tablosu hazirlanamadi.');
            console.error(err);
            return;
        }

        console.log('[DB] game_suggestions tablosu hazir.');
    });
});

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

function getCurrentWeekKey(date = new Date()) {
    const { year, month, day } = getDateParts(date);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    const dayNumber = utcDate.getUTCDay() || 7;

    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);

    const isoYear = utcDate.getUTCFullYear();
    const yearStart = new Date(Date.UTC(isoYear, 0, 1));
    const weekNumber = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);

    return `${isoYear}-W${String(weekNumber).padStart(2, '0')}`;
}

function getUser(id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
            if (err) return reject(err);
            if (!row) {
                const newUser = { id, balance: 0, last_daily: 0 };
                db.run('INSERT INTO users (id, balance, last_daily) VALUES (?, ?, ?)', [id, 0, 0], (err2) => {
                    if (err2) return resolve(newUser); 
                    resolve(newUser);
                });
            } else {
                resolve(row);
            }
        });
    });
}

function updateUser(id, balance, last_daily) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO users (id, balance, last_daily) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET balance = excluded.balance, last_daily = excluded.last_daily', [id, balance, last_daily], function(err) {
            if (err) return reject(err);
            resolve(1);
        });
    });
}

function addBalance(id, amount) {
    return getUser(id).then(user => {
        const newBalance = user.balance + amount;
        return updateUser(id, newBalance, user.last_daily).then(() => newBalance);
    });
}

function getTopUsers(limit = 10) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM users ORDER BY balance DESC LIMIT ?', [limit], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

function addSongSuggestion(suggestion) {
    return new Promise((resolve, reject) => {
        const weekKey = suggestion.weekKey || getCurrentWeekKey();
        db.run(
            `INSERT INTO song_suggestions (
                guild_id, user_id, username, title, link, day_label, date_label, week_key, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                suggestion.guildId,
                suggestion.userId,
                suggestion.username,
                suggestion.title,
                suggestion.link,
                suggestion.dayLabel,
                suggestion.dateLabel,
                weekKey,
                suggestion.createdAt
            ],
            function(err) {
                if (err) return reject(err);
                resolve({ id: this.lastID, weekKey });
            }
        );
    });
}

function getSongSuggestionsByGuild(guildId, weekKey = getCurrentWeekKey(), limit = 20) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT id, guild_id, user_id, username, title, link, day_label, date_label, week_key, created_at
             FROM song_suggestions
             WHERE guild_id = ? AND week_key = ?
             ORDER BY datetime(created_at) ASC, id ASC
             LIMIT ?`,
            [guildId, weekKey, limit],
            (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            }
        );
    });
}

function addGameSuggestion(entry) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO game_suggestions (
                guild_id, channel_id, user_id, username, category, suggestion, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                entry.guildId || null,
                entry.channelId || null,
                entry.userId,
                entry.username,
                entry.category,
                entry.suggestion,
                entry.createdAt
            ],
            function(err) {
                if (err) return reject(err);
                resolve({ id: this.lastID });
            }
        );
    });
}

module.exports = {
    getUser,
    updateUser,
    addBalance,
    getTopUsers,
    addSongSuggestion,
    getSongSuggestionsByGuild,
    getCurrentWeekKey,
    addGameSuggestion
};
