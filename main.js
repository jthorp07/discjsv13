const {Client, Intents, Collection} = require('discord.js');
const {TOKEN} = require('./config.json');
const fs = require('fs');
const mysql = require('mysql');
const {Perms} = require('./util/permission.js')

// Holy fuck that's a lot of intention :flushed:
const intent_flags = [Intents.FLAGS.GUILDS, 
    Intents.FLAGS.GUILD_BANS, 
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, 
    Intents.FLAGS.GUILD_MEMBERS, 
    Intents.FLAGS.GUILD_MESSAGES, 
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS, 
    Intents.FLAGS.GUILD_MESSAGE_TYPING, 
    Intents.FLAGS.GUILD_PRESENCES, 
    Intents.FLAGS.GUILD_VOICE_STATES, 
    Intents.FLAGS.GUILD_WEBHOOKS, 
    Intents.FLAGS.DIRECT_MESSAGES, 
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, 
    Intents.FLAGS.DIRECT_MESSAGE_TYPING];

const client = new Client({intents: intent_flags});

/*
  Log in to database
*/
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: DBPASS,
    database: DB,
    insecureAuth: true
});

/*
* Registering Commands
*/
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

/*
  Preparing button vars for potential button handling
*/
let btnCommandsTemp = new Collection();
const btnFiles = fs.readdirSync('./buttons').filter(file => file.endsWith('.js'));
for (const file of btnFiles) {
    const btnCmd = require(`./buttons/${file}`);
    btnCommandsTemp.set(btnCmd.data.customId, btnCmd);
}
const btnCommands = btnCommandsTemp;


/**
 * Bot's listeners
 */
client.on('ready', () => {

    console.log('Ready.');

});

// Command Handling
client.on('interactionCreate', async interaction => {

    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
	if (!command) return;

    // Check user permissions
    if (!Perms.checkPermissions(con, command.permission, interaction.member.id)) {
        interaction.reply(`Insufficient user permissions:\nPermission \'${command.permission}\'`)
    }

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}

});

client.on('interactionCreate', (interaction) => {
    if (!interaction.isButton()) return

    // Handle buttons here...
    const btnCommand = btnCommands.get(interaction.customId);
    if (!btnCommand) {
        await interaction.reply(`This button doesn't have a registered command.\n
                                Please send a report to a bot developer to have this fixed.`);
        return;
    }

    // Check user permissions
    if (!Perms.checkPermissions(con, btnCommand.data.permissions, interaction.member.id)) {
        interaction.reply(`Insufficient user permissions:\nPermission \'${btnCommand.data.permissions}\'`)
    }

    try {
        await btnCommand.btnExecute(interaction);
    } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'There was an error while executing this button\'s command!', ephemeral: true});
    }

    

});

client.login(TOKEN);