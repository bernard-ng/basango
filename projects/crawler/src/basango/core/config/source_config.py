from typing import Union

from pydantic import BaseModel, Field, HttpUrl

from basango.domain import SourceDate, SourceKind, SourceSelectors


class SourceConfigBase(BaseModel):
    source_id: str = Field(..., description="Unique identifier for the source")
    source_url: HttpUrl = Field(..., description="URL of the source")
    source_date: SourceDate = Field(
        default_factory=SourceDate, description="Date extraction schema"
    )
    source_kind: SourceKind = Field(
        ..., description="Type of the source, e.g., 'wordpress' or 'html'"
    )
    categories: list[str] = Field(
        default_factory=list, description="List of categories to filter articles"
    )

    supports_categories: bool = Field(
        default=False, description="the source supports categories"
    )
    requires_details: bool = Field(
        default=False, description="detailed article is required to compute date range"
    )
    requires_rate_limit: bool = Field(
        default=False, description="requires rate limit to avoid being blocked"
    )


class WordPressSourceConfig(SourceConfigBase):
    source_kind: SourceKind = Field(
        default=SourceKind.WORDPRESS, description="Type of the source"
    )
    source_date: SourceDate = SourceDate(
        format="%Y-%m-%dT%H:%M:%S", pattern=None, replacement=None
    )


class HtmlSourceConfig(SourceConfigBase):
    source_kind: SourceKind = Field(
        default=SourceKind.HTML, description="Type of the source"
    )
    source_selectors: SourceSelectors = Field(
        default_factory=lambda: SourceSelectors(),
        description="CSS selectors for extracting articles",
    )
    pagination_template: str = Field(
        ..., description="Template URL for pagination, e.g., '/actualite?page={page}'"
    )


class SourcesConfig(BaseModel):
    html: list[HtmlSourceConfig] = Field(
        default_factory=list, description="List of source configurations"
    )
    wordpress: list[WordPressSourceConfig] = Field(
        default_factory=list, description="List of source configurations"
    )

    def find(self, source_id: str) -> Union[HtmlSourceConfig, WordPressSourceConfig]:
        for source in self.html + self.wordpress:
            if source.source_id == source_id:
                return source
        raise ValueError(f"Source with id '{source_id}' not found")
