import Discord from "discord.js";
import * as DiscordVoice from "@discordjs/voice";
import SlashCommand from "./SlashCommand";

import fs from "node:fs";
import getNativePath from "./../../../TypeScript/Path";
import path from "node:path";

const voicePath = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_attigawa.wav"));

export default class SlashCommandVoiceChannelDisband extends SlashCommand {

	override readonly command = undefined;

	private static readonly DISCONNECT_COOLDOWN = 200;

	override async onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): Promise<void> {
		if (!interaction.inCachedGuild()) return;
		if (!(await SlashCommand.checkPermission(interaction, interaction.client.discordBOT.app.readConfig().permission.baka.level))) return;

		let channel = interaction.options.getChannel("target");
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

		const connection = DiscordVoice.joinVoiceChannel({
			channelId: channel.id,
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
		const botMember = channel.members.get(botID);
		if (!botMember) return;

		const targetMembers = channel.members.filter(member => member.id !== botMember.id);
		for (const member of targetMembers.values()) {
			try {
				member.voice.disconnect(`${interaction.user.id} によって切断されました。`);
			} catch (error) {
				console.error(error);
			}
			await new Promise((resolve) => setTimeout(resolve, SlashCommandVoiceChannelDisband.DISCONNECT_COOLDOWN));
		}
		connection.destroy();

		await interaction.editReply({
			content: `${Discord.channelMention(channel.id)} にいたアッチ側に立っていない${targetMembers.size}人は切断された。`
		});
	}

}