import random
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any, Optional, TypeAlias

import httpx

from basango.core.config import ClientConfig
from basango.services.user_agents import UserAgentProvider

HttpHeaders: TypeAlias = dict[str, str] | None
HttpParams: TypeAlias = dict[str, Any] | None
HttpData: TypeAlias = Any | None

TRANSIENT_STATUSES = (429, 500, 502, 503, 504)


@dataclass
class BaseHttpClient(ABC):
    client_config: ClientConfig
    user_agent_provider: UserAgentProvider | None = None
    default_headers: HttpHeaders = None
    _user_agent: str = field(init=False, repr=False)
    _headers: dict[str, str] = field(init=False, repr=False)

    def __post_init__(self) -> None:
        provider = self.user_agent_provider or UserAgentProvider(
            rotate=self.client_config.rotate,
            fallback=self.client_config.user_agent,
        )
        user_agent = provider.get()
        self._user_agent = user_agent if user_agent else self.client_config.user_agent

        headers = {"User-Agent": self._user_agent}
        if self.default_headers:
            headers.update(self.default_headers)
        self._headers = headers

    def _compute_backoff(self, attempt: int) -> float:
        base = min(
            self.client_config.backoff_initial
            * (self.client_config.backoff_multiplier**attempt),
            self.client_config.backoff_max,
        )
        jitter = random.uniform(0, base * 0.25)
        return base + jitter

    def _retry_delay(
        self, attempt: int, response: Optional[httpx.Response] = None
    ) -> float:
        delay = 0.0
        if response is not None and self.client_config.respect_retry_after:
            retry_after = (
                response.headers.get("Retry-After") if response.headers else None
            )
            if retry_after:
                delay = self._parse_retry_after(retry_after)

        if delay == 0.0:
            delay = self._compute_backoff(attempt)
        return delay

    @staticmethod
    def _parse_retry_after(header_value: str) -> float:
        try:
            return max(0.0, float(int(header_value)))
        except (TypeError, ValueError):
            try:
                dt = parsedate_to_datetime(header_value)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                now = datetime.now(timezone.utc)
                return max(0.0, (dt - now).total_seconds())
            except Exception:  # noqa: BLE001
                return 0.0

    def _build_headers(self, headers: HttpHeaders = None) -> dict[str, str]:
        merged = dict(self._headers)
        if headers:
            merged.update(headers)
        return merged

    @abstractmethod
    def close(self) -> None:  # pragma: no cover - enforced by subclasses
        """Close the underlying HTTPX client."""
