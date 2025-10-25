import logging
from abc import ABC, abstractmethod
from dataclasses import asdict, is_dataclass
from datetime import datetime
from typing import Optional, Any, Dict, List, Sequence

from basango.domain.article import Article
from bs4 import BeautifulSoup
from pydantic import HttpUrl

from basango.core.config import CrawlerConfig, ClientConfig
from basango.domain import DateRange, SourceKind, PageRange
from basango.domain.exception import ArticleOutOfRange
from basango.services import (
    HttpClient,
    DateParser,
    OpenGraphProvider,
    BasePersistor,
    Tokenizer,
)


class BaseCrawler(ABC):
    """
    Base building blocks shared by concrete crawlers.

    Notable conventions
    - `skip`: raises `ArticleOutOfRange` when an item falls outside the desired
      date range. Callers catch it to stop pagination early.
    - `record_article`: normalises metadata (including dataclasses) before
      handing off to persistors.
    """

    def __init__(
        self,
        crawler_config: CrawlerConfig,
        client_config: ClientConfig,
        persistors: Sequence[BasePersistor] | None = None,
    ) -> None:
        self.config = crawler_config
        self.source = crawler_config.source
        self.client = HttpClient(client_config=client_config)
        self.persistors: list[BasePersistor] = list(persistors) if persistors else []
        self.date_parser = DateParser()
        self.open_graph = OpenGraphProvider()
        self.tokenizer = Tokenizer()

    @abstractmethod
    def fetch(self) -> None:
        pass

    def crawl(self, url: str, page: Optional[int] = None) -> BeautifulSoup:
        if page is not None:
            logging.info(f"> Page {page}")

        response = self.client.get(url).text
        return BeautifulSoup(response, "html.parser")

    def save_article(
        self,
        *,
        title: str,
        link: str,
        body: str,
        categories: List[str],
        timestamp: int,
        metadata: Any = None,
    ) -> Article:
        if metadata is None:
            metadata_value = None
        elif is_dataclass(metadata) and not isinstance(metadata, type):
            metadata_value = asdict(metadata)
        elif isinstance(metadata, dict):
            metadata_value = metadata
        else:
            metadata_value = None

        # Get source_id and ensure it's a string
        source_id = getattr(self.source, "source_id", None)
        if source_id is None:
            source_id = "unknown"

        article = Article(
            title=title,
            link=HttpUrl(link),  # Convert str to HttpUrl
            body=body,
            categories=categories,
            source=source_id,  # Ensure it's a string, not None
            timestamp=datetime.fromtimestamp(
                timestamp
            ),  # Convert int timestamp to datetime
            metadata=metadata_value,
        )
        article.token_statistics = self.tokenizer.count_tokens(
            article.title, article.body, article.categories
        )

        self._persist(article.to_dict())
        logging.info("> %s [saved]", article.title)

        return article

    @abstractmethod
    def fetch_one(
        self, html: str, date_range: Optional[DateRange] = None
    ) -> Article | None:
        pass

    @abstractmethod
    def get_pagination(self) -> PageRange:
        pass

    def get_last_page(self) -> int:
        return 1

    @staticmethod
    @abstractmethod
    def supports() -> SourceKind:
        pass

    @classmethod
    def initialize(cls) -> None:
        logging.info("Initializing Crawler")

    def completed(self, notify: bool = False) -> None:
        logging.info("Crawling completed")
        if notify:
            logging.info("Sending notification about completion")
            # TODO: Implement notification logic here
        self._shutdown_persistors()

    @classmethod
    def skip(cls, date_range: DateRange, timestamp: str, title: str, date: str) -> None:
        if date_range.out_range(int(timestamp)):
            # Use an exception to unwind to the crawl loop and stop as soon as
            # we detect items beyond the configured range.
            raise ArticleOutOfRange.create(timestamp, date_range)

        logging.warning(f"> {title} [Skipped {date}]")

    def _persist(self, article: Dict[str, Any]) -> None:
        for persistor in self.persistors:
            try:
                persistor.persist(article)
            except Exception as exc:  # noqa: BLE001
                logging.exception(
                    "Failed to persist article via %s: %s",
                    persistor.__class__.__name__,
                    exc,
                )

    def _shutdown_persistors(self) -> None:
        for persistor in self.persistors:
            try:
                persistor.close()
            except Exception as exc:  # noqa: BLE001
                logging.exception(
                    "Failed to close persistor %s: %s",
                    persistor.__class__.__name__,
                    exc,
                )
