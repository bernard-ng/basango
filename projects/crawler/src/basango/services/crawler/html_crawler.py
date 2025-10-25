import logging
import re
from datetime import datetime, timezone
from typing import Optional, cast, override, Sequence
from urllib.parse import parse_qs, urljoin, urlparse

from basango.domain.article import Article
from bs4 import BeautifulSoup, Tag
from markdownify import markdownify

from basango.core.config import CrawlerConfig, ClientConfig
from basango.core.config.source_config import HtmlSourceConfig
from basango.domain import DateRange, PageRange, SourceKind
from basango.domain.exception import ArticleOutOfRange
from basango.services.crawler.base_crawler import BaseCrawler
from basango.services import BasePersistor


class HtmlCrawler(BaseCrawler):
    """
    Generic HTML crawler driven by CSS selectors.

    Strategy
    - Listing pages are iterated to extract per-article links or blocks.
    - When `requires_details` is set, a second request fetches the article page
      to extract full content; otherwise the article block is parsed inline.
    - Pagination is inferred from a template and last-page discovery heuristics
      (regex or query string `page` fallback).
    """

    def __init__(
        self,
        crawler_config: CrawlerConfig,
        client_config: ClientConfig,
        persistors: Sequence[BasePersistor] | None = None,
    ) -> None:
        super().__init__(crawler_config, client_config, persistors=persistors)
        if not self.source or self.source.source_kind != SourceKind.HTML:
            raise ValueError("HtmlCrawler requires a source of kind HTML")

        self.source = cast(HtmlSourceConfig, self.source)
        self._current_article_url: Optional[str] = None

    @override
    def fetch(self) -> None:
        self.initialize()
        page_range = self.config.page_range or self.get_pagination()
        date_range = self.config.date_range

        article_selector = self.source.source_selectors.articles
        if not article_selector:
            logging.error(
                "No article selector configured for HTML source %s",
                self.source.source_id,
            )
            return

        stop = False
        for page_number in range(page_range.start, page_range.end + 1):
            page_url = self._build_page_url(page_number)
            try:
                soup = self.crawl(page_url, page_number)
            except Exception as exc:  # noqa: BLE001
                logging.error(
                    "> page %s => %s [failed]",
                    page_number,
                    exc,
                )
                continue

            articles = soup.select(article_selector)
            if not articles:
                logging.info("No articles found on page %s", page_number)
                continue

            for article in articles:
                try:
                    self._current_article_url = self._extract_link(article)
                    target_html = str(article)

                    if self.source.requires_details:
                        if not self._current_article_url:
                            logging.debug(
                                "Skipping article without link for details on page %s",
                                page_number,
                            )
                            continue
                        try:
                            detail_soup = self.crawl(self._current_article_url)
                            target_html = str(detail_soup)
                        except Exception as detail_exc:  # noqa: BLE001
                            logging.error(
                                "Failed to fetch detail page %s: %s",
                                self._current_article_url,
                                detail_exc,
                            )
                            continue

                    self.fetch_one(target_html, date_range)
                except ArticleOutOfRange:
                    # Using an exception to short-circuit nested loops keeps the
                    # happy path tidy (no extra flags at each extraction site).
                    logging.info("No more articles to fetch in this range.")
                    stop = True
                    break
                except Exception as exc:  # noqa: BLE001
                    logging.error(
                        "Failed to process article on %s: %s",
                        page_url,
                        exc,
                    )
                finally:
                    self._current_article_url = None

            if stop:
                break

        self.completed(self.config.notify)

    @override
    def fetch_one(self, html: str, date_range: Optional[DateRange] = None) -> Article:
        soup = BeautifulSoup(html, "html.parser")
        selectors = self.source.source_selectors

        title = self._extract_text(soup, selectors.article_title) or "Untitled"
        link = self._current_article_url or self._extract_link(soup)
        if not link:
            logging.warning("Skipping article '%s' without link", title)
            raise ValueError("Missing article link")

        body = self._extract_body(soup, selectors.article_body)
        categories = self._extract_categories(soup, selectors.article_categories)
        if not categories and self.config.category:
            categories = [self.config.category]

        raw_date = self._extract_text(soup, selectors.article_date)
        timestamp = self._compute_timestamp(raw_date)

        if date_range and not date_range.in_range(timestamp):
            self.skip(date_range, str(timestamp), title, raw_date or "")

        metadata = self.open_graph.consume_html(html)

        return self.save_article(
            title=title,
            link=link,
            body=body,
            categories=categories,
            timestamp=timestamp,
            metadata=metadata,
        )

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

        # Heuristic: last pagination link either contains the page number
        # directly or as a `page` query param. Prefer regex first to support
        # path-style pagination (e.g., /page/4/).
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

    @staticmethod
    @override
    def supports() -> SourceKind:
        return SourceKind.HTML

    def _build_page_url(self, page: int) -> str:
        template = self._apply_category(self.source.pagination_template)
        if "{page}" in template:
            template = template.format(page=page)
        elif page > 0:
            separator = "&" if "?" in template else "?"
            template = f"{template}{separator}page={page}"

        base = str(self.source.source_url)
        if not base.endswith("/"):
            base = f"{base}/"
        return urljoin(base, template.lstrip("/"))

    def _apply_category(self, template: str) -> str:
        if "{category}" in template:
            replacement = self.config.category or ""
            return template.replace("{category}", replacement)
        return template

    def _extract_link(self, node: BeautifulSoup | Tag) -> Optional[str]:
        selector = self.source.source_selectors.article_link
        if not selector:
            return None

        target = node.select_one(selector)
        if not target:
            return None

        # Support a few common attributes for link-like elements (href,
        # data-href, src) to tolerate variations in markup without custom code.
        raw_href = target.get("href") or target.get("data-href") or target.get("src")
        href: Optional[str]
        if isinstance(raw_href, str):
            href = raw_href.strip() or None
        elif isinstance(raw_href, list):
            href = next(
                (
                    item.strip()
                    for item in raw_href
                    if isinstance(item, str) and item.strip()
                ),
                None,
            )
        else:
            href = None
        if not href:
            return None
        return self._to_absolute_url(href)

    def _to_absolute_url(self, href: str) -> str:
        base = str(self.source.source_url)
        if not base.endswith("/"):
            base = f"{base}/"
        return urljoin(base, href)

    @staticmethod
    def _extract_text(
        node: BeautifulSoup | Tag, selector: Optional[str]
    ) -> Optional[str]:
        if not selector:
            return None
        target = node.select_one(selector)
        if not target:
            return None

        if target.name == "img":
            for attr in ("alt", "title"):
                value = target.get(attr)
                if isinstance(value, str):
                    stripped = value.strip()
                    if stripped:
                        return stripped
                elif isinstance(value, list):
                    for item in value:
                        if isinstance(item, str):
                            stripped = item.strip()
                            if stripped:
                                return stripped

        text = target.get_text(" ", strip=True)
        return text or None

    @staticmethod
    def _extract_body(node: BeautifulSoup | Tag, selector: Optional[str]) -> str:
        if selector:
            matches = node.select(selector)
            if matches:
                parts = [
                    markdownify(item.get_text(" ", strip=False), heading_style="ATX")
                    for item in matches
                    if item.get_text(strip=True)
                ]
                if parts:
                    # Join without separators: callers can post-process if
                    # needed, but this preserves maximum fidelity.
                    return "\n".join(parts)
        return markdownify(node.get_text(" ", strip=False), heading_style="ATX")

    @staticmethod
    def _extract_categories(
        node: BeautifulSoup | Tag, selector: Optional[str]
    ) -> list[str]:
        if not selector:
            return []

        values: list[str] = []
        for item in node.select(selector):
            text = item.get_text(" ", strip=True)
            if text:
                lower = text.lower()
                if lower not in values:
                    values.append(lower)
        return values

    def _compute_timestamp(self, raw_date: Optional[str]) -> int:
        if not raw_date:
            return int(datetime.now(timezone.utc).timestamp())

        return self.date_parser.create_timestamp(
            raw_date.strip(),
            fmt=self.source.source_date.format,
            pattern=self.source.source_date.pattern,
            replacement=self.source.source_date.replacement,
        )
