import { EventEmitter as NodeEventEmitter } from "node:events";

export type MappedEvents<E> = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[K in keyof E]: (...args: any[]) => void;
};

export default class EventEmitter<E extends MappedEvents<E>> {

	private readonly emitter = new NodeEventEmitter();

	public on<K extends keyof E>(event: K, listener: E[K]): void {
		this.emitter.on(event as string | symbol, listener);
	}

	public once<K extends keyof E>(event: K, listener: E[K]): void {
		this.emitter.once(event as string | symbol, listener);
	}

	public off<K extends keyof E>(event: K, listener: E[K]): void {
		this.emitter.off(event as string | symbol, listener);
	}

	public emit<K extends keyof E>(event: K, ...args: Parameters<E[K]>): boolean {
		return this.emitter.emit(event as string | symbol, ...args);
	}

	public removeAllListeners<K extends keyof E>(event?: K): void {
		if (event === undefined) {
			this.emitter.removeAllListeners();
		} else {
			this.emitter.removeAllListeners(event as string | symbol);
		}
	}

}