import * as Haiku from "ts-haiku";

import Feature from "./../Feature";
import type FeatureManager from "./../FeatureManager";

import Discord from "discord.js";

const rule = [5, 7, 5];

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
			await message.reply({
				content: "詠みません"
			});
			return;
		} else if (message.content === "詠むな") {
			await message.reply({
				content: "詠んですらいないが？"
			});
			return;
		}

		if (message.content.length < 5) return;
		const senryus = await Haiku.find(message.content, {
			rule,
			kagome: {
				sysdict: "uni"
			}
		});
		if (senryus.length === 0) return;

		await message.reply({
			content: `無料の川柳を検知：\n${senryus.map((senryu) => `「${senryu}」`).join("\n")}`
		});

		const databaseSenryu = this.featureManager.discordBot.app.databaseSenryu;
		senryus.forEach((senryu) => {
			const content = senryu.split(" ");
			const contentHash = databaseSenryu.getContentHash(content);

			const existingSenryu = Object.values(databaseSenryu.data).find((s) => s.contentHash === contentHash);
			if (existingSenryu) return;

			const senryuOnDatabase = databaseSenryu.create();
			senryuOnDatabase.createdAt = message.createdAt.getTime();
			senryuOnDatabase.message = message.id;
			senryuOnDatabase.author = message.author.id;
			senryuOnDatabase.rule = rule;
			senryuOnDatabase.content = content;
			senryuOnDatabase.contentHash = contentHash;
		});
		databaseSenryu.write();
	}

}