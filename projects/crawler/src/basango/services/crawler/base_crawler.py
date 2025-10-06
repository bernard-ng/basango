import logging
from abc import ABC, abstractmethod
from dataclasses import asdict, is_dataclass
from typing import Optional, Any, Dict, List

from bs4 import BeautifulSoup

from basango.core.config import CrawlerConfig, ClientConfig
from basango.domain import DateRange, SourceKind, PageRange
from basango.domain.exception import ArticleOutOfRange
from basango.services import HttpClient, DateParser, OpenGraphProvider


class BaseCrawler(ABC):
    def __init__(
        self, crawler_config: CrawlerConfig, client_config: ClientConfig
    ) -> None:
        self.config = crawler_config
        self.source = crawler_config.source
        self.client = HttpClient(client_config=client_config)
        self.results: List[Dict[str, Any]] = []
        self.date_parser = DateParser()
        self.open_graph = OpenGraphProvider()

    @abstractmethod
    def fetch(self) -> None:
        pass

    def crawl(self, url: str, page: Optional[int] = None) -> BeautifulSoup:
        if page is not None:
            logging.info(f"> Page {page}")

        response = self.client.get(url).text
        return BeautifulSoup(response, "html.parser")

    def record_article(
        self,
        *,
        title: str,
        link: str,
        body: str,
        categories: List[str],
        timestamp: int,
        metadata: Any = None,
    ) -> None:
        if metadata is None:
            metadata_value = None
        elif is_dataclass(metadata) and not isinstance(metadata, type):
            metadata_value = asdict(metadata)
        else:
            metadata_value = metadata
        article = {
            "title": title,
            "link": link,
            "body": body,
            "categories": categories,
            "source": getattr(self.source, "source_id", None),
            "timestamp": timestamp,
            "metadata": metadata_value,
        }
        self.results.append(article)
        logging.info(f"> {title} [saved]")

    @abstractmethod
    def fetch_one(self, html: str, date_range: Optional[DateRange] = None) -> None:
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
            # Implement notification logic here

    @classmethod
    def skip(cls, date_range: DateRange, timestamp: str, title: str, date: str) -> None:
        if date_range.out_range(int(timestamp)):
            raise ArticleOutOfRange.create(timestamp, date_range)

        logging.warning(f"> {title} [Skipped {date}]")
