import Discord from "discord.js";
import VoiceClient from "./../../VoiceClient";
import SlashCommand from "./SlashCommand";

import fs from "node:fs";
import getNativePath from "./../../../TypeScript/Path";
import path from "node:path";

import SlashCommandVoiceChannelDisconnect from "./SlashCommandVoiceChannelDisconnect";
import SlashCommandVoiceChannelDisband from "./SlashCommandVoiceChannelDisband";
import SlashCommandVoiceChannelMoveAll from "./SlashCommandVoiceChannelMoveAll";

const voicePathKick1 = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_shindaraeenen.wav"));
const voicePathKick2 = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_hitonokokoro.wav"));

const voicePathKickAll1 = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_attigawa.wav"));
const voicePathKickAll2 = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_hitonokokoro.wav"));

const voicePathMoveAll1 = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_saikousokudo.wav"));
const voicePathMoveAll2 = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_hitonokokoro.wav"));

export interface KickOptions {
	guild: Discord.Guild;
	channel: Discord.VoiceBasedChannel;
	member: Discord.GuildMember;
	reason?: string;
	onKick?: () => void;
	onError?: () => void;
}

export interface KickAllOptions {
	guild: Discord.Guild;
	channel: Discord.VoiceBasedChannel;
	reason?: string;
	onKickAll?: (members: Discord.Collection<string, Discord.GuildMember>) => void;
	onError?: () => void;
}

export interface MoveAllOptions {
	guild: Discord.Guild;
	fromChannel: Discord.VoiceBasedChannel;
	toChannel: Discord.VoiceBasedChannel;
	condition?: MoveAllOptionsCondition;
	reason?: string;
	onMoveAll?: (members: Discord.Collection<string, Discord.GuildMember>) => void;
	onError?: () => void;
}

export interface MoveAllOptionsCondition {
	not?: boolean;
	minPermissionLevel?: number;
}

export default class SlashCommandVoiceChannel extends SlashCommand {

	private readonly voiceChannelDisconnect = new SlashCommandVoiceChannelDisconnect();
	private readonly voiceChannelDisband = new SlashCommandVoiceChannelDisband();
	private readonly voiceChannelMoveAll = new SlashCommandVoiceChannelMoveAll();

	override readonly command = new Discord.SlashCommandBuilder()
		.setName("vc")
		.setDescription("ボイスチャンネルに関するコマンド")
		.addSubcommand((group) => {
			return group
				.setName("disconnect")
				.setDescription("ボイスチャンネルにいるメンバーを切断します。")
				.addUserOption((option) => {
					return option
						.setName("target")
						.setDescription("メンバー");
				});
		})
		.addSubcommand((group) => {
			return group
				.setName("disband")
				.setDescription("ボイスチャンネルを解散します。")
				.addChannelOption((option) => {
					return option
						.setName("target")
						.setDescription("チャンネル");
				});
		})
		.addSubcommand((group) => {
			return group
				.setName("move-all")
				.setDescription("移動元ボイスチャンネルにいる全メンバーを移動先ボイスチャンネルに移動します。")
				.addChannelOption((option) => {
					return option
						.setName("to")
						.setDescription("移動先ボイスチャンネル")
						.setRequired(true);
				})
				.addChannelOption((option) => {
					return option
						.setName("from")
						.setDescription("移動元ボイスチャンネル")
						.setRequired(false);
				})
				.addIntegerOption((option) => {
					return option
						.setName("condition_min_permission_level")
						.setDescription("条件：この権限レベル以上のメンバーのみを対象")
						.setRequired(false);
				})
				.addBooleanOption((option) => {
					return option
						.setName("condition_not")
						.setDescription("条件を反転させる")
						.setRequired(false);
				});
		});

	private static readonly MOVE_ALL_SET_CHANNEL_COOLDOWN = 200;
	private static readonly KICK_ALL_DISCONNECT_COOLDOWN = 200;

