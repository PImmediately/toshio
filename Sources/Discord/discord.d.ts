import type Discord from "discord.js";
import type DiscordBOT from "./DiscordBOT";
import type SlashCommand from "./SlashCommand/Commands/SlashCommand";

declare module "discord.js" {
	export interface Client {
		discordBOT: DiscordBOT;
		commands: Discord.Collection<string, SlashCommand>;
	}
};