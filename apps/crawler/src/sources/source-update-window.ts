import { type AnySourceOptions, config } from "@basango/domain/config";
import type { SourceUpdateDates, TimestampRange } from "@basango/domain/models";
import { logger } from "@basango/logger";
import { getUnixTime } from "date-fns";

import { SyncHttpClient } from "#crawler/http/http-client";

export const getSourceUpdateDates = async (sourceId: string): Promise<SourceUpdateDates> => {
  const client = new SyncHttpClient(config.crawler.fetch.client);
  const endpoint = config.crawler.backend.endpoint;

  logger.info({ sourceId }, "Fetching source update dates");
  const response = await client.post(`${endpoint}/sources/update-dates`, {
    headers: {
      Authorization: config.crawler.backend.token,
    },
    json: {
      name: sourceId,
    },
  });

  if (response.ok) {
    const data = await response.json();
    logger.info({ ...data }, "Retrieved source update dates");
    return data;
  }

  logger.error({ sourceId, status: response.status }, "Failed to retrieve source update dates");
  return { earliest: new Date(), latest: new Date() };
};

export const resolveSourceUpdateDates = async (settings: {
  dateRange?: TimestampRange;
  direction: "forward" | "backward";
  source?: AnySourceOptions;
}) => {
  if (settings.dateRange !== undefined || !settings.source) {
    return;
  }

  const dates = await getSourceUpdateDates(settings.source.sourceId);

  switch (settings.direction) {
    case "backward":
      settings.dateRange = {
        end: getUnixTime(new Date()),
        start: getUnixTime(dates.earliest),
      };
      logger.info(
        { dateRange: settings.dateRange, sourceId: settings.source.sourceId },
        "Set date range start from earliest published date",
      );
      break;
    case "forward":
      if (dates.latest) {
        settings.dateRange = {
          end: getUnixTime(new Date()),
          start: getUnixTime(dates.latest),
        };
        logger.info(
          { dateRange: settings.dateRange, sourceId: settings.source.sourceId },
          "Set date range start from latest published date",
        );
      }
      break;
  }
};
