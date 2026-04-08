import Discord from "discord.js";

import SlashCommand from "./SlashCommand";
import SlashCommandVoiceChannel from "./SlashCommandVoiceChannel";

export default class SlashCommandVoiceChannelDisconnect extends SlashCommand {

	override readonly command = undefined;

	override async onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): Promise<void> {
		if (!interaction.inCachedGuild()) return;

		let target = interaction.options.getMember("target");
		if (target) {
			if (
				(target !== interaction.member) &&
				(!(await SlashCommand.checkPermission(interaction, interaction.client.discordBOT.app.readConfig().permission.baka.level)))
			) return;
		} else {
			target = interaction.member;
		}

		if (!target) {
			await interaction.reply({
				content: "指定されたメンバーが見つかりません。",
				flags: [
					Discord.MessageFlags.Ephemeral
				]
			});
			return;
		}

		const channel = target.voice.channel;
		if (!channel) {
			await interaction.reply({
				content: "指定されたメンバーはボイスチャンネルに接続していません。",
				flags: [
					Discord.MessageFlags.Ephemeral
				]
			});
			return;
		}
		if (target.id === interaction.client.user.id) {
			await interaction.reply({
				content: "この操作は実行できません。",
				flags: [
					Discord.MessageFlags.Ephemeral
				]
			});
			return;
		}

		await interaction.deferReply();

		await SlashCommandVoiceChannel.kick({
			guild: interaction.guild,
			channel,
			member: target,
			reason: `${interaction.user.id} によって切断されました。`,
			onKick: async () => {
				await interaction.editReply({
					content: `${Discord.userMention(target.id)} は ${Discord.channelMention(channel.id)} で首を括った。`
				});
			},
			onError: async () => {
				await interaction.editReply({
					content: `${Discord.userMention(target.id)} は ${Discord.channelMention(channel.id)} で首を括れなかった。`
				});
			}
		});
	}

}