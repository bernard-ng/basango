from __future__ import annotations

import asyncio
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
class AsyncHttpClient(BaseHttpClient):
    _client: httpx.AsyncClient = field(init=False, repr=False)

    def __post_init__(self) -> None:
        super().__post_init__()
        self._client = httpx.AsyncClient(
            follow_redirects=self.client_config.follow_redirects,
            max_redirects=5,
            verify=self.client_config.verify_ssl,
            timeout=self.client_config.timeout,
            headers=dict(self._headers),
        )

    async def __aenter__(self) -> "AsyncHttpClient":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        await self.aclose()

    def close(self) -> None:
        if self._client.is_closed:
            return
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:  # no running loop
            asyncio.run(self.aclose())
        else:
            loop.create_task(self.aclose())

    async def aclose(self) -> None:
        try:
            await self._client.aclose()
        except Exception:  # noqa: BLE001
            pass

    async def _request(
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
                response = await self._client.request(
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
                    await asyncio.sleep(self._retry_delay(attempt, response))
                    attempt += 1
                    continue
                response.raise_for_status()
                return response
            except httpx.HTTPStatusError as exc:
                status = exc.response.status_code if exc.response else 0
                if (
                    status in TRANSIENT_STATUSES
                ) and attempt < self.client_config.max_retries:
                    await asyncio.sleep(self._retry_delay(attempt, exc.response))
                    attempt += 1
                    continue
                raise
            except httpx.RequestError:
                if attempt < self.client_config.max_retries:
                    await asyncio.sleep(self._compute_backoff(attempt))
                    attempt += 1
                    continue
                raise

    async def get(
        self,
        url: str,
        *,
        headers: HttpHeaders = None,
        params: HttpParams = None,
    ) -> httpx.Response:
        return await self._request("GET", url, headers=headers, params=params)

    async def post(
        self,
        url: str,
        *,
        headers: HttpHeaders = None,
        params: HttpParams = None,
        data: HttpData = None,
        json: HttpData = None,
    ) -> httpx.Response:
        return await self._request(
            "POST",
            url,
            headers=headers,
            params=params,
            data=data,
            json=json,
        )
