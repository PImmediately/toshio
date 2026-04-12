import Discord from "discord.js";
import SlashCommand from "./SlashCommand";

export default class SlashCommandSenryuStatisticsCreation extends SlashCommand {

	override readonly command = undefined;

	override async onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): Promise<void> {
		if (!interaction.inCachedGuild()) return;

		const databaseSenryu = interaction.client.discordBOT.app.databaseSenryu;

		const creationEachUser: Record<string, number> = {};
		databaseSenryu.forEachMember(interaction.guildId, (member, id) => {
			creationEachUser[id] = member.senryuCreationCount;
		});

		const entries = Object.entries(creationEachUser)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10);
		if (entries.length === 0) {
			await interaction.reply("無の川柳を観測");
			return;
		}

		let prevCount: number | null = null;
		let rank: number = 0;

		await interaction.reply({
			embeds: [
				new Discord.EmbedBuilder()
					.setTitle("詠者の川柳作成回数")
					.setDescription(
						entries.map(([member, count], index) => {
							if (count !== prevCount) {
								rank = index + 1;
								prevCount = count;
							}

							return `**${rank}位** ${Discord.userMention(member)}：${count}回`;
						}).join("\n")
					)
			]
		});
	}

}