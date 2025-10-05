from typing import Optional, Union

from pydantic import BaseModel, Field

from basango.domain import PageRange, DateRange, UpdateDirection
from basango.core.config.source_config import HtmlSourceConfig, WordPressSourceConfig


class ClientConfig(BaseModel):
    timeout: float = Field(default=20.0, description="Request timeout in seconds")
    user_agent: str = Field(
        default="Basango/0.1 (+https://github.com/bernard-ng/basango)"
    )
    follow_redirects: bool = Field(default=True, description="Follow HTTP redirects")
    verify_ssl: bool = Field(default=True, description="Verify SSL certificates")
    rotate: bool = Field(default=True, description="Rotate User-Agent header")
    max_retries: int = Field(
        default=3, description="Maximum number of retries on failure"
    )
    backoff_initial: float = Field(
        default=1.0, description="Initial backoff delay in seconds"
    )
    backoff_multiplier: float = Field(default=2.0, description="Backoff multiplier")
    backoff_max: float = Field(
        default=30.0, description="Maximum backoff delay in seconds"
    )
    respect_retry_after: bool = Field(
        default=True, description="Respect Retry-After header if present"
    )


class CrawlerConfig(BaseModel):
    source: Optional[Union[HtmlSourceConfig, WordPressSourceConfig]] = Field(
        default=None, description="Source configuration to crawl"
    )
    page_range: Optional[PageRange] = Field(
        default=None, description="Page range to crawl, e.g: 1:10"
    )
    date_range: Optional[DateRange] = Field(
        default=None,
        description="Date range to filter articles, e.g: 2024-10-01:2024-10-31",
    )
    category: Optional[str] = Field(
        default=None, description="Optional category to filter articles"
    )
    notify: bool = Field(
        default=False, description="Enable notifications after crawling"
    )

    is_update: bool = Field(
        default=False,
        description="Whether this crawl is an update (True) or a full crawl (False)",
    )
    use_multi_threading: bool = Field(
        default=False, description="Enable multiprocessing for concurrent crawling"
    )
    max_workers: int = Field(
        default=5, description="Maximum number of concurrent crawling workers"
    )
    direction: UpdateDirection = Field(
        default=UpdateDirection.FORWARD, description="Crawling direction"
    )


class FetchConfig(BaseModel):
    client: ClientConfig = Field(
        default_factory=ClientConfig, description="Http client configuration"
    )
    crawler: CrawlerConfig = Field(
        default_factory=CrawlerConfig, description="Crawler configuration"
    )
