const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
            .setName(''/* ex: 'ping' for /ping */)
            .setDescription(''/* description to be displayed in autofill */),
    async execute(interaction) {
             
        // TODO: Implement command code

    },
    
};