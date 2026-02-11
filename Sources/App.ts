import * as dotenv from "dotenv";
dotenv.config();

import DiscordBOT from "./Discord/DiscordBOT";

export default class Application {

	public readonly discordBot = new DiscordBOT(this);
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