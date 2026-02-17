import type Feature from "./Feature";

import type DiscordBOT from "./../DiscordBOT";

export default class FeatureManager {

	public readonly features = new Array<Feature>();

	public constructor(public readonly discordBot: DiscordBOT, Features: typeof Feature[]) {
		Features.forEach((Feature) => {
			const feature = new Feature(this);
			feature.onInit();

			this.features.push(feature);
		});
	}

}