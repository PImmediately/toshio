import Discord from "discord.js";
import SlashCommand from "./SlashCommand";

import SlashCommandVoiceChannelDisconnect from "./SlashCommandVoiceChannelDisconnect";
import SlashCommandVoiceChannelDisband from "./SlashCommandVoiceChannelDisband";
import SlashCommandVoiceChannelMoveAll from "./SlashCommandVoiceChannelMoveAll";

export default class SlashCommandVoiceChannel extends SlashCommand {

	private readonly voiceChannelDisconnect = new SlashCommandVoiceChannelDisconnect();
	private readonly voiceChannelDisband = new SlashCommandVoiceChannelDisband();
	private readonly voiceChannelMoveAll = new SlashCommandVoiceChannelMoveAll();

	override readonly command = new Discord.SlashCommandBuilder()
		.setName("vc")
		.setDescription("ボイスチャンネルに関するコマンド")
		.addSubcommand((group) => {
			return group
				.setName("disconnect")
				.setDescription("ボイスチャンネルにいるメンバーを切断します。")
				.addUserOption((option) => {
					return option
						.setName("target")
						.setDescription("メンバー");
				});
		})
		.addSubcommand((group) => {
			return group
				.setName("disband")
				.setDescription("ボイスチャンネルを解散します。")
				.addChannelOption((option) => {
					return option
						.setName("target")
						.setDescription("チャンネル");
				});
		})
		.addSubcommand((group) => {
			return group
				.setName("move-all")
				.setDescription("移動元ボイスチャンネルにいる全メンバーを移動先ボイスチャンネルに移動します。")
				.addChannelOption((option) => {
					return option
						.setName("to")
						.setDescription("移動先ボイスチャンネル")
						.setRequired(true);
				})
				.addChannelOption((option) => {
					return option
						.setName("from")
						.setDescription("移動元ボイスチャンネル")
						.setRequired(false);
				});
		});

	override onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): void {
		switch (interaction.options.getSubcommand()) {
			case "disconnect": {
				this.voiceChannelDisconnect.onExecute(interaction);
				return;
			}
			case "disband": {
				this.voiceChannelDisband.onExecute(interaction);
				return;
			}
			case "move-all": {
				this.voiceChannelMoveAll.onExecute(interaction);
				return;
			}
		}
	}

}