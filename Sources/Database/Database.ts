import path from "node:path";
import fs from "node:fs";

export default abstract class Database<T> {

	public data!: T;

	public constructor(public readonly filename: string, data: T) {
		if (!fs.existsSync(this.getPath())) {
			this.data = data;
			this.write();
		}
		this.read();
	}

	private getPath(): string {
		const dir = path.join(__dirname, "..", "..", "..", "database");
		if (!fs.existsSync(dir)) fs.mkdirSync(dir);
		return path.join(dir, this.filename);
	}

	public write(): void {
		fs.writeFileSync(this.getPath(), JSON.stringify(this.data, null, "\t"), "utf-8");
	}

	public read(): void {
		this.data = JSON.parse(fs.readFileSync(this.getPath(), "utf-8")) as T;
	}

}