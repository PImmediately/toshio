import * as Haiku from "ts-haiku";

import Feature from "./../Feature";
import type FeatureManager from "./../FeatureManager";

import Discord from "discord.js";

import DatabaseSenryu, { type RawSenryu } from "./../../../Database/DatabaseSenryu";

export interface CreatedSenryu {
	content: string[];
	senryus: RawSenryu[];
}

export default class FeatureSenryu extends Feature {

	public constructor(featureManager: FeatureManager) {
		super(featureManager);
	}

	override async onMessageCreate(message: Discord.Message): Promise<void> {
		const config = this.featureManager.discordBot.app.readConfig();
		if (!config.feature["senryu"].enabled) return;

		if (!message.inGuild()) return;
		if (message.author.bot) return;

		if (message.content === "詠め") {
			await this.replySenryuWrite(message);
			return;
		} else if (message.content === "詠むな") {
			await this.replySenryuStopWriting(message);
			return;
		}

		if (message.content.length < 5) return;

		const senryus = Haiku.find(message.content, {
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

		const databaseSenryu = this.featureManager.discordBot.app.databaseSenryu;
		senryus.forEach((senryu) => {
			const contentHash = databaseSenryu.getContentHash(senryu);

			const existingSenryu = Object.values(databaseSenryu.data).find((s) => s.contentHash === contentHash);
			if (existingSenryu) return;

			const senryuOnDatabase = databaseSenryu.create();
			senryuOnDatabase.createdAt = message.createdAt.getTime();
			senryuOnDatabase.message = message.id;
			senryuOnDatabase.author = message.author.id;
			senryuOnDatabase.rule = DatabaseSenryu.RULE;
			senryuOnDatabase.content = senryu;
			senryuOnDatabase.contentHash = contentHash;
		});
		databaseSenryu.write();
	}

	private async replySenryuWrite(message: Discord.Message): Promise<Discord.Message> {
		const createdSenryu = this.createSenryuFromDatabase(DatabaseSenryu.RULE);
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

	private async replySenryuStopWriting(message: Discord.Message): Promise<Discord.Message> {
		const databaseSenryu = this.featureManager.discordBot.app.databaseSenryu;
		databaseSenryu.read();

		const latestSenryu = Object.values(databaseSenryu.data).sort((a, b) => {
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

	public createSenryuFromDatabase(rule: number[]): CreatedSenryu | undefined {
		const databaseSenryu = this.featureManager.discordBot.app.databaseSenryu;
		databaseSenryu.read();

		const result: CreatedSenryu = {
			content: [],
			senryus: []
		};

		for (let i: number = 0; i < rule.length; i++) {
			const length = rule[i]!;

			const senryus = new Array<RawSenryu>();
			for (const id in databaseSenryu.data) {
				const senryu = databaseSenryu.data[id]!;
				if (senryu.rule[i] === length) senryus.push(senryu);
			}
			if (senryus.length === 0) return undefined;

			const senryu = senryus[Math.floor(Math.random() * senryus.length)]!;
			result.content.push(senryu.content[i]!);
			result.senryus.push(senryu);
		}
		return result;
	}

}