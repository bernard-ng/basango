import os
from dataclasses import dataclass, field
from typing import Iterable

from redis import Redis
from rq import Queue

from .schemas import (
    ArticleTaskPayload,
    ListingTaskPayload,
    ProcessedTaskPayload,
)


@dataclass(slots=True)
class QueueSettings:
    redis_url: str = field(
        default_factory=lambda: os.getenv(  # type: ignore[arg-type]
            "BASANGO_REDIS_URL", "redis://localhost:6379/0"
        )
    )
    prefix: str = field(
        default_factory=lambda: os.getenv("BASANGO_QUEUE_PREFIX", "crawler")
    )
    default_timeout: int = field(
        default_factory=lambda: int(os.getenv("BASANGO_QUEUE_TIMEOUT", "600"))
    )
    result_ttl: int = field(
        default_factory=lambda: int(os.getenv("BASANGO_QUEUE_RESULT_TTL", "3600"))
    )
    failure_ttl: int = field(
        default_factory=lambda: int(os.getenv("BASANGO_QUEUE_FAILURE_TTL", "3600"))
    )
    listing_queue: str = "listing"
    article_queue: str = "articles"
    processed_queue: str = "processed"


class QueueManager:
    def __init__(self, settings: QueueSettings | None = None) -> None:
        self.settings = settings or QueueSettings()
        self.connection = Redis.from_url(self.settings.redis_url)
        self.listing_queue = self._build_queue(self.settings.listing_queue)
        self.article_queue = self._build_queue(self.settings.article_queue)
        self.processed_queue = self._build_queue(self.settings.processed_queue)

    def _build_queue(self, suffix: str) -> Queue:
        return Queue(
            self.queue_name(suffix),
            connection=self.connection,
            default_timeout=self.settings.default_timeout,
            result_ttl=self.settings.result_ttl,
            failure_ttl=self.settings.failure_ttl,
        )

    def queue_name(self, suffix: str) -> str:
        return f"{self.settings.prefix}:{suffix}"

    def enqueue_listing(self, payload: ListingTaskPayload):
        return self.listing_queue.enqueue(
            "basango.services.crawler.async.tasks.collect_listing",
            payload.to_dict(),
        )

    def enqueue_article(self, payload: ArticleTaskPayload):
        return self.article_queue.enqueue(
            "basango.services.crawler.async.tasks.collect_article",
            payload.to_dict(),
        )

    def enqueue_processed(self, payload: ProcessedTaskPayload):
        return self.processed_queue.enqueue(
            "basango.services.crawler.async.tasks.forward_for_processing",
            payload.to_dict(),
        )

    def iter_queue_names(self) -> Iterable[str]:
        yield self.queue_name(self.settings.listing_queue)
        yield self.queue_name(self.settings.article_queue)
        yield self.queue_name(self.settings.processed_queue)
