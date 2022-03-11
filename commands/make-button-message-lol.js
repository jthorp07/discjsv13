const { SlashCommandBuilder } = require('@discordjs/builders');
const {MessageActionRow, MessageButton} = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('buttonzlolz')
		.setDescription('Makes a message with a big array of buttons'),
	async execute(interaction) {
        let msgContent = "Buttonz";
        let rows = [];
        for (let i = 0; i < 3; i++) {
            rows[i] = new MessageActionRow();
            let comps = [];
            for (let j = 0; j < 5; j++) {
                comps.push(new MessageButton().setCustomId(`${i} ${j}`).setLabel('Yes').setStyle('PRIMARY'));
            }
            rows[i].addComponents(comps);
        }
        msg = {content:msgContent,components:rows};
        console.log(`NOW THATS A MESSAGE\n${JSON.stringify(msg)}`)        
        await interaction.reply(msg);
	},
};