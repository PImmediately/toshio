import Feature from "./../Feature";
import type FeatureManager from "./../FeatureManager";

import Discord from "discord.js";

export default class FeatureTrapChannel extends Feature {

	public constructor(featureManager: FeatureManager) {
		super(featureManager);
	}

	override async onMessageCreate(message: Discord.Message): Promise<void> {
		const config = this.featureManager.discordBot.app.readConfig();
		if (!config.feature["trap-channel"].enabled) return;
		if (!config.feature["trap-channel"].channel) return;

		if (!message.inGuild()) return;
		if (message.guild.id !== config.guild.production) return;
		if (message.channelId !== config.feature["trap-channel"].channel) return;
		if (message.author.bot) return;

		if (!message.member) return;
		const permissionLevel = this.featureManager.discordBot.getMemberPermissionLevel(message.member);
		if (permissionLevel >= config.permission.baka.level) return;

		if (!message.member.roles.cache.has(config.permission.prisoner.role)) {
			await message.member.roles.add(config.permission.prisoner.role, "罠チャンネルでメッセージを送信しました");
		}
		const removedRoles = message.member.roles.cache.filter((role) => (role.editable) && (role.id !== config.permission.prisoner.role));
		if (removedRoles.size > 0) {
			await message.member.roles.remove(removedRoles, "罠チャンネルでメッセージを送信しました");
		}

		await message.react("🙏");

		const embed = new Discord.EmbedBuilder()
			.setDescription(
				"剥奪された役職\n" +
				(
					(removedRoles.size > 0)
						? removedRoles.map((role) => `- ${Discord.roleMention(role.id)}`).join("\n")
						: "なし"
				)
			)
			.setFooter({
				text: message.author.tag,
				iconURL: message.author.displayAvatarURL()
			})
			.setTimestamp(message.createdTimestamp);
		await this.featureManager.discordBot.log({
			content: `[罠チャンネル] ${Discord.userMention(message.author.id)} が ${Discord.channelMention(message.channel.id)} で罠に掛かりました。`,
			embeds: [embed],
			allowedMentions: {
				users: []
			}
		});
	}

}