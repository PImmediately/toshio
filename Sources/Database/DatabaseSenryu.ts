import Database from "./Database";
import * as uuid from "uuid";
import base64 from "base64-js";

import type Discord from "discord.js";

export interface RawSenryu {
	createdAt: number | null;
	message: Discord.Snowflake | null;
	author: string | null;
	rule: number[];
	content: string[];
	contentHash: string | null;
}

const textEncoder = new TextEncoder();

export default class DatabaseSenryu extends Database<Record<string, RawSenryu>> {

	public static readonly RULE = [5, 7, 5];

	public constructor() {
		super("senryu.json", {});
		this.clean();
	}

	public find(id: Discord.Snowflake): RawSenryu | undefined {
		return this.data[id];
	}

	public create(): RawSenryu {
		let id: string;
		while (true) {
			id = uuid.v4();
			if (!this.find(id)) break;
		}

		this.data[id] = {
			createdAt: null,
			message: null,
			author: null,
			rule: [],
			content: [],
			contentHash: null
		};
		this.write();
		return this.find(id)!;
	}

	public delete(id: string): void {
		delete this.data[id];
		this.write();
	}

	public clean(): void {
		for (const id in this.data) {
			const senryu = this.data[id]!;
			if (DatabaseSenryu.isSenryuValid(senryu.content)) continue;
			this.delete(id);
		}
	}

	public getContentHash(content: string[]): string {
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