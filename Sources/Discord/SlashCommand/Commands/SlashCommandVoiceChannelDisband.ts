import Discord from "discord.js";

import SlashCommand from "./SlashCommand";
import SlashCommandVoiceChannel from "./SlashCommandVoiceChannel";

export default class SlashCommandVoiceChannelDisband extends SlashCommand {

	override readonly command = undefined;

	override async onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): Promise<void> {
		if (!interaction.inCachedGuild()) return;
		if (!(await SlashCommand.checkPermission(interaction, interaction.client.discordBOT.app.readConfig().permission.baka.level))) return;

		let channel: Discord.Channel | null = interaction.options.getChannel("target", false, [Discord.ChannelType.GuildVoice]);
		if (channel) {
			if (!channel.isVoiceBased()) {
				await interaction.reply({
					content: "チャンネルはボイスチャンネルである必要があります。",
					flags: [
						Discord.MessageFlags.Ephemeral
					]
				});
				return;
			}
		} else {
			channel = interaction.member.voice.channel;
			if (!channel) {
				await interaction.reply({
					content: "チャンネルが見つかりません。",
					flags: [
						Discord.MessageFlags.Ephemeral
					]
				});
				return;
			}
		}

		if (channel.members.size === 0) {
			await interaction.reply({
				content: "チャンネルにメンバーがいません。",
				flags: [
					Discord.MessageFlags.Ephemeral
				]
			});
			return;
		}

		await interaction.deferReply();

		await SlashCommandVoiceChannel.kickAll({
			guild: interaction.guild,
			channel: channel,
			reason: `${interaction.guild.client.user.id} によって切断されました。`,
			onKickAll: async (members) => {
				await interaction.editReply({
					content: `${Discord.channelMention(channel.id)} にいたアッチ側に立っていない${members.size}人は切断された。`
				});
			},
			onError: async () => {
				await interaction.editReply({
					content: `${Discord.channelMention(channel.id)} は既にアッチ側に立っている。`
				});
			}
		});
	}
	
}