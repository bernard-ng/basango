from __future__ import annotations

import logging
from typing import Any

from basango.core.config import CrawlerConfig
from basango.core.config_manager import ConfigManager
from basango.domain import DateRange, PageRange, SourceKind, UpdateDirection
from basango.services import CsvPersistor
from basango.services.crawler.html_crawler import HtmlCrawler
from basango.services.crawler.wordpress_crawler import WordpressCrawler

from .queue import QueueManager, QueueSettings
from .schemas import (
    ArticleTaskPayload,
    ListingTaskPayload,
    ProcessedTaskPayload,
)


logger = logging.getLogger(__name__)


def schedule_async_crawl(
    *,
    source_id: str,
    env: str = "development",
    page_range: str | None = None,
    date_range: str | None = None,
    category: str | None = None,
    settings: QueueSettings | None = None,
):
    payload = ListingTaskPayload(
        source_id=source_id,
        env=env,
        page_range=page_range,
        date_range=date_range,
        category=category,
    )
    manager = QueueManager(settings=settings)
    job = manager.enqueue_listing(payload)
    logger.info("Scheduled listing collection job %s for source %s", job.id, source_id)
    return job.id


def collect_listing(payload: dict[str, Any]) -> int:
    data = ListingTaskPayload.from_dict(payload)
    manager = ConfigManager()
    pipeline = manager.get(data.env)
    source = pipeline.sources.find(data.source_id)
    if source is None:
        logger.error("Unknown source id %s", data.source_id)
        return 0

    crawler_config = CrawlerConfig(
        source=source,
        page_range=PageRange.create(data.page_range) if data.page_range else None,
        date_range=DateRange.create(data.date_range) if data.date_range else None,
        category=data.category,
        notify=False,
        direction=UpdateDirection.FORWARD,
    )
    client_config = pipeline.fetch.client
    queue_manager = QueueManager()

    if source.source_kind == SourceKind.HTML:
        crawler = HtmlCrawler(crawler_config, client_config)
        queued = _collect_html_listing(crawler, data, queue_manager)
    elif source.source_kind == SourceKind.WORDPRESS:
        crawler = WordpressCrawler(crawler_config, client_config)
        queued = _collect_wordpress_listing(crawler, data, queue_manager)
    else:
        logger.warning(
            "Async crawling not supported for source kind %s", source.source_kind
        )
        queued = 0

    logger.info("Queued %s article detail jobs for source %s", queued, data.source_id)
    return queued


def collect_article(payload: dict[str, Any]) -> dict[str, Any] | None:
    data = ArticleTaskPayload.from_dict(payload)
    manager = ConfigManager()
    pipeline = manager.get(data.env)
    source = pipeline.sources.find(data.source_id)
    if source is None:
        logger.error("Unknown source id %s", data.source_id)
        return None

    crawler_config = CrawlerConfig(
        source=source,
        date_range=DateRange.create(data.date_range) if data.date_range else None,
        category=data.category,
        notify=False,
        direction=UpdateDirection.FORWARD,
    )

    source_identifier = getattr(source, "source_id", data.source_id) or data.source_id
    persistors = [
        CsvPersistor(
            data_dir=pipeline.paths.data,
            source_id=str(source_identifier),
        )
    ]

    queue_manager = QueueManager()

    if source.source_kind == SourceKind.HTML:
        article = _collect_html_article(
            HtmlCrawler(crawler_config, pipeline.fetch.client, persistors=persistors),
            data,
        )
    elif source.source_kind == SourceKind.WORDPRESS:
        article = _collect_wordpress_article(
            WordpressCrawler(
                crawler_config, pipeline.fetch.client, persistors=persistors
            ),
            data,
        )
    else:
        logger.warning(
            "Async crawling not supported for source kind %s", source.source_kind
        )
        article = None

    if article:
        queue_manager.enqueue_processed(
            ProcessedTaskPayload(
                source_id=data.source_id,
                env=data.env,
                article=article,
            )
        )
        logger.info(
            "Persisted article %s and forwarded to processed queue",
            article.get("link"),
        )

    return article


def forward_for_processing(payload: dict[str, Any]) -> dict[str, Any] | None:
    data = ProcessedTaskPayload.from_dict(payload)
    article = dict(data.article) if data.article is not None else None
    if article is None:
        logger.info(
            "Ready for downstream processing: source=%s (no article)", data.source_id
        )
        return None
    logger.info(
        "Ready for downstream processing: source=%s link=%s",
        data.source_id,
        article.get("link"),
    )
    return article


def _collect_html_listing(
    crawler: HtmlCrawler,
    payload: ListingTaskPayload,
    queue_manager: QueueManager,
) -> int:
    source = crawler.source
    selector = source.source_selectors.articles
    if not selector:
        logger.warning(
            "No article selector configured for HTML source %s",
            source.source_id,
        )
        return 0

    page_range = crawler.config.page_range or crawler.get_pagination()
    queued = 0

    for page in range(page_range.start, page_range.end + 1):
        page_url = crawler._build_page_url(page)
        try:
            soup = crawler.crawl(page_url, page)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to crawl page %s: %s", page_url, exc)
            continue

        for node in soup.select(selector):
            link = crawler._extract_link(node)
            if not link:
                continue
            queue_manager.enqueue_article(
                ArticleTaskPayload(
                    source_id=payload.source_id,
                    env=payload.env,
                    url=link,
                    date_range=payload.date_range,
                    category=payload.category,
                )
            )
            queued += 1

    return queued


def _collect_wordpress_listing(
    crawler: WordpressCrawler,
    payload: ListingTaskPayload,
    queue_manager: QueueManager,
) -> int:
    page_range = crawler.config.page_range or crawler.get_pagination()
    queued = 0

    for page in range(page_range.start, page_range.end + 1):
        endpoint = crawler._posts_endpoint(page)
        try:
            response = crawler.client.get(endpoint)
            articles = response.json()
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to fetch WordPress page %s: %s", endpoint, exc)
            continue

        if not isinstance(articles, list):
            logger.warning("Unexpected WordPress payload type: %s", type(articles))
            continue

        for entry in articles:
            queue_manager.enqueue_article(
                ArticleTaskPayload(
                    source_id=payload.source_id,
                    env=payload.env,
                    url=entry.get("link"),
                    data=entry,
                    date_range=payload.date_range,
                    category=payload.category,
                )
            )
            queued += 1

    return queued


def _collect_html_article(
    crawler: HtmlCrawler,
    payload: ArticleTaskPayload,
) -> dict[str, Any] | None:
    if not payload.url:
        logger.warning("Missing article url for HTML source %s", payload.source_id)
        return None

    crawler._current_article_url = payload.url  # type: ignore[attr-defined]
    try:
        soup = crawler.crawl(payload.url)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to crawl article %s: %s", payload.url, exc)
        return None

    crawler.fetch_one(str(soup), crawler.config.date_range)
    crawler.completed(False)
    return None


def _collect_wordpress_article(
    crawler: WordpressCrawler,
    payload: ArticleTaskPayload,
) -> dict[str, Any] | None:
    if payload.data is None:
        logger.warning("Missing WordPress payload for source %s", payload.source_id)
        return None

    crawler.fetch_one(payload.data, crawler.config.date_range)
    crawler.completed(False)
    return None
