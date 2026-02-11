import path from "node:path";

export default function getNativePath(basePath: string): string {
	const directory = path.dirname(basePath)
		.replaceAll("\\", "/")
		.replace("/dist/Sources", "/Sources");
	const fileName = path.basename(basePath);
	return path.join(directory, fileName);
}