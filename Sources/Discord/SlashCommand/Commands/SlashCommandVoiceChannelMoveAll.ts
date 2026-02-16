import Discord from "discord.js";
import * as DiscordVoice from "@discordjs/voice";
import SlashCommand from "./SlashCommand";

import fs from "node:fs";
import getNativePath from "./../../../TypeScript/Path";
import path from "node:path";

const voicePath = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_saikousokudo.wav"));

export default class SlashCommandVoiceChannelMoveAll extends SlashCommand {

	override readonly command = undefined;

	private static readonly SET_CHANNEL_COOLDOWN = 1000;

	override async onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): Promise<void> {
		if (!interaction.inCachedGuild()) return;
		if (!(await SlashCommand.checkPermission(interaction, interaction.client.discordBOT.app.readConfig().permission.baka.level))) return;

		const _from = interaction.options.getChannel("from", true);
		if (_from.type !== Discord.ChannelType.GuildVoice) {
			await interaction.reply({
				content: "移動元チャンネルはボイスチャンネルでなければなりません。",
				flags: [
					Discord.MessageFlags.Ephemeral
				]
			});
			return;
		}
		const from = _from as Discord.VoiceChannel;

		const _to = interaction.options.getChannel("to", true);
		if (_to.type !== Discord.ChannelType.GuildVoice) {
			await interaction.reply({
				content: "移動先チャンネルはボイスチャンネルでなければなりません。",
				flags: [
					Discord.MessageFlags.Ephemeral
				]
			});
			return;
		}
		const to = _to as Discord.VoiceChannel;

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
				content: "移動元チャンネルにユーザーがいません。",
				flags: [
					Discord.MessageFlags.Ephemeral
				]
			});
			return;
		}

		await interaction.deferReply({
			flags: [
				Discord.MessageFlags.Ephemeral
			]
		});

		const connection = DiscordVoice.joinVoiceChannel({
			channelId: from.id,
			guildId: interaction.guild.id,
			adapterCreator: interaction.guild.voiceAdapterCreator,
			selfMute: false,
			selfDeaf: false
		});
		try {
			await DiscordVoice.entersState(connection, DiscordVoice.VoiceConnectionStatus.Ready, 10_000);
		} catch (error) {
			console.error(error);
			connection.destroy();
			return;
		}

		const player = DiscordVoice.createAudioPlayer();
		const resource = DiscordVoice.createAudioResource(fs.createReadStream(voicePath));
		player.play(resource);
		connection.subscribe(player);
		try {
			await DiscordVoice.entersState(player, DiscordVoice.AudioPlayerStatus.Idle, 10_000);
		} catch (error) {
			console.error(error);
			connection.destroy();
			return;
		}

		const botID = interaction.client.user.id;
		const botMember = from.members.get(botID);
		if (!botMember) return;

		const targetMembers = from.members.filter(member => member.id !== botMember.id);
		for (const member of targetMembers.values()) {
			try {
				member.voice.setChannel(to, `${interaction.user.id} によって移動されました。`);
			} catch (error) {
				console.error(error);
			}
			await new Promise((resolve) => setTimeout(resolve, SlashCommandVoiceChannelMoveAll.SET_CHANNEL_COOLDOWN));
		}
		connection.destroy();

		await interaction.editReply({
			content: "実行が完了しました。"
		});
	}

}