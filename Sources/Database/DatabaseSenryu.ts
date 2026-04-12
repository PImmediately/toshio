import Database from "./Database";
import * as uuid from "uuid";
import base64 from "base64-js";

import type Discord from "discord.js";

export type RawSenryu = Record<string, RawSenryuGuild>;

export interface RawSenryuGuild {
	config: RawSenryuGuildConfig;
	member: Record<Discord.Snowflake, RawSenryuGuildMember>;
	senryu: Record<string, RawSenryuGuildSenryu>;
}

export interface RawSenryuGuildMember {
	senryuCreationCount: number;
}

export interface RawSenryuGuildConfig {
	enabled: boolean;
	"channel.include": Discord.Snowflake[];
	"channel.exclude": Discord.Snowflake[];
}

export interface RawSenryuGuildSenryu {
	id: string;
	createdAt: number | null;
	message: Discord.Snowflake | null;
	author: string | null;
	rule: number[];
	content: string[];
	contentHash: string | null;
}

const textEncoder = new TextEncoder();

export default class DatabaseSenryu extends Database<RawSenryu> {

	public static readonly RULE = [5, 7, 5];

	public constructor() {
		super("senryu.json", {});

		this.forEachGuild((_, guild) => {
			this.cleanSenryu(guild);
		});
	}

	public findGuild(guild: Discord.Snowflake): RawSenryuGuild | undefined {
		return this.data[guild];
	}

	public createGuild(guild: Discord.Snowflake): RawSenryuGuild {
		if (this.findGuild(guild)) throw new Error(`Guild with ID ${guild} already exists.`);

		this.data[guild] = {
			config: {
				enabled: true,
				"channel.include": [],
				"channel.exclude": []
			},
			member: {},
			senryu: {}
		};
		this.write();

		return this.findGuild(guild)!;
	}

	public findOrCreateGuild(guild: Discord.Snowflake): RawSenryuGuild {
		return this.findGuild(guild) ?? this.createGuild(guild);
	}

	public deleteGuild(guild: Discord.Snowflake): void {
		delete this.data[guild];
		this.write();
	}

	public forEachGuild(callback: (raw: RawSenryuGuild, guild: Discord.Snowflake) => void): void {
		for (const guildID in this.data) {
			const guild = this.data[guildID]!;
			callback(guild, guildID);
		}
	}

	public findMember(guild: Discord.Snowflake, member: Discord.Snowflake): RawSenryuGuildMember | undefined {
		const guildOnDatabase = this.findOrCreateGuild(guild);
		return guildOnDatabase.member[member];
	}

	public createMember(guild: Discord.Snowflake, member: Discord.Snowflake): RawSenryuGuildMember {
		const guildOnDatabase = this.findOrCreateGuild(guild);
		if (this.findMember(guild, member)) throw new Error(`Member with ID ${member} already exists in guild with ID ${guild}.`);

		guildOnDatabase.member[member] = {
			senryuCreationCount: 0
		};

		this.write();
		return this.findMember(guild, member)!;
	}

	public findOrCreateMember(guild: Discord.Snowflake, member: Discord.Snowflake): RawSenryuGuildMember {
		return this.findMember(guild, member) ?? this.createMember(guild, member);
	}

	public findSenryu(guild: Discord.Snowflake, id: string): RawSenryuGuildSenryu | undefined;
	public findSenryu(guild: Discord.Snowflake, callback: (raw: RawSenryuGuildSenryu, id: string) => boolean): RawSenryuGuildSenryu | undefined;
	public findSenryu(guild: Discord.Snowflake, selector: string | ((raw: RawSenryuGuildSenryu, id: string) => boolean)): RawSenryuGuildSenryu | undefined {
		const guildOnDatabase = this.findOrCreateGuild(guild);
		if (typeof selector === "string") return guildOnDatabase.senryu[selector];

		for (const id in guildOnDatabase.senryu) {
			const senryu = guildOnDatabase.senryu[id]!;
			if (selector(senryu, id)) return senryu;
		}
		return undefined;
	}

	public createSenryu(guild: Discord.Snowflake): RawSenryuGuildSenryu {
		let id: string;
		while (true) {
			id = uuid.v4();
			if (!this.findSenryu(guild, id)) break;
		}

		const guildOnDatabase = this.findOrCreateGuild(guild);
		guildOnDatabase.senryu[id] = {
			id,
			createdAt: null,
			message: null,
			author: null,
			rule: [],
			content: [],
			contentHash: null
		};
		this.write();

		return this.findSenryu(guild, id)!;
	}

	public deleteSenryu(guild: Discord.Snowflake, id: string): void {
		const guildOnDatabase = this.findOrCreateGuild(guild);
		delete guildOnDatabase.senryu[id];
		this.write();
	}

	public forEachSenryu(guild: Discord.Snowflake, callback: (raw: RawSenryuGuildSenryu, id: string) => void): void {
		const guildOnDatabase = this.findOrCreateGuild(guild);
		for (const senryuID in guildOnDatabase.senryu) {
			const senryu = guildOnDatabase.senryu[senryuID]!;
			callback(senryu, senryuID);
		}
	}

	public sortSenryu(guild: Discord.Snowflake, callback: (a: RawSenryuGuildSenryu, b: RawSenryuGuildSenryu) => number): Record<string, RawSenryuGuildSenryu> {
		const guildOnDatabase = this.findOrCreateGuild(guild);
		const sortedSenryus = Object.entries(guildOnDatabase.senryu).sort(([, a], [, b]) => callback(a, b));
		return Object.fromEntries(sortedSenryus);
	}

	public cleanSenryu(guild: Discord.Snowflake): void {
		this.forEachSenryu(guild, (senryu, id) => {
			if (!senryu.id) senryu.id = id;

			if (DatabaseSenryu.isSenryuValid(senryu.content)) return;
			this.deleteSenryu(guild, id);
		});
		this.write();
	}

	public getSenryuContentHash(content: string[]): string {
		return base64.fromByteArray(textEncoder.encode(content.join(" ")));
	}

	public static isSenryuValid(content: string[]): boolean {
		if (content.length !== DatabaseSenryu.RULE.length) return false;
		for (const part of content) {
			if (/[0-9０-９\u2160-\u2188]+/.test(part)) return false;
		}
		return true;
	}

}