import Discord from "discord.js";
import SlashCommand from "./SlashCommand";

import SlashCommandVoiceChannelMoveAll from "./SlashCommandVoiceChannelMoveAll";

export default class SlashCommandVoiceChannel extends SlashCommand {

	private readonly voiceChannelMoveAll = new SlashCommandVoiceChannelMoveAll();

	override readonly command = new Discord.SlashCommandBuilder()
		.setName("vc")
		.setDescription("ボイスチャンネルに関するコマンド")
		.addSubcommand((group) => {
			return group
				.setName("move-all")
				.setDescription("移動元ボイスチャンネルにいる全メンバーを移動先ボイスチャンネルに移動します。")
				.addChannelOption((option) => {
					return option
						.setName("from")
						.setDescription("移動元ボイスチャンネル")
						.setRequired(true);
				})
				.addChannelOption((option) => {
					return option
						.setName("to")
						.setDescription("移動先ボイスチャンネル")
						.setRequired(true);
				});
		});

	override onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): void {
		switch (interaction.options.getSubcommand()) {
			case "move-all": {
				this.voiceChannelMoveAll.onExecute(interaction);
				return;
			}
		}
	}

}