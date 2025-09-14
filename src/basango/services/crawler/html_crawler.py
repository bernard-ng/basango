import re
from typing import Optional, cast
from urllib.parse import urlparse, parse_qs

from basango.domain import PageRange, SourceKind, DateRange
from basango.core.config.source_config import HtmlSourceConfig
from basango.services.crawler.base_crawler import BaseCrawler


class HtmlCrawler(BaseCrawler):
    def fetch(self) -> None:
        self.initialize()
        page = self.config.page_range or self.get_pagination()

        print(page)

    def fetch_one(self, html: str, date_range: Optional[DateRange] = None) -> None:
        pass

    def get_pagination(self) -> PageRange:
        return PageRange.create(f"0:{self.get_last_page()}")

    def get_last_page(self) -> int:
        if not self.source:
            return 1

        # Type cast to ensure we have the right source type
        html_source = cast(HtmlSourceConfig, self.source)

        if html_source.supports_categories and self.config.category:
            path = html_source.pagination_template.replace(
                "{category}", self.config.category
            )
        else:
            path = html_source.pagination_template

        links = self.crawl(f"{html_source.source_url}{path}").select(
            html_source.source_selectors.pagination
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

    def supports(self, source_kind: SourceKind) -> bool:
        return source_kind == SourceKind.HTML
