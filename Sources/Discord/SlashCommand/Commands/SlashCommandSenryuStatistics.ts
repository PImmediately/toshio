import Discord from "discord.js";
import SlashCommand from "./SlashCommand";

import SlashCommandSenryuStatisticsDetection from "./SlashCommandSenryuStatisticsDetection";
import SlashCommandSenryuStatisticsDictionary from "./SlashCommandSenryuStatisticsDictionary";

export default class SlashCommandSenryuStatistics extends SlashCommand {

	private readonly senryuStatisticsRank = new SlashCommandSenryuStatisticsDetection();
	private readonly senryuStatisticsDictionary = new SlashCommandSenryuStatisticsDictionary();

	override readonly command = undefined;

	override async onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): Promise<void> {
		switch (interaction.options.getSubcommand()) {
			case "detection": {
				this.senryuStatisticsRank.onExecute(interaction);
				return;
			}
			case "dictionary": {
				this.senryuStatisticsDictionary.onExecute(interaction);
				return;
			}
		}
	}

}