import random
from dataclasses import dataclass


@dataclass
class UserAgentProvider:
    USER_AGENTS = [
        "Mozilla/5.0 (iPhone; CPU iPhone OS 10_4_8; like Mac OS X) AppleWebKit/603.39 (KHTML, like Gecko) Chrome/52.0.3638.271 Mobile Safari/537.5",
        "Mozilla/5.0 (Linux; U; Linux x86_64; en-US) Gecko/20130401 Firefox/52.7",
        "Mozilla/5.0 (Linux; U; Android 5.0; SM-P815 Build/LRX22G) AppleWebKit/600.4 (KHTML, like Gecko) Chrome/48.0.1562.260 Mobile Safari/600.0",
        "Mozilla/5.0 (Windows; U; Windows NT 6.3;) AppleWebKit/533.34 (KHTML, like Gecko) Chrome/51.0.1883.215 Safari/533",
        "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.3; x64; en-US Trident/4.0)",
        "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_10_3) Gecko/20100101 Firefox/63.4",
        "Mozilla/5.0 (Linux; Linux x86_64; en-US) AppleWebKit/603.50 (KHTML, like Gecko) Chrome/55.0.2226.116 Safari/601",
        "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 7_8_3; en-US) Gecko/20100101 Firefox/68.9",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 8_9_8; like Mac OS X) AppleWebKit/603.34 (KHTML, like Gecko) Chrome/47.0.1126.107 Mobile Safari/602.7",
        "Mozilla/5.0 (iPod; CPU iPod OS 8_2_0; like Mac OS X) AppleWebKit/601.40 (KHTML, like Gecko) Chrome/47.0.1590.178 Mobile Safari/535.2",
    ]

    rotate: bool = True
    fallback: str = "Basango/0.1 (+https://github.com/bernard-ng/basango)"

    def get(self) -> str:
        return random.choice(self.USER_AGENTS) if self.rotate else self.fallback

    @classmethod
    def og(cls) -> str:
        return "facebookexternalhit/1.1"
