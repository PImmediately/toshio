import Feature from "./../Feature";
import type FeatureManager from "./../FeatureManager";

import type Discord from "discord.js";

export default class FeatureTrapChannel extends Feature {

	public constructor(featureManager: FeatureManager) {
		super(featureManager);
	}

	override async onMessageCreate(message: Discord.Message): Promise<void> {
		const config = this.featureManager.discordBot.app.readConfig();
		if (!config.features["trap-channel"].enabled) return;
		if (!config.features["trap-channel"].channel) return;

		if (message.guildId !== config.guild.production) return;
		if (message.channelId !== config.features["trap-channel"].channel) return;
		if (message.author.bot) return;

		if (!message.member) return;
		const permissionLevel = this.featureManager.discordBot.getMemberPermissionLevel(message.member);
		if (permissionLevel >= config.permission.baka.level) return;

		if (!message.member.roles.cache.has(config.permission.prisoner.role)) {
			await message.member.roles.add(config.permission.prisoner.role, "罠チャンネルでメッセージを送信しました");
		}
		await message.react("🙏");
	}

}