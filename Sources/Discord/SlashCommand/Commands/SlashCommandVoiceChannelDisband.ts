import Discord from "discord.js";
import VoiceClient from "./../../VoiceClient";
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

		const voiceClient = new VoiceClient(interaction.guild, channel);
		voiceClient.on("connect", async (connectionID) => {
			const a = (): boolean => connectionID === voiceClient.getConnectionID();

			if (a()) await voiceClient.play(() => fs.createReadStream(voicePath));

			if (a()) {
				const targetMembers = channel.members.filter(member => member.id !== interaction.client.user.id);
				for (const member of targetMembers.values()) {
					try {
						member.voice.disconnect(`${interaction.user.id} によって切断されました。`);
					} catch (error) {
						console.error(error);
					}
					await new Promise((resolve) => setTimeout(resolve, SlashCommandVoiceChannelDisband.DISCONNECT_COOLDOWN));
				}

				await interaction.editReply({
					content: `${Discord.channelMention(channel.id)} にいたアッチ側に立っていない${targetMembers.size}人は切断された。`
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