import fs from "node:fs";
import path from "node:path";

import {
	PipelineConfig,
	PipelineConfigSchema,
	mergePipelineConfig,
	resolveConfigPath,
	resolveProjectPaths,
} from "./schema";
import { ensureDirectories } from "./utils";

export interface LoadConfigOptions {
	configPath?: string;
	env?: string;
}

const DEFAULT_CONFIG_FILES = [
	path.join(process.cwd(), "config", "pipeline.json"),
	path.join(process.cwd(), "pipeline.json"),
];

const readJsonFile = (filePath: string): unknown => {
	const contents = fs.readFileSync(filePath, "utf-8");
	return contents.trim() === "" ? {} : JSON.parse(contents);
};

const locateConfigFile = (explicit?: string): string => {
	if (explicit && fs.existsSync(explicit)) {
		return explicit;
	}

	for (const candidate of DEFAULT_CONFIG_FILES) {
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}

	return DEFAULT_CONFIG_FILES[0];
};

const readPipelineConfig = (configPath: string): PipelineConfig => {
	if (!fs.existsSync(configPath)) {
		return PipelineConfigSchema.parse({
			paths: resolveProjectPaths(path.resolve(".")),
		});
	}

	const raw = readJsonFile(configPath);
	return PipelineConfigSchema.parse(raw);
};

const applyEnvironmentOverride = (
	baseConfig: PipelineConfig,
	basePath: string,
	env?: string,
): PipelineConfig => {
	if (!env || env === "development") {
		return baseConfig;
	}

	const overridePath = resolveConfigPath(basePath, env);
	if (!fs.existsSync(overridePath)) {
		return baseConfig;
	}

	const overrides = PipelineConfigSchema.parse(readJsonFile(overridePath));
	return mergePipelineConfig(baseConfig, overrides);
};

export const loadConfig = (options: LoadConfigOptions = {}): PipelineConfig => {
	const basePath = locateConfigFile(options.configPath);
	const config = applyEnvironmentOverride(
		readPipelineConfig(basePath),
		basePath,
		options.env,
	);

	ensureDirectories(config.paths);
	return config;
};

export const dumpConfig = (
	config: PipelineConfig,
	targetPath?: string,
): void => {
	const destination = targetPath ?? locateConfigFile();
	const normalized = PipelineConfigSchema.parse(config);
	fs.mkdirSync(path.dirname(destination), { recursive: true });
	fs.writeFileSync(destination, JSON.stringify(normalized, null, 2));
};
