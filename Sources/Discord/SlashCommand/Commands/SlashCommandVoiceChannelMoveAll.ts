import Discord from "discord.js";

import SlashCommand from "./SlashCommand";
import SlashCommandVoiceChannel from "./SlashCommandVoiceChannel";

export default class SlashCommandVoiceChannelMoveAll extends SlashCommand {

	override readonly command = undefined;

	override async onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): Promise<void> {
		if (!interaction.inCachedGuild()) return;
		if (!(await SlashCommand.checkPermission(interaction, interaction.client.discordBOT.app.readConfig().permission.baka.level))) return;

		let from: Discord.Channel | null = interaction.options.getChannel("from", false, [Discord.ChannelType.GuildVoice]);
		if (from) {
			if (!from.isVoiceBased()) {
				await interaction.reply({
					content: "移動元チャンネルはボイスチャンネルである必要があります。",
					flags: [
						Discord.MessageFlags.Ephemeral
					]
				});
				return;
			}
		} else {
			from = interaction.member.voice.channel;
			if (!from) {
				await interaction.reply({
					content: "チャンネルが見つかりません。",
					flags: [
						Discord.MessageFlags.Ephemeral
					]
				});
				return;
			}
		}

		const to = interaction.options.getChannel("to", true, [Discord.ChannelType.GuildVoice]);
		if (!to.isVoiceBased()) {
			await interaction.reply({
				content: "移動先チャンネルはボイスチャンネルである必要があります。",
				flags: [
					Discord.MessageFlags.Ephemeral
				]
			});
			return;
		}

		if (from.id === to.id) {
			await interaction.reply({
				content: "移動元チャンネルと移動先チャンネルは異なる必要があります。",
				flags: [
					Discord.MessageFlags.Ephemeral
				]
			});
			return;
		}
		if (from.members.size === 0) {
			await interaction.reply({
				content: "移動元チャンネルにメンバーがいません。",
				flags: [
					Discord.MessageFlags.Ephemeral
				]
			});
			return;
		}

		await interaction.deferReply();

		const conditionMinPermissionLevel = interaction.options.getInteger("condition_min_permission_level", false) ?? undefined;
		const conditionNot = interaction.options.getBoolean("condition_not") ?? false;

		await SlashCommandVoiceChannel.moveAll({
			guild: interaction.guild,
			fromChannel: from,
			toChannel: to,
			condition: {
				not: conditionNot,
				minPermissionLevel: conditionMinPermissionLevel,
			},
			reason: `${interaction.guild.client.user.id} によって移動されました。`,
			onMoveAll: async (members) => {
				await interaction.editReply({
					content: `${Discord.channelMention(from.id)} にいた${members.size}人は最高速度で ${Discord.channelMention(to.id)} までブチ抜かれた。`
				});
			},
			onError: async () => {
				await interaction.editReply({
					content: `最高速度で ${Discord.channelMention(from.id)} を通過した。`
				});
			}
		});
	}

}