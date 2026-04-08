import Discord from "discord.js";
import VoiceClient from "./../../VoiceClient";

import SlashCommand from "./SlashCommand";
import SlashCommandVoiceChannel from "./SlashCommandVoiceChannel";

import fs from "node:fs";
import getNativePath from "./../../../TypeScript/Path";
import path from "node:path";

const voicePath1 = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_kotaeroya.wav"));
const voicePath2 = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_shindaraeenen.wav"));

export default class SlashCommandVoiceChannelKick extends SlashCommand {

	override readonly command = undefined;

	override async onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): Promise<void> {
		if (!interaction.inCachedGuild()) return;

		const selector = interaction.options.getString("selector", true);
		if (selector === "@p") {
			await this.kickPreviousSpeaker(interaction);
		} else if (selector === "@r") {
			await this.kickRandomMember(interaction);
		} else if (selector === "@a") {
			await this.kickAllMembersInChannel(interaction);
		} else if (selector === "@e") {
			await this.kickAllMembers(interaction);
		} else if (selector === "@s") {
			await this.kickSelf(interaction);
		}
	}

	private async kickPreviousSpeaker(interaction: Discord.ChatInputCommandInteraction<"cached">): Promise<void> {
		if (!(await SlashCommand.checkPermission(interaction, interaction.client.discordBOT.app.readConfig().permission.baka.level))) return;

		const channel = interaction.member.voice.channel;
		if (!channel) {
			await interaction.reply({
				content: "セレクター `@p` では、実行者はボイスチャンネルに接続している必要があります。",
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

			let target: Discord.GuildMember | undefined;
			if (a()) {
				const onMemberSpeakingStart = (member: Discord.GuildMember): void => {
					if (member === interaction.guild.members.me) return;
					voiceClient.off("memberSpeakingStart", onMemberSpeakingStart);
					target = member;
				};
				voiceClient.on("memberSpeakingStart", onMemberSpeakingStart);

				try {
					await voiceClient.play(() => {
						return fs.createReadStream(voicePath1);
					});
				} catch (error) {
					console.error(error);
					hasError = true;
				}
			}

			if ((a()) && (!hasError) && (!target)) {
				target = await new Promise<Discord.GuildMember>((resolve, reject) => {
					const onMemberSpeakingStart = (member: Discord.GuildMember): void => {
						if (member === interaction.guild.members.me) return;
						voiceClient.off("memberSpeakingStart", onMemberSpeakingStart);
						resolve(member);
					};
					voiceClient.on("memberSpeakingStart", onMemberSpeakingStart);
				});
			}

			if ((a()) && (!hasError)) {
				try {
					await voiceClient.play(() => {
						return fs.createReadStream(voicePath2);
					});
				} catch (error) {
					console.error(error);
					hasError = true;
				}
			}

			if ((a()) && (!hasError) && (target)) {
				await target.voice.disconnect(`${interaction.user.id} によって切断されました。`);
				await interaction.editReply({
					content: `最後に喋った ${Discord.userMention(interaction.member.id)} は ${Discord.channelMention(channel.id)} で首を括った。`
				});
			}

			if (a()) {
				try {
					voiceClient.destroy();
				} catch (error) {
					console.error(error);
				}
			}

			if (hasError) {
				await interaction.editReply({
					content: `最後に喋った ${Discord.userMention(interaction.member.id)} は ${Discord.channelMention(channel.id)} で首を括れなかった。`
				});
			}
		});
		voiceClient.on("disconnect", async () => {
			await voiceClient.connect();
		});
		await voiceClient.connect();
	}

	private async kickRandomMember(interaction: Discord.ChatInputCommandInteraction<"cached">): Promise<void> {
		if (!(await SlashCommand.checkPermission(interaction, interaction.client.discordBOT.app.readConfig().permission.baka.level))) return;

		const channel = interaction.member.voice.channel;
		if (!channel) {
			await interaction.reply({
				content: "セレクター `@r` では、実行者はボイスチャンネルに接続している必要があります。",
				flags: [
					Discord.MessageFlags.Ephemeral
				]
			});
			return;
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

		const member = channel.members.random()!;

		await interaction.deferReply();

		await SlashCommandVoiceChannel.kick({
			guild: interaction.guild,
			channel,
			member,
			reason: `${interaction.user.id} によって切断されました。`,
			onKick: async () => {
				await interaction.editReply({
					content: `アッチ側に選ばれし ${Discord.userMention(member.id)} は ${Discord.channelMention(channel.id)} で首を括った。`
				});
			},
			onError: async () => {
				await interaction.editReply({
					content: `アッチ側に選ばれし ${Discord.userMention(member.id)} は ${Discord.channelMention(channel.id)} で首を括れなかった。`
				});
			}
		});
	}

	private async kickAllMembersInChannel(interaction: Discord.ChatInputCommandInteraction<"cached">): Promise<void> {
		if (!(await SlashCommand.checkPermission(interaction, interaction.client.discordBOT.app.readConfig().permission.baka.level))) return;

		const channel = interaction.member.voice.channel;
		if (!channel) {
			await interaction.reply({
				content: "セレクター `@a` では、実行者はボイスチャンネルに接続している必要があります。",
				flags: [
					Discord.MessageFlags.Ephemeral
				]
			});
			return;
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

	private async kickAllMembers(interaction: Discord.ChatInputCommandInteraction<"cached">): Promise<void> {
		if (!(await SlashCommand.checkPermission(interaction, interaction.client.discordBOT.app.readConfig().permission.baka.level))) return;

		const channels = interaction.guild.channels.cache.filter((channel) => {
			return channel.isVoiceBased() && channel.joinable && channel.members.size > 0;
		}) as Discord.Collection<string, Discord.VoiceBasedChannel>;
		if (!channels.size) {
			await interaction.reply({
				content: "切断するメンバーが見つかりませんでした。",
				flags: [
					Discord.MessageFlags.Ephemeral
				]
			});
			return;
		}

		await interaction.deferReply();

		let kickedMembers: Discord.Collection<string, Discord.GuildMember> = new Discord.Collection<string, Discord.GuildMember>();
		for (const channel of channels.values()) {
			await new Promise<void>((resolve, reject) => {
				SlashCommandVoiceChannel.kickAll({
					guild: interaction.guild,
					channel: channel,
					reason: `${interaction.guild.client.user.id} によって切断されました。`,
					onKickAll: (members) => {
						kickedMembers = kickedMembers.concat(members);
						resolve();
					},
					onError: () => {
						reject();
					}
				});
			});
		}

		if (kickedMembers.size > 0) {
			await interaction.editReply({
				content: `このサーバーにいたアッチ側に立っていない${kickedMembers.size}人は切断された。`
			});
		} else {
			await interaction.editReply({
				content: `このサーバーは既にアッチ側に立っている。`
			});
		}
	}

	private async kickSelf(interaction: Discord.ChatInputCommandInteraction<"cached">): Promise<void> {
		const channel = interaction.member.voice.channel;
		if (!channel) {
			await interaction.reply({
				content: "セレクター `@s` では、実行者はボイスチャンネルに接続している必要があります。",
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
			member: interaction.member,
			reason: `${interaction.user.id} によって切断されました。`,
			onKick: async () => {
				await interaction.editReply({
					content: `${Discord.userMention(interaction.member.id)} は ${Discord.channelMention(channel.id)} で首を括った。`
				});
			},
			onError: async () => {
				await interaction.editReply({
					content: `${Discord.userMention(interaction.member.id)} は ${Discord.channelMention(channel.id)} で首を括れなかった。`
				});
			}
		});
	}

}