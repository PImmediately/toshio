import * as dotenv from "dotenv";
dotenv.config();

import Discord from "discord.js";
import DiscordBOT from "./../DiscordBOT";

class SlashCommandRegisterer {

	private commandJSONs = new Array<Discord.RESTPostAPIChatInputApplicationCommandsJSONBody>();

	public constructor() {
		const commands = DiscordBOT.getDefinedCommands(`${__dirname}/Commands`);
		commands.forEach((command) => {
			if (!command.command) {
				return;
			}
			this.commandJSONs.push(command.command.toJSON());
		});
	}

	public async register(token: string, clientID: string): Promise<void> {
		const rest = new Discord.REST({
			version: String(10)
		});
		rest.setToken(token);

		console.log(`Registering for ${clientID} ...`);
		console.log(`  -> Started refreshing ${this.commandJSONs.length} application (/) commands.`);

		const fullRoute = Discord.Routes.applicationCommands(clientID);
		const options: Discord.RequestData = {
			body: this.commandJSONs
		};
		try {
			const data = await rest.put(fullRoute, options) as Discord.RESTPostAPIChatInputApplicationCommandsJSONBody[];
			console.log(`  -> Successfully reloaded ${data.length} application (/) commands.`);
		} catch (error) {
			console.error(`  -> Failed to reloaded: ${error}`);
		}
	}

}

(async () => {
	const registerer = new SlashCommandRegisterer();
	await registerer.register(process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_BOT_CLIENT_ID);
})();