	override onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): void {
		switch (interaction.options.getSubcommand()) {
			case "disconnect": {
				this.voiceChannelDisconnect.onExecute(interaction);
				return;
			}
			case "disband": {
				this.voiceChannelDisband.onExecute(interaction);
				return;
			}
			case "move-all": {
				this.voiceChannelMoveAll.onExecute(interaction);
				return;
			}
		}
	}

	public static async kick(options: KickOptions): Promise<void> {
		let connectionCount: number = 0;
		const voiceClient = new VoiceClient(options.guild, options.channel);
		voiceClient.on("connect", async (connectionID) => {
			let hasError: boolean = false;
			connectionCount++;
			const a = (): boolean => connectionID === voiceClient.getConnectionID();

			if (a()) {
				try {
					await voiceClient.play(() => {
						return fs.createReadStream(connectionCount === 1 ? voicePathKick1 : voicePathKick2);
					});
				} catch (error) {
					console.error(error);
					hasError = true;
				}
			}

			if ((a()) && (!hasError)) {
				await options.member.voice.disconnect(`${options.reason}`);
				options.onKick?.();
			}

			if (a()) {
				try {
					voiceClient.destroy();
				} catch (error) {
					console.error(error);
				}
			}

			if (hasError) options.onError?.();
		});
		voiceClient.on("disconnect", async () => {
			await voiceClient.connect();
		});
		await voiceClient.connect();
	}

	public static async kickAll(options: KickAllOptions): Promise<void> {
		let connectionCount: number = 0;
		const voiceClient = new VoiceClient(options.guild, options.channel);
		voiceClient.on("connect", async (connectionID) => {
			let hasError: boolean = false;
			connectionCount++;
			const a = (): boolean => connectionID === voiceClient.getConnectionID();

			if (a()) {
				try {
					await voiceClient.play(() => {
						return fs.createReadStream(connectionCount === 1 ? voicePathKickAll1 : voicePathKickAll2);
					});
				} catch (error) {
					console.error(error);
					hasError = true;
				}
			}

			if ((a()) && (!hasError)) {
				const targetMembers = options.channel.members.filter(member => member.id !== options.guild.client.user.id);
				for (const member of targetMembers.values()) {
					try {
						member.voice.disconnect(options.reason);
					} catch (error) {
						console.error(error);
					}
					await new Promise((resolve) => setTimeout(resolve, SlashCommandVoiceChannel.KICK_ALL_DISCONNECT_COOLDOWN));
				}

				options.onKickAll?.(targetMembers);
			}

			if (a()) {
				try {
					voiceClient.destroy();
				} catch (error) {
					console.error(error);
				}
			}

			if (hasError) options.onError?.();
		});
		voiceClient.on("disconnect", async () => {
			await voiceClient.connect();
		});
		await voiceClient.connect();
	}

	public static async moveAll(options: MoveAllOptions): Promise<void> {
		let connectionCount: number = 0;
		const voiceClient = new VoiceClient(options.guild, options.fromChannel);
		voiceClient.on("connect", async (connectionID) => {
			let hasError: boolean = false;
			connectionCount++;
			const a = (): boolean => connectionID === voiceClient.getConnectionID();

			if (a()) {
				try {
					await voiceClient.play(() => {
						return fs.createReadStream(connectionCount === 1 ? voicePathMoveAll1 : voicePathMoveAll2);
					});
				} catch (error) {
					console.error(error);
					hasError = true;
				}
			}

			const targetMembers = options.fromChannel.members.filter(((member) => {
				if (member.id === options.guild.client.user.id) return false;
				if (options.condition?.minPermissionLevel) {
					const permissionLevel = options.guild.client.discordBOT.getMemberPermissionLevel(member);
					return options.condition.not ? permissionLevel < options.condition.minPermissionLevel : permissionLevel >= options.condition.minPermissionLevel;
				}
				return true;
			}));

			if ((a()) && (!hasError)) {
				for (const member of targetMembers.values()) {
					try {
						await member.voice.setChannel(options.toChannel, options.reason);
					} catch (error) {
						console.error(error);
					}
					await new Promise((resolve) => setTimeout(resolve, SlashCommandVoiceChannel.MOVE_ALL_SET_CHANNEL_COOLDOWN));
				}

				options.onMoveAll?.(targetMembers);
			}

			if (a()) {
				try {
					voiceClient.destroy();
				} catch (error) {
					console.error(error);
				}
			}

			if (hasError) options.onError?.();
		});
		voiceClient.on("disconnect", async () => {
			await voiceClient.connect();
		});
		await voiceClient.connect();
	}

}