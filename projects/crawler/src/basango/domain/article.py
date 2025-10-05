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
