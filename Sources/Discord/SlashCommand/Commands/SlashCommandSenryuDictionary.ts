import Discord from "discord.js";
import SlashCommand from "./SlashCommand";

export default class SlashCommandSenryuDictionary extends SlashCommand {

	override readonly command = undefined;

	override async onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): Promise<void> {
		if (!interaction.inCachedGuild()) return;

		const databaseSenryu = interaction.client.discordBOT.app.databaseSenryu;

		const contentsEachRule: Record<string, string[]> = {};
		databaseSenryu.forEachSenryu(interaction.guildId, (senryu) => {
			if (!senryu.author) return;
			for (let i: number = 0; i < senryu.content.length; i++) {
				const rule = String(senryu.rule[i]!);
				const content = senryu.content[i]!;
				if (!contentsEachRule[rule]) contentsEachRule[rule] = new Array<string>();
				contentsEachRule[rule].push(content);
			}
		});
		if (Object.keys(contentsEachRule).length === 0) {
			await interaction.reply("無の川柳を観測");
			return;
		}

		await interaction.reply({
			embeds: [
				new Discord.EmbedBuilder()
					.setTitle("句の出現回数")
					.setDescription(
						Object.entries(contentsEachRule).map(([rule, contents]) => {
							const countEachContent: Record<string, number> = {};
							contents.forEach((content) => {
								countEachContent[content] = (countEachContent[content] ?? 0) + 1;
							});

							const ranking = Object.entries(countEachContent)
								.sort((a, b) => b[1] - a[1])
								.slice(0, 10)
								.map(([content, count]) => {
									return `${content}（${count}回）`;
								})
								.join("\n");

							return `### ${rule}音\n${ranking}`;
						}).join("\n")
					)
			]
		});
	}

}