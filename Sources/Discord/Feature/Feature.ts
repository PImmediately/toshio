import type FeatureManager from "./FeatureManager";

import type Discord from "discord.js";

export default class Feature {

	public constructor(public readonly featureManager: FeatureManager) {
		this.featureManager.discordBot.client.on("messageCreate", (message) => {
			this.onMessageCreate(message);
		});
	}

	public onInit(): void {}

	public onMessageCreate(message: Discord.Message): void {}

}