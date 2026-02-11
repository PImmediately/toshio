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

	static async checkDeveloperPermissions(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): Promise<boolean> {
		if (interaction.user.id === process.env.DISCORD_BOT_DEVELOPER_CLIENT_ID) return true;

		await interaction.reply({
			content: "アクセス拒否されました：管理者のみ使用可能なコマンドです。",
			flags: [
				Discord.MessageFlags.Ephemeral
			]
		});
		return false;
	}

}