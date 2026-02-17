import Discord from "discord.js";

export default abstract class SlashCommand {

	public readonly abstract command: (
		Discord.SlashCommandBuilder |
		Discord.SlashCommandSubcommandsOnlyBuilder |
		Omit<Discord.SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> |
		undefined
	);

	public onExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): void {
	}

	static async checkPermission(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>, requiredLevel: number): Promise<boolean> {
		if (!interaction.inCachedGuild()) throw new TypeError("Interaction is not in a cached guild.");

		const memberPermissionLevel = interaction.client.discordBOT.getMemberPermissionLevel(interaction.member);
		if (memberPermissionLevel >= requiredLevel) return true;

		await interaction.reply({
			content: "権限が不足しています。",
			flags: [
				Discord.MessageFlags.Ephemeral
			]
		});
		return false;
	}

}