import path from "node:path";

import { getUnixTime, parse, isMatch, format as formatDate } from "date-fns";
import { z } from "zod";

export const UpdateDirectionSchema = z.enum(["forward", "backward"]);
export type UpdateDirection = z.infer<typeof UpdateDirectionSchema>;

export const SourceKindSchema = z.enum(["wordpress", "html"]);
export type SourceKind = z.infer<typeof SourceKindSchema>;

export const SourceDateSchema = z.object({
	format: z.string().default("yyyy-LL-dd HH:mm"),
	pattern: z.string().nullable().optional(),
	replacement: z.string().nullable().optional(),
});
export type SourceDate = z.infer<typeof SourceDateSchema>;

export const SourceSelectorsSchema = z.object({
	articles: z.string().optional().nullable(),
	article_title: z.string().optional().nullable(),
	article_link: z.string().optional().nullable(),
	article_body: z.string().optional().nullable(),
	article_date: z.string().optional().nullable(),
	article_categories: z.string().optional().nullable(),
	pagination: z.string().default("ul.pagination > li a"),
});
export type SourceSelectors = z.infer<typeof SourceSelectorsSchema>;

const BaseSourceSchema = z.object({
	source_id: z.string(),
	source_url: z.string().url(),
	source_date: SourceDateSchema.default(SourceDateSchema.parse({})),
	source_kind: SourceKindSchema,
	categories: z.array(z.string()).default([]),
	supports_categories: z.boolean().default(false),
	requires_details: z.boolean().default(false),
	requires_rate_limit: z.boolean().default(false),
});

export const HtmlSourceConfigSchema = BaseSourceSchema.extend({
	source_kind: z.literal("html"),
	source_selectors: SourceSelectorsSchema.default(
		SourceSelectorsSchema.parse({}),
	),
	pagination_template: z.string(),
});

export const WordPressSourceConfigSchema = BaseSourceSchema.extend({
	source_kind: z.literal("wordpress"),
	source_date: SourceDateSchema.default(
		SourceDateSchema.parse({ format: "yyyy-LL-dd'T'HH:mm:ss" }),
	),
});

export type HtmlSourceConfig = z.infer<typeof HtmlSourceConfigSchema>;
export type WordPressSourceConfig = z.infer<typeof WordPressSourceConfigSchema>;
export type AnySourceConfig = HtmlSourceConfig | WordPressSourceConfig;

export const DateRangeSchema = z
	.object({
		start: z.number().int(),
		end: z.number().int(),
	})
	.superRefine((value, ctx) => {
		if (value.start === 0 || value.end === 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Timestamp cannot be zero",
			});
		}
		if (value.end < value.start) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "End timestamp must be greater than or equal to start",
			});
		}
	});

export type DateRange = z.infer<typeof DateRangeSchema>;

export const PageRangeSchema = z
	.object({
		start: z.number().int().min(0),
		end: z.number().int().min(0),
	})
	.superRefine((value, ctx) => {
		if (value.end < value.start) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "End page must be greater than or equal to start page",
			});
		}
	});

export type PageRange = z.infer<typeof PageRangeSchema>;

export const PageRangeSpecSchema = z
	.string()
	.regex(/^[0-9]+:[0-9]+$/, "Invalid page range format. Use start:end")
	.transform((spec) => {
		const [startText, endText] = spec.split(":");
		return {
			start: Number.parseInt(startText, 10),
			end: Number.parseInt(endText, 10),
		};
	});

const defaultDateFormat = "yyyy-LL-dd";

export const DateRangeSpecSchema = z
	.string()
	.regex(/.+:.+/, "Expected start:end format")
	.transform((spec) => {
		const [startRaw, endRaw] = spec.split(":");
		return { startRaw, endRaw };
	});

const parseDate = (value: string, format: string): Date => {
	if (!isMatch(value, format)) {
		throw new Error(`Invalid date '${value}' for format '${format}'`);
	}
	const parsed = parse(value, format, new Date());
	if (Number.isNaN(parsed.getTime())) {
		throw new Error(`Invalid date '${value}' for format '${format}'`);
	}
	return parsed;
};

export interface CreateDateRangeOptions {
	format?: string;
	separator?: string;
}

export const createDateRange = (
	spec: string,
	options: CreateDateRangeOptions = {},
): DateRange => {
	const { format = defaultDateFormat, separator = ":" } = options;
	if (!separator) {
		throw new Error("Separator cannot be empty");
	}

	const normalized = spec.replace(separator, ":");
	const parsedSpec = DateRangeSpecSchema.parse(normalized);

	const startDate = parseDate(parsedSpec.startRaw, format);
	const endDate = parseDate(parsedSpec.endRaw, format);

	const range = {
		start: getUnixTime(startDate),
		end: getUnixTime(endDate),
	};

	return DateRangeSchema.parse(range);
};

export const formatDateRange = (
	range: DateRange,
	fmt = defaultDateFormat,
): string => {
	const start = formatDate(new Date(range.start * 1000), fmt);
	const end = formatDate(new Date(range.end * 1000), fmt);
	return `${start}:${end}`;
};

