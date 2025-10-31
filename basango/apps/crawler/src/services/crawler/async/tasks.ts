import {
	ListingTaskPayloadSchema,
	ArticleTaskPayloadSchema,
	ProcessedTaskPayloadSchema,
	ListingTaskPayload,
	ArticleTaskPayload,
	ProcessedTaskPayload,
} from "./schemas";
import {
	createQueueManager,
	QueueManager,
	QueueSettings,
	QueueSettingsInput,
} from "./queue";

export interface CrawlerTaskHandlers {
	collectListing: (payload: ListingTaskPayload) => Promise<number> | number;
	collectArticle: (payload: ArticleTaskPayload) => Promise<unknown> | unknown;
	forwardForProcessing: (
		payload: ProcessedTaskPayload,
	) => Promise<unknown> | unknown;
}

const notImplemented = (name: keyof CrawlerTaskHandlers) => () => {
	throw new Error(`Crawler task handler '${name}' is not implemented`);
};

let handlers: CrawlerTaskHandlers = {
	collectListing: notImplemented("collectListing"),
	collectArticle: notImplemented("collectArticle"),
	forwardForProcessing: notImplemented("forwardForProcessing"),
};

export const registerCrawlerTaskHandlers = (
	overrides: Partial<CrawlerTaskHandlers>,
): void => {
	handlers = { ...handlers, ...overrides };
};

export interface ScheduleAsyncCrawlOptions {
	sourceId: string;
	env?: string;
	pageRange?: string | null;
	dateRange?: string | null;
	category?: string | null;
	settings?: QueueSettings | QueueSettingsInput;
	queueManager?: QueueManager;
}

export const scheduleAsyncCrawl = async ({
	sourceId,
	env = "development",
	pageRange,
	dateRange,
	category,
	settings,
	queueManager,
}: ScheduleAsyncCrawlOptions): Promise<string> => {
	const payload = ListingTaskPayloadSchema.parse({
		source_id: sourceId,
		env,
		page_range: pageRange ?? undefined,
		date_range: dateRange ?? undefined,
		category: category ?? undefined,
	});

	const manager = queueManager ?? createQueueManager({ settings });
	try {
		const job = await manager.enqueueListing(payload);
		return job.id;
	} finally {
		if (!queueManager) {
			await manager.close();
		}
	}
};

export const collectListing = async (payload: unknown): Promise<number> => {
	const data = ListingTaskPayloadSchema.parse(payload);
	const result = await handlers.collectListing(data);
	return typeof result === "number" ? result : 0;
};

export const collectArticle = async (payload: unknown): Promise<unknown> => {
	const data = ArticleTaskPayloadSchema.parse(payload);
	return handlers.collectArticle(data);
};

export const forwardForProcessing = async (
	payload: unknown,
): Promise<unknown> => {
	const data = ProcessedTaskPayloadSchema.parse(payload);
	return handlers.forwardForProcessing(data);
};
