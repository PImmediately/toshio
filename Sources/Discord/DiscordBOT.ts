import type Application from "./../App";
import Discord from "discord.js";

import fs from "node:fs";
import path from "node:path";
import type { Instantiable } from "./../TypeScript/UtilTypes";
import type SlashCommand from "./SlashCommand/Commands/SlashCommand";

export default class DiscordBOT {

	public readonly client;

	public constructor(public readonly app: Application) {
		const intents = new Discord.IntentsBitField();
		intents.add(Discord.IntentsBitField.Flags.Guilds);
		intents.add(Discord.IntentsBitField.Flags.GuildWebhooks);
		intents.add(Discord.IntentsBitField.Flags.GuildVoiceStates);
		intents.add(Discord.IntentsBitField.Flags.GuildMessages);
		intents.add(Discord.IntentsBitField.Flags.MessageContent);

		const partials = new Array<Discord.Partials>();
		partials.push(Discord.Partials.User);
		partials.push(Discord.Partials.Channel);
		partials.push(Discord.Partials.GuildMember);
		partials.push(Discord.Partials.Message);

		this.client = new Discord.Client({
			intents,
			partials,
		});
		this.client.discordBOT = this;

		this.client.commands = new Discord.Collection();
		DiscordBOT.getDefinedCommands(path.join(__dirname, "SlashCommand", "Commands")).forEach((command) => {
			if (!command.command) return;
			this.client.commands.set(command.command.name, command);
		});

		this.client.on(Discord.Events.Error, (error) => {
			console.error(error);
		});
		this.client.on(Discord.Events.ShardError, (error) => {
			console.error(error);
		});
		this.client.on(Discord.Events.Warn, (info) => {
			console.warn(info);
		});

		this.client.on(Discord.Events.InteractionCreate, async (interaction) => {
			if (interaction.isChatInputCommand()) {
				this.onSlashCommandExecute(interaction);
			}
		});
	}

	public async login(token: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.client.on(Discord.Events.ClientReady, (client) => {
				this.onClientReady(client);
				resolve();
			});
			this.client.login(token);
		});
	}

	private onClientReady(client: Discord.Client<true>): void {
		console.log(`Successfully logged in as ${client.user.tag}`);
	}

	public async onSlashCommandExecute(interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>): Promise<void> {
		const command = interaction.client.commands.get(interaction.commandName) as SlashCommand;
		try {
			command.onExecute(interaction);
		} catch (error) {
			console.error(error);
			if ((interaction.replied) || (interaction.deferred)) {
				await interaction.followUp({
					content: "コマンド実行中に問題が発生しました。",
					ephemeral: true
				});
			} else {
				await interaction.reply({
					content: "コマンド実行中に問題が発生しました。",
					ephemeral: true
				});
			}
		}
	}

	public static getDefinedCommands(dir: string): SlashCommand[] {
		const dirents = fs.readdirSync(dir, {
			withFileTypes: true
		});

		const fileNames = new Array<string>();
		dirents.forEach((dirent) => {
			if (!dirent.isFile()) return;

			const extension = path.extname(dirent.name).toLowerCase();
			if (extension !== ".js") return;

			const commandName = path.basename(dirent.name, extension);
			if (commandName === "SlashCommand") return;

			fileNames.push(dirent.name);
		});

		const commands = new Array<SlashCommand>();
		fileNames.forEach((fileName) => {
			const SlashCommand = (
				// eslint-disable-next-line @typescript-eslint/no-require-imports
				require(path.join(dir, fileName)
				) as { default: Instantiable<SlashCommand> }).default;
			commands.push(new SlashCommand());
		});
		return commands;
	}

	public getMemberPermissionLevel(member: Discord.GuildMember): number {
		const config = this.app.readConfig();

		if (member.id === config.permission["bot-developer"].user) return config.permission["bot-developer"].level;

		if (member.guild.id === config.guild.development) return +Infinity;
		if (member.guild.id !== config.guild.production) return -Infinity;
		
		if (member.id === member.guild.ownerId) return config.permission["guild-owner"].level;
		if (member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) return config.permission.administrator.level;
		if (member.roles.cache.has(config.permission.baka.role)) return config.permission.baka.level;
		if (member.roles.cache.has(config.permission.prisoner.role)) return config.permission.prisoner.level;
		return config.permission.default.level;
	}

}