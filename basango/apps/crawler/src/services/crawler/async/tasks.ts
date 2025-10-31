import { logger } from "@basango/logger";

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
        logger.debug(
                {
                        sourceId,
                        env: payload.env,
                        pageRange: payload.page_range,
                        dateRange: payload.date_range,
                        category: payload.category,
                },
                "Scheduling listing collection job",
        );
        try {
                const job = await manager.enqueueListing(payload);
                logger.info(
                        { jobId: job.id, sourceId, env: payload.env },
                        "Scheduled listing collection job",
                );
                return job.id;
        } finally {
                if (!queueManager) {
                        await manager.close();
                }
	}
};

export const collectListing = async (payload: unknown): Promise<number> => {
        const data = ListingTaskPayloadSchema.parse(payload);
        logger.debug(
                {
                        sourceId: data.source_id,
                        env: data.env,
                        pageRange: data.page_range,
                        dateRange: data.date_range,
                        category: data.category,
                },
                "Collecting listing",
        );

        const result = await handlers.collectListing(data);
        const count = typeof result === "number" ? result : 0;

        logger.info(
                {
                        sourceId: data.source_id,
                        env: data.env,
                        queuedArticles: count,
                },
                "Listing collection completed",
        );

        return count;
};

export const collectArticle = async (payload: unknown): Promise<unknown> => {
        const data = ArticleTaskPayloadSchema.parse(payload);
        logger.debug(
                {
                        sourceId: data.source_id,
                        env: data.env,
                        url: data.url,
                        page: data.page,
                },
                "Collecting article",
        );

        const result = await handlers.collectArticle(data);

        logger.info(
                {
                        sourceId: data.source_id,
                        env: data.env,
                        url: data.url,
                },
                "Article collection completed",
        );

        return result;
};

export const forwardForProcessing = async (
        payload: unknown,
): Promise<unknown> => {
        const data = ProcessedTaskPayloadSchema.parse(payload);
        logger.debug(
                {
                        sourceId: data.source_id,
                        env: data.env,
                },
                "Forwarding article for processing",
        );

        const result = await handlers.forwardForProcessing(data);

        logger.info(
                {
                        sourceId: data.source_id,
                        env: data.env,
                },
                "Article forwarded for processing",
        );

        return result;
};
