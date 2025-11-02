import fs from "node:fs";

import type { RedisOptions } from "ioredis";
import { get_encoding } from "tiktoken";

import type { ProjectPaths } from "@crawler/schema";

export const ensureDirectories = (paths: ProjectPaths): void => {
	for (const dir of [paths.data, paths.logs, paths.configs]) {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
	}
};

export const parseRedisUrl = (url: string): RedisOptions => {
	if (!url.startsWith("redis://")) {
		return {};
	}
	const parsed = new URL(url);
	return {
		host: parsed.hostname,
		port: Number(parsed.port || 6379),
		password: parsed.password || undefined,
		db: Number(parsed.pathname?.replace("/", "") || 0),
	};
};

export const countTokens = (text: string, encoding = "cl100k_base"): number => {
	try {
		const encoder = get_encoding(encoding);
		const tokens = encoder.encode(text);
		encoder.free();
		return tokens.length;
	} catch {
		return text.length;
	}
};
