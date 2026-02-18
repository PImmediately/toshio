import Discord from "discord.js";
import VoiceClient from "./../../VoiceClient";
import SlashCommand from "./SlashCommand";

import fs from "node:fs";
import getNativePath from "./../../../TypeScript/Path";
import path from "node:path";

const voicePath1 = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_saikousokudo.wav"));
const voicePath2 = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_hitonokokoro.wav"));

export default class SlashCommandVoiceChannelMoveAll extends SlashCommand {

	override readonly command = undefined;

	private static readonly SET_CHANNEL_COOLDOWN = 200;

	override async onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): Promise<void> {
		if (!interaction.inCachedGuild()) return;
		if (!(await SlashCommand.checkPermission(interaction, interaction.client.discordBOT.app.readConfig().permission.baka.level))) return;

		let from = interaction.options.getChannel("from");
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

		const to = interaction.options.getChannel("to", true);
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

		let connectionCount: number = 0;
		const voiceClient = new VoiceClient(interaction.guild, from);
		voiceClient.on("connect", async (connectionID) => {
			connectionCount++;
			const a = (): boolean => connectionID === voiceClient.getConnectionID();

			if (a()) {
				await voiceClient.play(() => {
					return fs.createReadStream(connectionCount === 1 ? voicePath1 : voicePath2);
				});
			}

			if (a()) {
				const targetMembers = from.members.filter(member => member.id !== interaction.client.user.id);
				for (const member of targetMembers.values()) {
					try {
						member.voice.setChannel(to, `${interaction.user.id} によって移動されました。`);
					} catch (error) {
						console.error(error);
					}
					await new Promise((resolve) => setTimeout(resolve, SlashCommandVoiceChannelMoveAll.SET_CHANNEL_COOLDOWN));
				}

				await interaction.editReply({
					content: `${Discord.channelMention(from.id)} にいた${targetMembers.size}人は最高速度で ${Discord.channelMention(to.id)} までブチ抜かれた。`
				});
			}

			if (a()) voiceClient.destroy();
		});
		voiceClient.on("disconnect", async () => {
			await voiceClient.connect();
		});
		await voiceClient.connect();
	}

}