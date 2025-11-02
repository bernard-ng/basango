import fs from "node:fs";
import path from "node:path";

import { logger } from "@basango/logger";

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

export const locateConfigFile = (explicit?: string): string => {
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

export interface PipelineConfigManagerOptions {
        configPath?: string;
        env?: string;
        autoLoad?: boolean;
}

export class PipelineConfigManager {
        private readonly explicitPath?: string;

        private readonly defaultEnv: string;

        private cache?: PipelineConfig;

        constructor(options: PipelineConfigManagerOptions = {}) {
                this.explicitPath = options.configPath;
                this.defaultEnv = options.env ?? "development";

                if (options.autoLoad !== false) {
                        this.cache = loadConfig({
                                configPath: this.explicitPath,
                                env: this.defaultEnv,
                        });
                }
        }

        get(env?: string): PipelineConfig {
                const resolvedEnv = env ?? this.defaultEnv;

                if (resolvedEnv !== this.defaultEnv) {
                        return loadConfig({
                                configPath: this.explicitPath,
                                env: resolvedEnv,
                        });
                }

                if (!this.cache) {
                        this.cache = loadConfig({
                                configPath: this.explicitPath,
                                env: resolvedEnv,
                        });
                }

                return this.cache;
        }

        reload(env?: string): PipelineConfig {
                const resolvedEnv = env ?? this.defaultEnv;
                const config = loadConfig({
                        configPath: this.explicitPath,
                        env: resolvedEnv,
                });

                if (resolvedEnv === this.defaultEnv) {
                        this.cache = config;
                }

                return config;
        }

        ensureDirectories(config?: PipelineConfig): PipelineConfig {
                const pipeline = config ?? this.get();
                ensureDirectories(pipeline.paths);
                return pipeline;
        }

        setupLogging(config?: PipelineConfig): void {
                const pipeline = config ?? this.get();
                this.ensureDirectories(pipeline);

                const level = pipeline.logging.level.toLowerCase();
                process.env.LOG_LEVEL = level;
                const normalizedLevel = level as typeof logger.level;
                logger.level = normalizedLevel;

                if (pipeline.logging.file_logging) {
                        const logDir = pipeline.paths.logs;
                        const destination = path.join(
                                logDir,
                                pipeline.logging.log_file,
                        );
                        fs.mkdirSync(path.dirname(destination), { recursive: true });
                        if (!fs.existsSync(destination)) {
                                fs.writeFileSync(destination, "");
                        }
                }
        }

        resolveConfigPath(env?: string): string {
                const base = locateConfigFile(this.explicitPath);
                return resolveConfigPath(base, env ?? this.defaultEnv);
        }
}
