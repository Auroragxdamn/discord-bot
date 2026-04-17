const Module = require('module');

let patched = false;

function ensureSoundCloudStub() {
    if (patched) {
        return;
    }

    const originalLoad = Module._load;

    Module._load = function(request, parent, isMain) {
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

const discordPlayer = require('discord-player');

module.exports = {
    ...discordPlayer,
    useMainPlayer: discordPlayer.useMainPlayer || discordPlayer.useMasterPlayer
};
