from typing import List, Optional
from enum import Enum

import typer

from basango.core.config import CrawlerConfig
from basango.core.config_manager import ConfigManager
from basango.domain import DateRange, PageRange, UpdateDirection
from basango.services import CsvPersistor, JsonPersistor
from basango.services.crawler.async_api import (
    QueueSettings,
    schedule_async_crawl,
    start_worker,
)
from basango.services.crawler.html_crawler import HtmlCrawler
from basango.services.crawler.wordpress_crawler import WordpressCrawler

app = typer.Typer(no_args_is_help=True, add_completion=False)


class QueueName(str, Enum):
    listing = "listing"
    articles = "articles"
    processed = "processed"


@app.command("crawl")
def crawl_cmd(
    source_id: str = typer.Option(
        ..., help="Source id to crawl (as defined in config)"
    ),
    page: str = typer.Option(None, "--page", "-p", help="Page range e.g. '1:10'"),
    date: str = typer.Option(
        None, "--date", "-d", help="Date range e.g. '2024-10-01:2024-10-31'"
    ),
    category: str = typer.Option(None, "--category", "-g", help="Optional category"),
    notify: bool = typer.Option(False, "--notify", "-n", help="Enable notifications"),
    env: str = typer.Option("development", "--env", "-c", help="Environment"),
    async_mode: bool = typer.Option(
        False,
        "--async/--no-async",
        help="Schedule crawl through Redis queues instead of running synchronously.",
    ),
) -> None:
    """Crawl a single source, either synchronously or via the async queue."""
    manager = ConfigManager()
    pipeline = manager.get(env)
    manager.ensure_directories(pipeline)
    manager.setup_logging(pipeline)

    source = pipeline.sources.find(source_id)
    if source is None:
        raise typer.BadParameter(f"Source '{source_id}' not found in config")

    if async_mode:
        job_id = schedule_async_crawl(
            source_id=source_id,
            env=env,
            page_range=page,
            date_range=date,
            category=category,
        )
        typer.echo(
            f"Scheduled async crawl job {job_id} for source '{source_id}' on queue"
        )
        return

    crawler_config = CrawlerConfig(
        source=source,
        page_range=PageRange.create(page) if page else None,
        date_range=DateRange.create(date) if date else None,
        category=category,
        notify=notify,
        direction=UpdateDirection.FORWARD,
    )

    crawlers = [
        HtmlCrawler,
        WordpressCrawler,
    ]

    source_identifier = getattr(source, "source_id", source_id) or source_id
    persistors = [
        CsvPersistor(
            data_dir=pipeline.paths.data,
            source_id=str(source_identifier),
        ),
        JsonPersistor(
            data_dir=pipeline.paths.data,
            source_id=str(source_identifier),
        ),
    ]

    for crawler in crawlers:
        if crawler.supports() == source.source_kind:
            crawler = crawler(
                crawler_config,
                pipeline.fetch.client,
                persistors=persistors,
            )
            crawler.fetch()
            break


@app.command("worker")
def worker_cmd(
    queue: Optional[List[QueueName]] = typer.Option(
        None,
        "--queue",
        "-q",
        help=(
            "Queue name(s) (without prefix). Choices: listing, articles, processed. "
            "Provide multiple times to listen to more than one queue."
        ),
    ),
    simple: bool = typer.Option(
        False,
        "--simple/--no-simple",
        help=(
            "Run jobs in-process using RQ SimpleWorker (no forking). "
            "Recommended on macOS to avoid fork-related crashes."
        ),
    ),
    burst: bool = typer.Option(
        False,
        "--burst",
        help="Process available jobs and exit instead of running continuously.",
    ),
    redis_url: str = typer.Option(
        None,
        "--redis-url",
        help="Redis connection URL. Defaults to BASANGO_REDIS_URL.",
    ),
    env: str = typer.Option(
        "development",
        "--env",
        "-c",
        help="Environment used to configure logging before starting the worker.",
    ),
) -> None:
    """Run an RQ worker that consumes crawler queues."""
    manager = ConfigManager()
    pipeline = manager.get(env)
    manager.ensure_directories(pipeline)
    manager.setup_logging(pipeline)

    settings = QueueSettings(redis_url=redis_url) if redis_url else QueueSettings()
    queue_names = [q.value for q in queue] if queue else None
    start_worker(
        queue_names=queue_names,
        settings=settings,
        burst=burst,
        simple=simple,
    )
