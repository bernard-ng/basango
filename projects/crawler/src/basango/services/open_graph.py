import logging
from dataclasses import dataclass
from typing import Optional

import trafilatura

from basango.core.config import ClientConfig
from basango.services.http_client import HttpClient
from basango.services.user_agents import UserAgentProvider


@dataclass
class OpenGraphObject:
    title: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    url: Optional[str] = None


class OpenGraphProvider:
    def __init__(
        self, user_agent_provider: UserAgentProvider = UserAgentProvider(rotate=False)
    ) -> None:
        self._user_agent = user_agent_provider.og()
        self._http_client = HttpClient(
            client_config=ClientConfig(),
            default_headers={"User-Agent": self._user_agent},
        )

    def consume_url(self, url: str) -> OpenGraphObject | None:
        try:
            logging.info(f"[OpenGraphProvider] Consuming url: {url}")
            html = self._http_client.get(url).text
            return self.consume_html(html, url)
        except Exception as e:
            logging.exception(f"[OpenGraphProvider] Failed to consume url: {e}")
            return None

    @classmethod
    def consume_html(
        cls, html: str, url: Optional[str] = None
    ) -> OpenGraphObject | None:
        try:
            meta = trafilatura.extract_metadata(html, default_url=url)
            if not meta:
                return None
            return OpenGraphObject(
                title=meta.title or None,
                description=meta.description or None,
                image=meta.image or None,
                url=url,
            )
        except Exception as e:
            logging.error(f"[OpenGraphProvider] Failed to extract metadata: {e}")
            return None
