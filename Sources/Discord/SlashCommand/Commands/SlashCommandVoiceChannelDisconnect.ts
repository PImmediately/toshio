import Discord from "discord.js";
import * as DiscordVoice from "@discordjs/voice";
import SlashCommand from "./SlashCommand";

import fs from "node:fs";
import getNativePath from "./../../../TypeScript/Path";
import path from "node:path";

const voicePath = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_shindaraeenen.wav"));

export default class SlashCommandVoiceChannelDisconnect extends SlashCommand {

	override readonly command = undefined;

	override async onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): Promise<void> {
		if (!interaction.inCachedGuild()) return;
		if (!(await SlashCommand.checkPermission(interaction, interaction.client.discordBOT.app.readConfig().permission.baka.level))) return;

		const target = interaction.options.getUser("target", true);
		const targetMember = interaction.guild.members.cache.get(target.id) ?? await interaction.guild.members.fetch(target.id);
		if (!targetMember) {
			await interaction.reply({
				content: "指定されたメンバーが見つかりません。",
				flags: [
					Discord.MessageFlags.Ephemeral
				]
			});
			return;
		}
		if (!targetMember.voice.channel) {
			await interaction.reply({
				content: "指定されたメンバーはボイスチャンネルに接続していません。",
				flags: [
					Discord.MessageFlags.Ephemeral
				]
			});
			return;
		}
		if (targetMember.id === interaction.client.user.id) {
			await interaction.reply({
				content: "この操作は実行できません。",
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
			channelId: targetMember.voice.channel.id,
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

		await targetMember.voice.disconnect(`${interaction.user.id} によって切断されました。`);
		connection.destroy();

		await interaction.editReply({
			content: "実行が完了しました。"
		});
	}

}