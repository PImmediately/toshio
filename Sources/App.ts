import * as dotenv from "dotenv";
dotenv.config();

import DiscordBOT from "./Discord/DiscordBOT";
import * as Config from "./Config";

export default class Application {

	public readonly discordBot = new DiscordBOT(this);

	public readConfig(): Config.Configuration { return Config.read(); }

}

(async () => {
	process.on("unhandledRejection", (reason, promise) => {
		console.error("Unhandled Rejection:", reason);
	});
	process.on("uncaughtException", (error) => {
		console.error("Uncaught Exception:", error);
	});

	const app = new Application();

	await app.discordBot.login(process.env.DISCORD_BOT_TOKEN);
})();