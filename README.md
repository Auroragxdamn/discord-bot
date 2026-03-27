# 🎵🎮 Discord Müzik ve Ekonomi Botu

A feature-rich Discord bot built with **Discord.js v14**, **discord-player**, and **sqlite3**, featuring high-quality YouTube music playback and a complete economy/casino system.

## ✨ Özellikler

- **Müzik Sistemi** — YouTube linkleri üzerinden yüksek kaliteli ses çalma.
- **Ekonomi ve Casino** — Bakiye sistemi, günlük ödüller, blackjack, slot, yazı tura ve zar oyunları.
- **DAVE Protocol Ready** — Discord'un yeni Uçtan Uca Şifreleme (E2EE) ses kanallarını tam destekler.
- **Slash Commands** — Modern müzik ve ekonomi komutları.
- **Idle Timeout** — Şarkı bittiğinde veya kanal boşaldığında 5 dakika boyunca odada bekler, sonra ayrılır.
- **SQLite Veritabanı** — Kullanıcı bakiyeleri ve verileri için hafif ve hızlı yerel veritabanı.

## 🚀 Başlangıç

### Gereksinimler

- **Node.js** v16.9+ (LTS önerilir)
- **FFmpeg** yüklü ve PATH'e eklenmiş olmalı
- [Discord Developer Portal](https://discord.com/developers/applications) üzerinden alınmış bir Bot Token
- **Application ID** (Client ID)

### Kurulum

```bash
git clone <your-repo-url>
cd discord-bot
npm install
```

### Yapılandırma

Bot yapılandırması ortam değişkenleri (`.env` dosyası) ile sağlanır:

```env
TOKEN=your_bot_token
CLIENT_ID=your_application_id
```

### Çalıştırma

```bash
npm run dev
```

Bu komut:
1. Slash komutlarını sunucunuza kaydeder (`deploy-commands.js`).
2. Botu `nodemon` ile başlatır.

## 🤖 Komutlar

### 🎵 Müzik Komutları
| Komut | Açıklama |
|---------|-------------|
| `/play <link>` | Sadece YouTube linki ile şarkı çal |
| `/skip` | Çalınan şarkıyı atla |
| `/queue` | Sıradaki şarkıları gör |
| `/stop` | Müziği durdur ve kanaldan ayrıl |
| `/sarki oneri <link> ` | Haftalık şarkı listesine şarkı önerisi ekle |
| `/sarki listele ` | Haftalık öneri şarkı listesini görüntüle|

### 💰 Ekonomi ve Casino Komutları
| Komut | Açıklama |
|---------|-------------|
| `/bakiye` | Mevcut bakiyenizi (veya başkasınınkini) gösterir |
| `/baltop` | En zengin kullanıcılar sıralamasını gösterir |
| `/gunluk` | Günlük para ödülünüzü alırsınız |
| `/gonder` | Başka bir kullanıcıya para gönderirsiniz |
| `/blackjack` | Krupiyeye karşı Blackjack oynarsınız |
| `/coinflip` | Yazı tura atarak bahsinizin iki katını kazanma şansı yakalarsınız |
| `/slot` | Slot makinesinde şansınızı denersiniz |
| `/zar` | Zar atarak bahis oynarsınız |

## ☁️ Deployment (Dokploy)

Bu bot **Dokploy** üzerinde Dockerfile ile dağıtılmak üzere yapılandırılmıştır.

1. Dokploy'da GitHub deponuza bağlı yeni bir uygulama oluşturun.
2. **Build Type** kısmını **Dockerfile** olarak seçin.
3. **Environment** sekmesine `TOKEN` ve `CLIENT_ID` değişkenlerini ekleyin.
4. **Deploy** butonuna tıklayın.

## 📁 Proje Yapısı

```
discord-bot/
├── commands/           # Müzik ve Ekonomi Slash komutları
├── events/             # Olay dinleyicileri (interactionCreate, ready)
├── index.js            # Ana giriş dosyası (Bot başlangıç)
├── db.js               # SQLite veritabanı işlemleri
├── deploy-commands.js  # Komut kayıt aracı
├── Dockerfile          # Multi-stage Docker yapılandırması
├── .dockerignore       # Docker dışı dosyalar
├── package.json        # Bağımlılıklar
└── .gitignore
```

## 🛠️ Teknolojiler

- [Discord.js](https://discord.js.org/) v14
- [discord-player](https://discord-player.js.org/) v7
- [sqlite3](https://github.com/TryGhost/node-sqlite3)
- [youtube-dl-exec](https://github.com/microlinkhq/youtube-dl-exec) (yt-dlp)
- [FFmpeg](https://ffmpeg.org/)

## 📝 License

ISC
