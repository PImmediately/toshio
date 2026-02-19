import Discord from "discord.js";
import VoiceClient from "./../../VoiceClient";
import SlashCommand from "./SlashCommand";

import fs from "node:fs";
import getNativePath from "./../../../TypeScript/Path";
import path from "node:path";

const voicePath1 = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_shindaraeenen.wav"));
const voicePath2 = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_hitonokokoro.wav"));

export default class SlashCommandVoiceChannelDisconnect extends SlashCommand {

	override readonly command = undefined;

	override async onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): Promise<void> {
		if (!interaction.inCachedGuild()) return;

		let target = interaction.options.getMember("target");
		if (target) {
			if (!(await SlashCommand.checkPermission(interaction, interaction.client.discordBOT.app.readConfig().permission.baka.level))) return;
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

		let connectionCount: number = 0;
		const voiceClient = new VoiceClient(interaction.guild, channel);
		voiceClient.on("connect", async (connectionID) => {
			let hasError: boolean = false;
			connectionCount++;
			const a = (): boolean => connectionID === voiceClient.getConnectionID();

			if (a()) {
				try {
					await voiceClient.play(() => {
						return fs.createReadStream(connectionCount === 1 ? voicePath1 : voicePath2);
					});
				} catch (error) {
					console.error(error);
					hasError = true;
				}
			}

			if ((a()) && (!hasError)) {
				await target.voice.disconnect(`${interaction.user.id} によって切断されました。`);

				await interaction.editReply({
					content: `${Discord.userMention(target.id)} は ${Discord.channelMention(channel.id)} で首を括った。`
				});
			}

			if (a()) {
				try {
					voiceClient.destroy();
				} catch (error) {
					console.error(error);
				}
			}

			if (hasError) await interaction.editReply({
				content: `${Discord.userMention(target.id)} は ${Discord.channelMention(channel.id)} で首を括れなかった。`
			});
		});
		voiceClient.on("disconnect", async () => {
			await voiceClient.connect();
		});
		await voiceClient.connect();
	}

}