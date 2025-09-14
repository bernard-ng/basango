import random
import time
from dataclasses import dataclass
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
class HttpClient:
    client_config: ClientConfig
    user_agent_provider: UserAgentProvider | None = None
    default_headers: HttpHeaders = None

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
                try:
                    delay = max(0.0, float(int(retry_after)))
                except ValueError:
                    try:
                        dt = parsedate_to_datetime(retry_after)
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        now = datetime.now(timezone.utc)
                        delay = max(0.0, (dt - now).total_seconds())
                    except Exception:  # noqa: BLE001
                        pass

        if delay == 0.0:
            delay = self._compute_backoff(attempt)

        return delay

    def __post_init__(self) -> None:
        if self.user_agent_provider is not None:
            user_agent = self.user_agent_provider.get()
            self._user_agent = (
                user_agent if user_agent else self.client_config.user_agent
            )
        else:
            provider = UserAgentProvider(
                rotate=self.client_config.rotate,
                fallback=self.client_config.user_agent,
            )
            user_agent = provider.get()
            self._user_agent = (
                user_agent if user_agent else self.client_config.user_agent
            )

        headers = {"User-Agent": self._user_agent}

        if self.default_headers:
            headers.update(self.default_headers)

        self._client = httpx.Client(
            follow_redirects=self.client_config.follow_redirects,
            max_redirects=5,
            verify=self.client_config.verify_ssl,
            timeout=self.client_config.timeout,
            headers=headers,
        )

    # Context manager support -------------------------------------------------
    def __enter__(self) -> "HttpClient":  # noqa: D401
        return self

    def __exit__(self, exc_type, exc, tb) -> None:  # noqa: D401
        self.close()

    def close(self) -> None:
        try:
            self._client.close()
        except Exception:  # noqa: BLE001
            pass

    # Core request with retries ----------------------------------------------
    def _request(
        self,
        method: str,
        url: str,
        *,
        headers: HttpHeaders = None,
        params: HttpParams = None,
        data: Any | None = None,
        json: Any | None = None,
    ) -> httpx.Response:
        attempt = 0
        while True:
            try:
                response = self._client.request(
                    method, url, headers=headers, params=params, data=data, json=json
                )
                if (
                    response.status_code in TRANSIENT_STATUSES
                ) and attempt < self.client_config.max_retries:
                    time.sleep(self._retry_delay(attempt, response))
                    attempt += 1
                    continue
                response.raise_for_status()
                return response
            except httpx.HTTPStatusError as e:
                status = e.response.status_code if e.response else 0
                if (
                    status in TRANSIENT_STATUSES
                ) and attempt < self.client_config.max_retries:
                    time.sleep(self._retry_delay(attempt, e.response))
                    attempt += 1
                    continue
                raise
            except httpx.RequestError:
                if attempt < self.client_config.max_retries:
                    time.sleep(self._compute_backoff(attempt))
                    attempt += 1
                    continue
                raise

    # Public helpers ----------------------------------------------------------
    def get(self, url: str) -> httpx.Response:
        return self._request("GET", url)

    def post(
        self, url: str, data: HttpData = None, json: HttpData = None
    ) -> httpx.Response:
        return self._request("POST", url, data=data, json=json)
