import Discord from "discord.js";
import SlashCommand from "./SlashCommand";

import SlashCommandSenryuStatistics from "./SlashCommandSenryuStatistics";

export default class SlashCommandSenryu extends SlashCommand {

	private readonly senryuStatistics = new SlashCommandSenryuStatistics();

	override readonly command = new Discord.SlashCommandBuilder()
		.setName("senryu")
		.setDescription("川柳に関するコマンド")
		.addSubcommandGroup((group) => {
			return group
				.setName("statistics")
				.setDescription("川柳の統計に関するコマンド")
				.addSubcommand((subgroup) => {
					return subgroup
						.setName("detection")
						.setDescription("川柳が検出された回数を送信します。");
				})
				.addSubcommand((subgroup) => {
					return subgroup
						.setName("dictionary")
						.setDescription("句の出現回数を送信します。");
				});
		});

	override onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): void {
		switch (interaction.options.getSubcommandGroup()) {
			case "statistics": {
				this.senryuStatistics.onExecute(interaction);
				return;
			}
		}
	}

}