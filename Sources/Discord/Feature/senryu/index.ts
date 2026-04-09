import * as Haiku from "ts-haiku";

import Feature from "./../Feature";
import type FeatureManager from "./../FeatureManager";

import Discord from "discord.js";

import DatabaseSenryu, { type RawSenryuGuildSenryu } from "./../../../Database/DatabaseSenryu";

export interface CreatedSenryu {
	content: string[];
	senryus: RawSenryuGuildSenryu[];
}

export default class FeatureSenryu extends Feature {

	private readonly databaseSenryu: DatabaseSenryu;

	public constructor(featureManager: FeatureManager) {
		super(featureManager);

		this.databaseSenryu = featureManager.discordBot.app.databaseSenryu;
	}

	override async onMessageCreate(message: Discord.Message): Promise<void> {
		if (process.env.NODE_ENV === "development") return;

		if (!message.inGuild()) return;
		if (message.author.bot) return;

		const guildOnDatabase = this.databaseSenryu.findOrCreateGuild(message.guildId);
		if (!guildOnDatabase.config.enabled) return;
		if (
			(guildOnDatabase.config["channel.include"].length > 0) &&
			(!guildOnDatabase.config["channel.include"].includes(message.channelId))
		) return;
		if (guildOnDatabase.config["channel.exclude"].includes(message.channelId)) return;

		if (message.content === "詠め") {
			await this.replySenryuWrite(message);
			return;
		} else if (message.content === "詠むな") {
			await this.replySenryuStopWriting(message);
			return;
		} else {
			await this.checkSenryu(message);
		}
	}

	private async replySenryuWrite(message: Discord.Message<true>): Promise<Discord.Message> {
		const createdSenryu = this.createSenryuFromDatabase(message.guildId, DatabaseSenryu.RULE);
		if (!createdSenryu) {
			return await message.reply({
				content: "詠みません"
			});
		}

		const authors = new Set<string>();
		createdSenryu.senryus.forEach((senryu) => {
			if (senryu.author) authors.add(senryu.author);
		});

		return await message.reply({
			content: `ここで一句\n「${createdSenryu.content.join(" ")}」`,
			embeds: [
				new Discord.EmbedBuilder()
					.setDescription(`詠み手：${authors.size > 0 ? [...authors].map((author) => Discord.userMention(author)).join(", ") : "不明"}`)
			]
		});
	}

	private async replySenryuStopWriting(message: Discord.Message<true>): Promise<Discord.Message<true>> {
		const latestSenryu = this.databaseSenryu.sortSenryu(message.guildId, (a, b) => {
			if (!a.createdAt) return 1;
			if (!b.createdAt) return -1;
			return b.createdAt - a.createdAt;
		})[0];
		if (!latestSenryu) {
			return await message.reply({
				content: "詠んですらいないが？"
			});
		}

		return await message.reply({
			content: `最後に詠まれたのは「${latestSenryu.content.join(" ")}」である。`,
			embeds: [
				new Discord.EmbedBuilder()
					.setDescription(`詠み手：${latestSenryu.author ? Discord.userMention(latestSenryu.author) : "不明"}`)
			]
		});
	}

	private async checkSenryu(message: Discord.Message<true>): Promise<void> {
		let content: string = message.content;
		if (message.messageSnapshots.size > 0) {
			content += "\n";
			message.messageSnapshots.forEach((snapshot) => {
				if (snapshot.content) content += `${snapshot.content}\n`;
			});
		}
		if (content.length < 5) return;

		const senryus = Haiku.find(content, {
			rule: DatabaseSenryu.RULE,
			kagome: {
				sysdict: "uni"
			}
		})
			.map((raw) => raw.split(" "))
			.filter((content) => DatabaseSenryu.isSenryuValid(content));
		if (senryus.length === 0) return;

		await message.reply({
			content: `無料の川柳を検知：\n${senryus.map((senryu) => `「${senryu.join(" ")}」`).join("\n")}`
		});

		senryus.forEach((senryu) => {
			const contentHash = this.databaseSenryu.getSenryuContentHash(senryu);

			const existingSenryu = this.databaseSenryu.findSenryu(message.guildId, (senryu) => senryu.contentHash === contentHash);
			if (existingSenryu) return;

			const senryuOnDatabase = this.databaseSenryu.createSenryu(message.guildId);
			senryuOnDatabase.createdAt = message.createdAt.getTime();
			senryuOnDatabase.message = message.id;
			senryuOnDatabase.author = message.author.id;
			senryuOnDatabase.rule = DatabaseSenryu.RULE;
			senryuOnDatabase.content = senryu;
			senryuOnDatabase.contentHash = contentHash;
		});
		this.databaseSenryu.write();
	}

	public createSenryuFromDatabase(guild: Discord.Snowflake, rule: number[]): CreatedSenryu | undefined {
		const result: CreatedSenryu = {
			content: [],
			senryus: []
		};

		for (let i: number = 0; i < rule.length; i++) {
			const length = rule[i]!;

			const senryus = new Array<RawSenryuGuildSenryu>();
			this.databaseSenryu.forEachSenryu(guild, (senryu, id) => {
				if (senryu.rule[i] === length) senryus.push(senryu);
			});
			if (senryus.length === 0) return undefined;

			const senryu = senryus[Math.floor(Math.random() * senryus.length)]!;
			result.content.push(senryu.content[i]!);
			result.senryus.push(senryu);
		}
		return result;
	}

}