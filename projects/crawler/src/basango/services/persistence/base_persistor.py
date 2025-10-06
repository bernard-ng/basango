from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Mapping, Any


class BasePersistor(ABC):
    """Abstract interface for article persistence backends."""

    @abstractmethod
    def persist(self, article: Mapping[str, Any]) -> None:
        """Persist a single article payload."""

    def close(self) -> None:  # pragma: no cover - optional override
        """Hook for subclasses that need explicit shutdown."""
        return None
