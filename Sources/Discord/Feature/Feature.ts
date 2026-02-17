import type FeatureManager from "./FeatureManager";

import type Discord from "discord.js";

export default class Feature {

	public constructor(public readonly featureManager: FeatureManager) {
	}

	public onInit(): void {}

}