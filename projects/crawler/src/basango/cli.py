import typer

from basango.core.config import CrawlerConfig
from basango.core.config_manager import ConfigManager
from basango.domain import PageRange, DateRange, UpdateDirection
from basango.services.crawler.html_crawler import HtmlCrawler
from basango.services.crawler.wordpress_crawler import WordpressCrawler

app = typer.Typer(no_args_is_help=True, add_completion=False)


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
) -> None:
    """Crawl a single source based on CLI-provided settings."""
    manager = ConfigManager()

    pipeline = manager.get(env)
    manager.ensure_directories(pipeline)
    manager.setup_logging(pipeline)

    source = pipeline.sources.find(source_id)
    assert source is not None, f"Source '{source_id}' not found in config"

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

    for crawler in crawlers:
        if crawler.supports() == source.source_kind:
            crawler = crawler(crawler_config, pipeline.fetch.client)
            crawler.fetch()
            break
