import * as dotenv from "dotenv";
dotenv.config();

import * as Haiku from "ts-haiku";

import DatabaseSenryu from "./Database/DatabaseSenryu";

import DiscordBOT from "./Discord/DiscordBOT";
import * as Config from "./Config";

export default class Application {

	public readonly databaseSenryu = new DatabaseSenryu();

	public readonly discordBot = new DiscordBOT(this);

	public readConfig(): Config.Configuration { return Config.read(); }

}

(async () => {
	console.log("Initializing...");
	await Haiku.init();
	console.log("Initialized.");
	
	process.on("unhandledRejection", (reason, promise) => {
		console.error("Unhandled Rejection:", reason);
	});
	process.on("uncaughtException", (error) => {
		console.error("Uncaught Exception:", error);
	});

	const app = new Application();
	await app.discordBot.login(process.env.DISCORD_BOT_TOKEN);
})();