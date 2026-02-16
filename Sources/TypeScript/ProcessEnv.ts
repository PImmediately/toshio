/* eslint-disable @typescript-eslint/no-namespace */
declare module "process" {
	global {
		namespace NodeJS {
			interface ProcessEnv {
				NODE_ENV: "development" | "production";

				DISCORD_BOT_CLIENT_ID: string;
				DISCORD_BOT_CLIENT_SECRET: string;
				DISCORD_BOT_TOKEN: string;
			}
		}
	}
};