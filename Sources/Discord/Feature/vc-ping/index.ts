import Feature from "./../Feature";
import type FeatureManager from "./../FeatureManager";

import Discord from "discord.js";
import VoiceClient from "./../../VoiceClient";

import fs from "node:fs";
import getNativePath from "./../../../TypeScript/Path";
import path from "node:path";

const voicePath = getNativePath(path.join(__dirname, "..", "..", "..", "Resources", "dobukasu_kaogaakan.wav"));

export default class FeatureVoiceChatPing extends Feature {

	private static readonly PING_RECORD_COUNT = 3;
	private static readonly PING_INTERVAL_THRESHOLD = 1000 * 2;
	private static readonly PING_RESET_TIMEOUT = 1000 * 10;

	public static pingRecords: Record<string, number[]> = {};

	public constructor(featureManager: FeatureManager) {
		super(featureManager);
	}

	override async onMessageCreate(message: Discord.Message): Promise<void> {
		if (process.env.NODE_ENV === "development") return;

		const config = this.featureManager.discordBot.app.readConfig();
		if (!config.feature["vc-ping"].enabled) return;

		if (!message.inGuild()) return;
		if ((!message.member) || (!message.guild.members.me)) return;
		if (!message.mentions.has(message.guild.members.me)) return;

		if (this.checkSpam(message)) {
			await message.reply("お前がスパムすることはお見通しなので囚人ロールを付与しました。付与解除時刻：<t:8639998930799:R>");
			if (message.guild.id === config.guild.production) {
				await message.member.roles.add(config.permission.prisoner.role);
			}
			return;
		}

		if (message.guild.members.me.voice.channel) return;

		let channel: Discord.VoiceBasedChannel | null | undefined = message.member?.voice.channel;
		if (!channel) {
			const voiceChannels = message.guild.channels.cache.filter((channel) => {
				return channel.isVoiceBased() && channel.joinable;
			}) as Discord.Collection<string, Discord.VoiceBasedChannel>;
			if (!voiceChannels.size) return;

			const voiceChannelWithMostMembers = voiceChannels.reduce((prev, current) => {
				if (!prev) return current;
				if (current.members.size > prev.members.size) return current;
				return prev;
			});
			channel = voiceChannelWithMostMembers;
			if (!channel.members.size) return;
		}
		if (!channel.joinable) return;

		const voiceClient = new VoiceClient(message.guild, channel);
		voiceClient.on("connect", async (connectionID) => {
			try {
				await voiceClient.play(() => {
					return fs.createReadStream(voicePath);
				});
				voiceClient.destroy();
			} catch (error) {
				console.error(error);
			}
		});
		await voiceClient.connect();
	}

	private checkSpam(message: Discord.Message): boolean {
		if (!message.member) return false;

		const permissionLevel = this.featureManager.discordBot.getMemberPermissionLevel(message.member);
		if (permissionLevel >= this.featureManager.discordBot.app.readConfig().permission.baka.level) return false;

		const { pingRecords } = FeatureVoiceChatPing;
		if (!pingRecords[message.member.id]) pingRecords[message.member.id] = new Array<number>();

		const records = pingRecords[message.member.id]!;
		const latestRecord = records[records.length - 1];
		if (typeof latestRecord === "number") {
			const elapsedTime = message.createdTimestamp - latestRecord;
			if (elapsedTime >= FeatureVoiceChatPing.PING_RESET_TIMEOUT) records.splice(0);
		}
		records.push(message.createdTimestamp);
		records.splice(0, records.length - FeatureVoiceChatPing.PING_RECORD_COUNT);
		if (records.length <= 1) return false;

		const intervals = records.slice(1).map((time, i) => time - records[i]!);
		const averageDuration = intervals.reduce((a, b) => a + b, 0) / intervals.length;

		if (records.length < FeatureVoiceChatPing.PING_RECORD_COUNT) return false;
		return averageDuration <= FeatureVoiceChatPing.PING_INTERVAL_THRESHOLD;
	}

}