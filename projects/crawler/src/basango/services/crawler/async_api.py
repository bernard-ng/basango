from __future__ import annotations

from importlib import import_module
from typing import Any, Sequence

_async_queue = import_module("basango.services.crawler.async.queue")
_async_tasks = import_module("basango.services.crawler.async.tasks")
_async_worker = import_module("basango.services.crawler.async.worker")
_async_schemas = import_module("basango.services.crawler.async.schemas")

QueueManager = getattr(_async_queue, "QueueManager")
QueueSettings = getattr(_async_queue, "QueueSettings")
ListingTaskPayload = getattr(_async_schemas, "ListingTaskPayload")
ArticleTaskPayload = getattr(_async_schemas, "ArticleTaskPayload")
ProcessedTaskPayload = getattr(_async_schemas, "ProcessedTaskPayload")
schedule_async_crawl = getattr(_async_tasks, "schedule_async_crawl")
collect_listing = getattr(_async_tasks, "collect_listing")
collect_article = getattr(_async_tasks, "collect_article")
forward_for_processing = getattr(_async_tasks, "forward_for_processing")
start_worker = getattr(_async_worker, "start_worker")

__all__ = [
    "QueueManager",
    "QueueSettings",
    "ListingTaskPayload",
    "ArticleTaskPayload",
    "ProcessedTaskPayload",
    "schedule_async_crawl",
    "collect_listing",
    "collect_article",
    "forward_for_processing",
    "start_worker",
]
