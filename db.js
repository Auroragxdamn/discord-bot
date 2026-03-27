const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

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
});

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

module.exports = {
    getUser,
    updateUser,
    addBalance,
    getTopUsers
};
