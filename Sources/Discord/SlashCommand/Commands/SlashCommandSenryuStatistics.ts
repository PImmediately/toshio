import Discord from "discord.js";
import SlashCommand from "./SlashCommand";

import SlashCommandSenryuStatisticsDetection from "./SlashCommandSenryuStatisticsDetection";
import SlashCommandSenryuStatisticsDictionary from "./SlashCommandSenryuStatisticsDictionary";
import SlashCommandSenryuStatisticsCreation from "./SlashCommandSenryuStatisticsCreation";

export default class SlashCommandSenryuStatistics extends SlashCommand {

	private readonly senryuStatisticsRank = new SlashCommandSenryuStatisticsDetection();
	private readonly senryuStatisticsDictionary = new SlashCommandSenryuStatisticsDictionary();
	private readonly senryuStatisticsCreation = new SlashCommandSenryuStatisticsCreation();

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
			case "creation": {
				this.senryuStatisticsCreation.onExecute(interaction);
				return;
			}
		}
	}

}