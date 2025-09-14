import logging
from abc import ABC, abstractmethod
from typing import Optional

from bs4 import BeautifulSoup

from basango.core.config import CrawlerConfig, ClientConfig
from basango.domain import DateRange, SourceKind, PageRange
from basango.domain.exception import ArticleOutOfRange
from basango.services import HttpClient


class BaseCrawler(ABC):
    def __init__(
        self, crawler_config: CrawlerConfig, client_config: ClientConfig
    ) -> None:
        self.config = crawler_config
        self.source = crawler_config.source
        self.client = HttpClient(client_config=client_config)

    @abstractmethod
    def fetch(self) -> None:
        pass

    def crawl(self, url: str, page: Optional[int] = None) -> BeautifulSoup:
        if page is not None:
            logging.info(f"> Page {page}")

        response = self.client.get(url).text
        return BeautifulSoup(response, "html.parser")

    @abstractmethod
    def fetch_one(self, html: str, date_range: Optional[DateRange] = None) -> None:
        pass

    @abstractmethod
    def get_pagination(self) -> PageRange:
        pass

    def get_last_page(self) -> int:
        return 1

    @abstractmethod
    def supports(self, source_kind: SourceKind) -> bool:
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
