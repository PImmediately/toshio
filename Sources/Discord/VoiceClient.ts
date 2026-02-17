import EventEmitter from "./../Utils/Events";

import * as DiscordVoice from "@discordjs/voice";
import Discord from "discord.js";

import type fs from "node:fs";

export interface VoiceClientEvents {
	connect: (connectionID: number) => void;
	disconnect: (connectionID: number) => void;
	error: (error: Error) => void;
}

export default class VoiceClient extends EventEmitter<VoiceClientEvents> {

	private connection: DiscordVoice.VoiceConnection | null = null;
	private player: DiscordVoice.AudioPlayer | null = null;

	private destroyed: boolean = false;

	private connectionID: number = 0;

	public constructor(private readonly guild: Discord.Guild, private readonly channel: Discord.VoiceBasedChannel) {
		super();
	}

	public getConnectionID(): number { return this.connectionID; }

	public async connect(): Promise<void> {
		if (this.destroyed) return;

		const connectionID = ++this.connectionID;

		this.connection = DiscordVoice.joinVoiceChannel({
			channelId: this.channel.id,
			guildId: this.guild.id,
			adapterCreator: this.guild.voiceAdapterCreator,
			selfMute: false,
			selfDeaf: false
		});

		this.connection.on(DiscordVoice.VoiceConnectionStatus.Disconnected, async () => {
			if (this.destroyed) return;

			this.connection?.destroy();
			this.connection = null;

			if (connectionID === this.getConnectionID()) this.emit("disconnect", connectionID);
		});

		await DiscordVoice.entersState(this.connection, DiscordVoice.VoiceConnectionStatus.Ready, 10_000);
		if (connectionID === this.getConnectionID()) this.emit("connect", connectionID);
	}

	public async play(factory: () => fs.ReadStream): Promise<void> {
		if (!this.connection) throw new Error("Voice connection not established.");

		this.player?.stop(true);
		this.player = DiscordVoice.createAudioPlayer();
		this.player.on("error", (error) => {
			this.emit("error", error);
		});

		const stream = factory();
		const resource = DiscordVoice.createAudioResource(stream);

		this.player.play(resource);
		this.connection.subscribe(this.player);

		await DiscordVoice.entersState(this.player, DiscordVoice.AudioPlayerStatus.Idle, 30_000);
	}

	public destroy(): void {
		this.destroyed = true;

		this.connection?.destroy();
		this.connection = null;

		this.player = null;
	}

}