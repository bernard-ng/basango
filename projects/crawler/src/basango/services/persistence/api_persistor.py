import logging
from dataclasses import dataclass
from typing import Any, Mapping

from basango.core.config import ClientConfig
from basango.services.http_client import SyncHttpClient

from .base_persistor import BasePersistor


@dataclass
class ApiPersistor(BasePersistor):
    endpoint: str
    client_config: ClientConfig
    raise_for_status: bool = True

    def __post_init__(self) -> None:
        self.client = SyncHttpClient(client_config=self.client_config)

    def persist(self, article: Mapping[str, Any]) -> None:
        """POST the article payload to an HTTP endpoint.

        By default `raise_for_status` is enabled so worker failures surface
        quickly. Disable when using a fire-and-forget pipeline and rely on
        logs/monitoring instead.
        """
        try:
            response = self.client.post(self.endpoint, json=article)
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
