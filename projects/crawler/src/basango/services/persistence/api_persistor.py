from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Mapping

from basango.services.http_client import SyncHttpClient

from .base_persistor import BasePersistor


@dataclass
class ApiPersistor(BasePersistor):
    endpoint: str
    http_client: SyncHttpClient
    headers: dict[str, str] | None = None
    raise_for_status: bool = True

    def persist(self, article: Mapping[str, Any]) -> None:
        try:
            response = self.http_client.post(
                self.endpoint,
                json=article,
                headers=self.headers,
            )
            if self.raise_for_status:
                response.raise_for_status()
        except Exception as exc:  # noqa: BLE001
            logging.exception(
                "[ApiPersistor] Failed to persist article at %s: %s",
                self.endpoint,
                exc,
            )
            if self.raise_for_status:
                raise
