import YAML from "yaml";
import fs from "node:fs";
import getNativePath from "./TypeScript/Path";
import path from "node:path";

export interface Configuration {
	guild: {
		production: string;
		development: string;
	};
	permission: {
		default: {
			level: number;
		};
		prisoner: {
			level: number;
			role: string;
		};
		baka: {
			level: number;
			role: string;
		}
		administrator: {
			level: number;
		};
		"guild-owner": {
			level: number;
		}
		"bot-developer": {
			level: number;
			user: string;
		}
	};
}

export function read(): Configuration {
	return YAML.parse(fs.readFileSync(getNativePath(path.join(__dirname, "config.yaml")), "utf-8"));
}