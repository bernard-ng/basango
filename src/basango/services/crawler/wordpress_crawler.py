import logging
from typing import Optional, override, cast, Final

from basango.core.config import WordPressSourceConfig, CrawlerConfig, ClientConfig
from basango.domain import SourceKind, PageRange, DateRange
from basango.services.crawler.base_crawler import BaseCrawler


class WordpressCrawler(BaseCrawler):
    def __init__(
        self, crawler_config: CrawlerConfig, client_config: ClientConfig
    ) -> None:
        super().__init__(crawler_config, client_config)
        if not self.source or self.source.source_kind != SourceKind.WORDPRESS:
            raise ValueError("WordpressCrawler requires a source of kind WORDPRESS")

        self.source = cast(WordPressSourceConfig, self.source)

    POST_QUERY: Final = "_fields=date,slug,link,title.rendered,content.rendered,categories&orderby=date&order=desc"
    CATEGORY_QUERY: Final = (
        "_fields=id,slug,count&orderby=count&order=desc&per_page=100"
    )
    TOTAL_PAGES_HEADER: Final = "x-wp-totalpages"
    TOTAL_POSTS_HEADER: Final = "x-wp-total"

    category_map: dict[int, str] = {}

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
        response = self.client.get(
            f"{self.source.source_url}wp-json/wp/v2/posts?_fields=id&per_page=100"
        )
        pages = int(response.headers.get(self.TOTAL_PAGES_HEADER, "1"))
        posts = int(response.headers.get(self.TOTAL_POSTS_HEADER, "0"))

        logging.info(f"WordPress Pagination {posts} posts in {pages} pages")
        return PageRange.create(f"1:{pages}")

    def _fetch_categories(self) -> None:
        response = self.client.get(
            f"{self.source.source_url}wp-json/wp/v2/categories?{self.CATEGORY_QUERY}"
        )
        for category in response.json():
            self.category_map[int(category["id"])] = category["slug"]

    def _map_categories(self, categories: list[int]) -> str:
        if not self.category_map:
            self._fetch_categories()
        return ",".join(
            self.category_map[category]
            for category in sorted(categories)
            if category in self.category_map
        )

    @override
    def get_last_page(self) -> int:
        return 1

    @override
    def supports(self, source_kind: SourceKind) -> bool:
        return source_kind == SourceKind.WORDPRESS
