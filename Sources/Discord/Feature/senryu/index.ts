import * as Haiku from "ts-haiku";

import Feature from "./../Feature";
import type FeatureManager from "./../FeatureManager";

import Discord from "discord.js";

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
		const haikus = await Haiku.find(message.content, {
			rule: [5, 7, 5],
			kagome: {
				sysdict: "uni"
			}
		});
		if (haikus.length === 0) return;

		const haiku = haikus[0]!;
		await message.reply({
			content: `無料の川柳を検知：\n「${haiku}」`
		});
	}

}