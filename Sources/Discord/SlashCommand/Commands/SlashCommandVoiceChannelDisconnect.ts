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
		if (!target.voice.channel) {
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

		const connection = DiscordVoice.joinVoiceChannel({
			channelId: target.voice.channel.id,
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

		await target.voice.disconnect(`${interaction.user.id} によって切断されました。`);
		connection.destroy();

		await interaction.editReply({
			content: `${Discord.userMention(target.id)} は ${Discord.channelMention(interaction.channelId)} で首を括った。`
		});
	}

}