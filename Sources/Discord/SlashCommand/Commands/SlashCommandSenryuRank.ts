import Discord from "discord.js";
import SlashCommand from "./SlashCommand";

import type { RawSenryu } from "./../../../Database/DatabaseSenryu";

export default class SlashCommandSenryuRank extends SlashCommand {

	override readonly command = undefined;

	override async onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): Promise<void> {
		if (!interaction.inCachedGuild()) return;

		const databaseSenryu = interaction.client.discordBOT.app.databaseSenryu;

		const senryusEachUser: Record<string, RawSenryu[]> = {};
		Object.values(databaseSenryu.data).forEach((senryu) => {
			if (!senryu.author) return;
			if (!senryusEachUser[senryu.author]) senryusEachUser[senryu.author] = new Array<RawSenryu>();
			senryusEachUser[senryu.author]!.push(senryu);
		});

		const entries = Object.entries(senryusEachUser)
			.sort((a, b) => b[1].length - a[1].length)
			.slice(0, 10);
		if (entries.length === 0) {
			await interaction.reply("無の川柳を観測");
			return;
		}

		await interaction.reply({
			embeds: [
				new Discord.EmbedBuilder()
					.setTitle("川柳ランキング")
					.setDescription(entries.map(([author, senryus], index) => {
						return `**${index + 1}位** ${Discord.userMention(author)}：${senryus.length}句`;
					}).join("\n"))
			]
		});
	}

}