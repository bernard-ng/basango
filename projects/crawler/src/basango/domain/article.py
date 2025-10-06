from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, HttpUrl


class Article(BaseModel):
    title: str
    link: HttpUrl
    body: str
    categories: list[str]
    source: str
    timestamp: datetime
    metadata: Optional[dict[str, Any]] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "link": str(self.link),
            "body": self.body,
            "categories": self.categories,
            "source": self.source,
            "timestamp": int(self.timestamp.timestamp()),
            "metadata": self.metadata,
        }
