"""
Lightweight task payload schemas.

Notes
- Use dataclasses with `slots=True` for low overhead and predictable fields.
- `_coerce_kwargs` filters unknown keys so payloads are resilient to schema
  changes when workers and producers are not updated in lockstep.
"""

from dataclasses import asdict, dataclass, fields
from typing import Any, Mapping


def _coerce_kwargs(cls, data: Mapping[str, Any]) -> dict[str, Any]:
    return {field.name: data.get(field.name) for field in fields(cls)}


@dataclass(slots=True)
class ListingTaskPayload:
    source_id: str
    env: str = "development"
    page_range: str | None = None
    date_range: str | None = None
    category: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "ListingTaskPayload":
        return cls(**_coerce_kwargs(cls, data))


@dataclass(slots=True)
class ArticleTaskPayload:
    source_id: str
    env: str = "development"
    url: str | None = None
    data: Any | None = None
    date_range: str | None = None
    category: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "ArticleTaskPayload":
        return cls(**_coerce_kwargs(cls, data))


@dataclass(slots=True)
class ProcessedTaskPayload:
    source_id: str
    env: str = "development"
    article: Mapping[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "ProcessedTaskPayload":
        return cls(**_coerce_kwargs(cls, data))
