import re
from typing import Optional, cast, override
from urllib.parse import urlparse, parse_qs

from basango.core.config import CrawlerConfig, ClientConfig
from basango.core.config.source_config import HtmlSourceConfig
from basango.domain import PageRange, SourceKind, DateRange
from basango.services.crawler.base_crawler import BaseCrawler


class HtmlCrawler(BaseCrawler):
    def __init__(
        self, crawler_config: CrawlerConfig, client_config: ClientConfig
    ) -> None:
        super().__init__(crawler_config, client_config)
        if not self.source or self.source.source_kind != SourceKind.HTML:
            raise ValueError("HtmlCrawler requires a source of kind HTML")

        self.source = cast(HtmlSourceConfig, self.source)

    @override
    def fetch(self) -> None:
        self.initialize()
        page = self.config.page_range or self.get_pagination()
        print(page)

    @override
    def fetch_one(self, html: str, date_range: Optional[DateRange] = None) -> None:
        pass

    @override
    def get_pagination(self) -> PageRange:
        return PageRange.create(f"0:{self.get_last_page()}")

    @override
    def get_last_page(self) -> int:
        if not self.source:
            return 1

        if self.source.supports_categories and self.config.category:
            path = self.source.pagination_template.replace(
                "{category}", self.config.category
            )
        else:
            path = self.source.pagination_template

        links = self.crawl(f"{self.source.source_url}{path}").select(
            self.source.source_selectors.pagination
        )
        if not links:
            return 1

        href = links[-1].get("href")
        if not href or not isinstance(href, str):
            return 1

        # Extract number from href using regex or url parsing
        match = re.search(r"(\d+)", href)
        if match:
            return int(match.group(1))

        queries = parse_qs(urlparse(href).query)
        if "page" in queries and queries["page"]:
            try:
                return int(queries["page"][0])
            except ValueError:
                return 1
        return 1

    @override
    def supports(self, source_kind: SourceKind) -> bool:
        return source_kind == SourceKind.HTML
