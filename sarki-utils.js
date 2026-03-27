const DEFAULT_TIMEZONE = 'Europe/Istanbul';

function isYouTubeUrl(value) {
    try {
        const url = new URL(value);
        const host = url.hostname.replace(/^www\./, '').toLowerCase();
        return ['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'].includes(host);
    } catch {
        return false;
    }
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

module.exports = {
    getDateLabel,
    getWeekdayLabel,
    isYouTubeUrl
};
