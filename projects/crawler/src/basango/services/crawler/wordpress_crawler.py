import json
import logging
from datetime import datetime, timezone
from typing import Optional, override, cast, Final, Any, Sequence

from bs4 import BeautifulSoup

from basango.core.config import WordPressSourceConfig, CrawlerConfig, ClientConfig
from basango.domain import SourceKind, PageRange, DateRange
from basango.domain.exception import ArticleOutOfRange
from basango.services.crawler.base_crawler import BaseCrawler
from basango.services import BasePersistor


class WordpressCrawler(BaseCrawler):
    def __init__(
        self,
        crawler_config: CrawlerConfig,
        client_config: ClientConfig,
        persistors: Sequence[BasePersistor] | None = None,
    ) -> None:
        super().__init__(crawler_config, client_config, persistors=persistors)
        if not self.source or self.source.source_kind != SourceKind.WORDPRESS:
            raise ValueError("WordpressCrawler requires a source of kind WORDPRESS")

        self.source = cast(WordPressSourceConfig, self.source)
        self.category_map: dict[int, str] = {}

    POST_QUERY: Final = "_fields=date,slug,link,title.rendered,content.rendered,categories&orderby=date&order=desc"
    CATEGORY_QUERY: Final = (
        "_fields=id,slug,count&orderby=count&order=desc&per_page=100"
    )
    TOTAL_PAGES_HEADER: Final = "x-wp-totalpages"
    TOTAL_POSTS_HEADER: Final = "x-wp-total"

    @override
    def fetch(self) -> None:
        self.initialize()
        page_range = self.config.page_range or self.get_pagination()
        date_range = self.config.date_range

        stop = False
        for page_number in range(page_range.start, page_range.end + 1):
            endpoint = self._posts_endpoint(page_number)
            try:
                response = self.client.get(endpoint)
                payload = response.text
                articles = json.loads(payload)
            except Exception as exc:  # noqa: BLE001
                logging.error(
                    "> page %s => %s [failed]",
                    page_number,
                    exc,
                )
                continue

            for article in articles:
                try:
                    self.fetch_one(article, date_range)
                except ArticleOutOfRange:
                    logging.info("No more articles to fetch in this range.")
                    stop = True
                    break
                except Exception as exc:  # noqa: BLE001
                    logging.error(
                        "Failed to process WordPress article on page %s: %s",
                        page_number,
                        exc,
                    )
            if stop:
                break

        self.completed(self.config.notify)

    @override
    def fetch_one(self, html: Any, date_range: Optional[DateRange] = None) -> None:
        try:
            data = json.loads(html) if isinstance(html, str) else html
        except json.JSONDecodeError as exc:
            logging.error("Failed to decode WordPress payload: %s", exc)
            return

        if not isinstance(data, dict):
            logging.error("Skipping unexpected WordPress payload: %s", type(data))
            return

        link = data.get("link")
        if not link:
            logging.error("Skipping WordPress article without link")
            return

        title = BeautifulSoup(
            data.get("title", {}).get("rendered", ""), "html.parser"
        ).get_text(" ", strip=True)
        body = BeautifulSoup(
            data.get("content", {}).get("rendered", ""), "html.parser"
        ).get_text(" ", strip=True)
        timestamp = self._compute_timestamp(data.get("date"))

        categories_value = self._map_categories(data.get("categories", []))
        categories = [item for item in categories_value.split(",") if item]

        if date_range and not date_range.in_range(timestamp):
            self.skip(date_range, str(timestamp), title, data.get("date", ""))

        metadata = self.open_graph.consume_url(link)

        self.record_article(
            title=title or data.get("slug", "Untitled"),
            link=link,
            body=body,
            categories=categories,
            timestamp=timestamp,
            metadata=metadata,
        )

    @override
    def get_pagination(self) -> PageRange:
        response = self.client.get(
            f"{self.source.source_url}wp-json/wp/v2/posts?_fields=id&per_page=100"
        )
        pages = int(response.headers.get(self.TOTAL_PAGES_HEADER, "1"))
        posts = int(response.headers.get(self.TOTAL_POSTS_HEADER, "0"))

        logging.info("WordPress Pagination %s posts in %s pages", posts, pages)
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

    def _posts_endpoint(self, page: int) -> str:
        base = str(self.source.source_url)
        if not base.endswith("/"):
            base = f"{base}/"
        return f"{base}wp-json/wp/v2/posts?{self.POST_QUERY}&page={page}&per_page=100"

    @staticmethod
    def _compute_timestamp(raw: Optional[str]) -> int:
        if not raw:
            return int(datetime.now(timezone.utc).timestamp())

        cleaned = raw.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(cleaned)
        except ValueError:
            return int(datetime.now(timezone.utc).timestamp())

        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return int(dt.timestamp())

    @override
    def get_last_page(self) -> int:
        return 1

    @staticmethod
    @override
    def supports() -> SourceKind:
        return SourceKind.WORDPRESS
