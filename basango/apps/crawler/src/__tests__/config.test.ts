import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadConfig } from "./config";
import { resolveConfigPath } from "./schema";

describe("loadConfig", () => {
	it("parses json configuration and ensures directories", () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "crawler-config-"));
		const paths = {
			root: tempDir,
			data: path.join(tempDir, "data"),
			logs: path.join(tempDir, "logs"),
			configs: path.join(tempDir, "configs"),
		};

		const configPath = path.join(tempDir, "pipeline.json");
		fs.writeFileSync(
			configPath,
			JSON.stringify(
				{
					paths,
					fetch: {
						client: { timeout: 10 },
					},
				},
				null,
				2,
			),
		);

		const config = loadConfig({ configPath });

		expect(config.fetch.client.timeout).toBe(10);
		expect(fs.existsSync(paths.data)).toBe(true);
		expect(fs.existsSync(paths.logs)).toBe(true);
		expect(fs.existsSync(paths.configs)).toBe(true);
	});

	it("merges environment override if available", () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "crawler-config-"));
		const paths = {
			root: tempDir,
			data: path.join(tempDir, "data"),
			logs: path.join(tempDir, "logs"),
			configs: path.join(tempDir, "configs"),
		};

		const basePath = path.join(tempDir, "pipeline.json");
		fs.writeFileSync(
			basePath,
			JSON.stringify(
				{
					paths,
					logging: { level: "INFO" },
				},
				null,
				2,
			),
		);

		const overridePath = resolveConfigPath(basePath, "production");
		fs.writeFileSync(
			overridePath,
			JSON.stringify(
				{
					logging: { level: "DEBUG" },
				},
				null,
				2,
			),
		);

		const config = loadConfig({ configPath: basePath, env: "production" });

		expect(config.logging.level).toBe("DEBUG");
	});
});
