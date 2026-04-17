const Module = require('module');

let patched = false;

// Prefer a maintained YouTube backend over ytdl-core for extractor stability.
if (!process.env.DP_FORCE_YTDL_MOD) {
    process.env.DP_FORCE_YTDL_MOD = '@distube/ytdl-core';
}

function ensureSoundCloudStub() {
    if (patched) {
        return;
    }

    const originalLoad = Module._load;

    Module._load = function(request, parent, isMain) {
        // discord-player v6 hard-requires soundcloud-scraper even when SoundCloud is unused.
        if (request === 'soundcloud-scraper') {
            return {
                validateURL() {
                    return false;
                }
            };
        }

        return originalLoad.apply(this, arguments);
    };

    patched = true;
}

ensureSoundCloudStub();

module.exports = require('discord-player');
