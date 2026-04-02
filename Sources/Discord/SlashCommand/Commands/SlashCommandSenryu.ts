import Discord from "discord.js";
import SlashCommand from "./SlashCommand";

import SlashCommandSenryuRank from "./SlashCommandSenryuRank";

export default class SlashCommandSenryu extends SlashCommand {

	private readonly senryuRank = new SlashCommandSenryuRank();

	override readonly command = new Discord.SlashCommandBuilder()
		.setName("senryu")
		.setDescription("川柳に関するコマンド")
		.addSubcommand((group) => {
			return group
				.setName("rank")
				.setDescription("川柳ランキングを送信します。");
		});

	override onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): void {
		switch (interaction.options.getSubcommand()) {
			case "rank": {
				this.senryuRank.onExecute(interaction);
				return;
			}
		}
	}

}