export const isTimestampInRange = (
	range: DateRange,
	timestamp: number,
): boolean => {
	return range.start <= timestamp && timestamp <= range.end;
};

export const ProjectPathsSchema = z.object({
	root: z.string(),
	data: z.string(),
	logs: z.string(),
	configs: z.string(),
});
export type ProjectPaths = z.infer<typeof ProjectPathsSchema>;

export const resolveProjectPaths = (rootDir: string): ProjectPaths => {
	return ProjectPathsSchema.parse({
		root: rootDir,
		data: path.join(rootDir, "data", "dataset"),
		logs: path.join(rootDir, "data", "logs"),
		configs: path.join(rootDir, "config"),
	});
};

export const LoggingConfigSchema = z.object({
	level: z.string().default("INFO"),
	format: z
		.string()
		.default("%(asctime)s - %(name)s - %(levelname)s - %(message)s"),
	console_logging: z.boolean().default(true),
	file_logging: z.boolean().default(false),
	log_file: z.string().default("crawler.log"),
	max_log_size: z
		.number()
		.int()
		.positive()
		.default(10 * 1024 * 1024),
	backup_count: z.number().int().nonnegative().default(5),
});
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;

export const ClientConfigSchema = z.object({
	timeout: z.number().positive().default(20),
	user_agent: z
		.string()
		.default("Basango/0.1 (+https://github.com/bernard-ng/basango)"),
	follow_redirects: z.boolean().default(true),
	verify_ssl: z.boolean().default(true),
	rotate: z.boolean().default(true),
	max_retries: z.number().int().nonnegative().default(3),
	backoff_initial: z.number().nonnegative().default(1),
	backoff_multiplier: z.number().positive().default(2),
	backoff_max: z.number().nonnegative().default(30),
	respect_retry_after: z.boolean().default(true),
});

export const CrawlerConfigSchema = z.object({
	source: z
		.union([HtmlSourceConfigSchema, WordPressSourceConfigSchema])
		.optional(),
	page_range: PageRangeSchema.optional(),
	date_range: DateRangeSchema.optional(),
	category: z.string().optional(),
	notify: z.boolean().default(false),
	is_update: z.boolean().default(false),
	use_multi_threading: z.boolean().default(false),
	max_workers: z.number().int().positive().default(5),
	direction: UpdateDirectionSchema.default("forward"),
});

export type ClientConfig = z.infer<typeof ClientConfigSchema>;
export type CrawlerConfig = z.infer<typeof CrawlerConfigSchema> & {
	source?: AnySourceConfig;
};

export const FetchConfigSchema = z.object({
	client: ClientConfigSchema.default(ClientConfigSchema.parse({})),
	crawler: CrawlerConfigSchema.default(CrawlerConfigSchema.parse({})),
});
export type FetchConfig = z.infer<typeof FetchConfigSchema>;

const SourcesConfigSchema = z.object({
	html: z.array(HtmlSourceConfigSchema).default([]),
	wordpress: z.array(WordPressSourceConfigSchema).default([]),
});

export type SourcesConfig = z.infer<typeof SourcesConfigSchema> & {
	find: (sourceId: string) => AnySourceConfig | undefined;
};

export const createSourcesConfig = (input: unknown): SourcesConfig => {
	const parsed = SourcesConfigSchema.parse(input);
	const resolver = (sourceId: string) =>
		[...parsed.html, ...parsed.wordpress].find(
			(source) => source.source_id === sourceId,
		);
	return Object.assign({ find: resolver }, parsed);
};

export const PipelineConfigSchema = z.object({
	paths: ProjectPathsSchema.default(resolveProjectPaths(process.cwd())),
	logging: LoggingConfigSchema.default(LoggingConfigSchema.parse({})),
	fetch: FetchConfigSchema.default(FetchConfigSchema.parse({})),
	sources: z
		.union([SourcesConfigSchema, z.undefined()])
		.transform((value) => createSourcesConfig(value ?? {})),
});

export type PipelineConfig = z.infer<typeof PipelineConfigSchema> & {
	sources: SourcesConfig;
};

export const mergePipelineConfig = (
	base: PipelineConfig,
	overrides: Partial<PipelineConfig>,
): PipelineConfig => {
	const paths = overrides.paths ?? base.paths;
	const logging = { ...base.logging, ...(overrides.logging ?? {}) };
	const fetch = {
		client: { ...base.fetch.client, ...(overrides.fetch?.client ?? {}) },
		crawler: { ...base.fetch.crawler, ...(overrides.fetch?.crawler ?? {}) },
	};

	const sources = createSourcesConfig({
		html: overrides.sources?.html ?? base.sources.html,
		wordpress: overrides.sources?.wordpress ?? base.sources.wordpress,
	});

	return {
		paths,
		logging,
		fetch,
		sources,
	};
};

export const resolveConfigPath = (basePath: string, env?: string): string => {
	if (!env || env === "development") {
		return basePath;
	}

	const ext = path.extname(basePath);
	const withoutExt = basePath.slice(0, basePath.length - ext.length);
	return `${withoutExt}.${env}${ext}`;
};

export const schemaToJSON = <T extends z.ZodTypeAny>(schema: T) =>
	schema.toJSON();
