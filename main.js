const { Client, Intents, Collection } = require("discord.js");
const { TOKEN, SQL } = require("./config.json");
const fs = require("fs");
const mssql = require("mssql");
const Perms = require("./util/permission.js");

// Holy crap that's a lot of intention :flushed:
const intent_flags = [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	Intents.FLAGS.GUILD_MESSAGE_TYPING,
	Intents.FLAGS.GUILD_PRESENCES,
	Intents.FLAGS.DIRECT_MESSAGES,
	Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
	Intents.FLAGS.DIRECT_MESSAGE_TYPING,
];

const client = new Client({ intents: intent_flags });

/*
  Log in to database
*/
console.log(`[Startup]: Requesting database connection`);
const pool = new mssql.ConnectionPool(SQL);
/**@type {mssql.ConnectionPool} */
var con;
pool.connect()
	.then((conPool) => {
		con = conPool;
		console.log(`[Startup]: Database connection established`);
	})
	.catch((err) => {
		console.log(err);
		return;
	});


/*
 * Registering Commands
 */
client.commands = new Collection();
console.log(`[Startup]: Reading in slash commands`);
const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	console.log(`  [Slash Commands]: Set command '${command.data.name}'`);
	client.commands.set(command.data.name, command);
}
console.log(`  [Slash Commands]: Finished`);

/*
  Preparing button commands for potential button handling
*/
let btnCommandsTemp = new Collection();
console.log(`[Startup]: Reading in button commands`);
const btnFiles = fs.readdirSync("./buttons").filter((file) => file.endsWith(".js"));
for (const file of btnFiles) {
	const btnCmd = require(`./buttons/${file}`);
	console.log(`  [Buttons]: Set button with ID '${btnCmd.data.customId}'`);
	btnCommandsTemp.set(btnCmd.data.customId, btnCmd);
}
const btnCommands = btnCommandsTemp;
console.log(`  [Buttons]: Finished`);

/*
  Preparing selectmenu commands for potential selectmenu handling
*/
let smCommandsTemp = new Collection();
console.log(`[Startup]: Reading in SelectMenu commands`);
const smFiles = fs.readdirSync("./select-menus").filter((file) => file.endsWith(".js"));
for (const file of smFiles) {
	const smCmd = require(`./select-menus/${file}`);
	console.log(`  [SelectMenus]: Set menu with ID '${smCmd.data.customId}'`);
	smCommandsTemp.set(smCmd.data.customId, smCmd);
}
const smCommands = smCommandsTemp;
console.log(`  [SelectMenus]: Finished`);

/**
 * Bot's listeners
 */
client.on("ready", () => {
	console.log("Bot Ready.");
});

// Command Handling
client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	// Check user permissions
	Perms.checkPermissions(con, command.permissions, interaction.member.id)
		.then((perms) => {
			if (!perms) {
				interaction.reply(`Insufficient user permissions:\n\`\`\`Permission \'${command.permissions}\' required\`\`\``);
				return;
			}
			try {
				command.execute(interaction, con).then(() => {
					console.log(`  Command executed`);
				});
			} catch (error) {
				console.log(`  An uncaught error occured in command execution`);
				console.log(`    Error: ${error}`);
				interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
			}
		})
		.catch((err) => {
			console.log(err);
			return;
		});
});

client.on("interactionCreate", (interaction) => {
	if (!interaction.isSelectMenu()) return;

	// Handle selectmenus here...
	const smCommand = smCommands.get(interaction.customId);
	if (!smCommand) {
		interaction.reply(
			`This SelectMenu doesn't have a registered command. (ID = '${interaction.customId}')\nPlease send a report to a bot developer to have this fixed.`
		);
		return;
	}

	// WITH PERMISSIONS
	Perms.checkPermissions(con, smCommand.data.permissions, interaction.user.id).then((result) => {
		if (result == true) {
			try {
				smCommand.btnExecute(interaction, con);
				console.log(`SelectMenu handled`);
			} catch (err) {
				console.error(err);
				interaction.reply({ content: "There was an error while executing this button's command!", ephemeral: true });
				return;
			}
		} else {
			interaction.reply(`Insufficient user permissions:\nPermission \'${smCommand.data.permissions}\'`);
			console.log(`Insufficient permissions: Halting button handler`);
		}
	});
});

// Button interactions
client.on("interactionCreate", (interaction) => {
	if (!interaction.isButton()) return;

	// Handle buttons here...
	var btnCommand;
	if (interaction.customId.startsWith("combatselect")) {
		btnCommand = btnCommands.get("combatselect");
		if (!btnCommand) {
			interaction.reply(
				`This button doesn't have a registered command. (ID = '${interaction.customId}')\nPlease send a report to a bot developer to have this fixed.`
			);
			return;
		}
	} else {
		btnCommand = btnCommands.get(interaction.customId);
		if (!btnCommand) {
			interaction.reply(
				`This button doesn't have a registered command. (ID = '${interaction.customId}')\nPlease send a report to a bot developer to have this fixed.`
			);
			return;
		}
	}

	// WITH PERMISSIONS
	Perms.checkPermissions(con, btnCommand.data.permissions, interaction.user.id).then((result) => {
		if (result == true) {
			try {
				btnCommand.btnExecute(interaction, con);
				console.log(`Button handled`);
			} catch (err) {
				console.error(err);
				interaction.reply({ content: "There was an error while executing this button's command!", ephemeral: true });
				return;
			}
		} else {
			interaction.reply(`Insufficient user permissions:\nPermission \'${btnCommand.data.permissions}\'`);
		}
	});
});

client.login(TOKEN);
