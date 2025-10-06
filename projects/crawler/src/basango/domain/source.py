from enum import StrEnum
from typing import Optional

from pydantic import BaseModel, Field


class SourceKind(StrEnum):
    WORDPRESS = "wordpress"
    HTML = "html"


class SourceDate(BaseModel):
    format: str = "%Y-%m-%d %H:%M"
    pattern: Optional[str] = None
    replacement: Optional[str] = None


class SourceSelectors(BaseModel):
    articles: Optional[str] = Field(
        default=None, description="CSS selector for the list of articles within a page"
    )
    article_title: Optional[str] = Field(
        default=None, description="CSS selector for the article title"
    )
    article_link: Optional[str] = Field(
        default=None, description="CSS selector for the article link"
    )
    article_body: Optional[str] = Field(
        default=None, description="CSS selector for the article body/content"
    )
    article_date: Optional[str] = Field(
        default=None, description="CSS selector for the article date"
    )
    article_categories: Optional[str] = Field(
        default=None, description="CSS selector for the article categories"
    )

    pagination: str = Field(
        default="ul.pagination > li a",
        description="CSS selector for the pagination links",
    )
