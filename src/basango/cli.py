import typer

from basango.core.config import CrawlerConfig
from basango.core.config_manager import ConfigManager
from basango.domain import PageRange, DateRange, UpdateDirection

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
    crawler_config = CrawlerConfig(
        source=source,
        page_range=PageRange.create(page) if page else None,
        date_range=DateRange.create(date) if date else None,
        category=category,
        notify=notify,
        direction=UpdateDirection.FORWARD,
    )

    # use the crawler runner to start crawling with this config
    print(crawler_config)
    pass
