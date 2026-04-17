const { Events, MessageFlags } = require('discord.js');

function normalizeInteractionOptions(options) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
        return options;
    }

    if (!Object.prototype.hasOwnProperty.call(options, 'ephemeral')) {
        return options;
    }

    const normalized = { ...options };
    const isEphemeral = normalized.ephemeral;
    delete normalized.ephemeral;

    if (isEphemeral && normalized.flags === undefined) {
        normalized.flags = MessageFlags.Ephemeral;
    }

    return normalized;
}

function patchInteractionResponses(interaction) {
    for (const methodName of ['reply', 'followUp']) {
        const originalMethod = interaction[methodName].bind(interaction);

        interaction[methodName] = (options) => originalMethod(normalizeInteractionOptions(options));
    }
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        patchInteractionResponses(interaction);

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return interaction.reply({
                content: 'Bu komut su anda bot tarafinda kullanilamiyor. Bot yeniden baslatilmali veya komut yuklemesi eksik olabilir.',
                ephemeral: true
            });
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Bu komut çalıştırılırken bir hata oluştu!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Bu komut çalıştırılırken bir hata oluştu!', ephemeral: true });
            }
        }
    },
};
