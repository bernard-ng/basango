from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, HttpUrl
from .token_statistics import TokenStatistics


class Article(BaseModel):
    title: str
    link: HttpUrl
    body: str
    categories: list[str]
    source: str
    timestamp: datetime
    metadata: Optional[dict[str, Any]] = None
    token_statistics: Optional["TokenStatistics"] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "link": str(self.link),
            "body": self.body,
            "categories": self.categories,
            "source": self.source,
            "timestamp": int(self.timestamp.timestamp()),
            "metadata": self.metadata,
            "tokenStatistics": self.token_statistics.to_dict()
            if self.token_statistics
            else "",
        }
