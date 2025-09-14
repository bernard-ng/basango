from typing import Optional

from basango.domain import SourceKind, PageRange, DateRange
from basango.services.crawler.base_crawler import BaseCrawler


class WordpressCrawler(BaseCrawler):
    def fetch(self) -> None:
        pass

    def fetch_one(self, html: str, date_range: Optional[DateRange] = None) -> None:
        pass

    def get_pagination(self) -> PageRange:
        return PageRange.create("1:1")

    def get_last_page(self) -> int:
        return 1

    def supports(self, source_kind: SourceKind) -> bool:
        return source_kind == SourceKind.WORDPRESS
