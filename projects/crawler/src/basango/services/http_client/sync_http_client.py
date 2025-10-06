import time
from dataclasses import dataclass, field

import httpx

from .base_http_client import (
    BaseHttpClient,
    HttpData,
    HttpHeaders,
    HttpParams,
    TRANSIENT_STATUSES,
)


@dataclass
class SyncHttpClient(BaseHttpClient):
    _client: httpx.Client = field(init=False, repr=False)

    def __post_init__(self) -> None:
        super().__post_init__()
        self._client = httpx.Client(
            follow_redirects=self.client_config.follow_redirects,
            max_redirects=5,
            verify=self.client_config.verify_ssl,
            timeout=self.client_config.timeout,
            headers=dict(self._headers),
        )

    def __enter__(self) -> "SyncHttpClient":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    def close(self) -> None:
        try:
            self._client.close()
        except Exception:  # noqa: BLE001
            pass

    def _request(
        self,
        method: str,
        url: str,
        *,
        headers: HttpHeaders = None,
        params: HttpParams = None,
        data: HttpData = None,
        json: HttpData = None,
    ) -> httpx.Response:
        attempt = 0
        while True:
            try:
                response = self._client.request(
                    method,
                    url,
                    headers=self._build_headers(headers),
                    params=params,
                    data=data,
                    json=json,
                )
                if (
                    response.status_code in TRANSIENT_STATUSES
                ) and attempt < self.client_config.max_retries:
                    time.sleep(self._retry_delay(attempt, response))
                    attempt += 1
                    continue
                response.raise_for_status()
                return response
            except httpx.HTTPStatusError as exc:
                status = exc.response.status_code if exc.response else 0
                if (
                    status in TRANSIENT_STATUSES
                ) and attempt < self.client_config.max_retries:
                    time.sleep(self._retry_delay(attempt, exc.response))
                    attempt += 1
                    continue
                raise
            except httpx.RequestError:
                if attempt < self.client_config.max_retries:
                    time.sleep(self._compute_backoff(attempt))
                    attempt += 1
                    continue
                raise

    def get(
        self, url: str, *, headers: HttpHeaders = None, params: HttpParams = None
    ) -> httpx.Response:
        return self._request("GET", url, headers=headers, params=params)

    def post(
        self,
        url: str,
        *,
        headers: HttpHeaders = None,
        params: HttpParams = None,
        data: HttpData = None,
        json: HttpData = None,
    ) -> httpx.Response:
        return self._request(
            "POST",
            url,
            headers=headers,
            params=params,
            data=data,
            json=json,
        )
