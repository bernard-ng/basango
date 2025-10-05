import logging
import re
from datetime import datetime, timezone
from typing import Optional


class DateParser:
    MONTHS = {
        "janvier": "01",
        "février": "02",
        "mars": "03",
        "avril": "04",
        "mai": "05",
        "juin": "06",
        "juillet": "07",
        "août": "08",
        "septembre": "09",
        "octobre": "10",
        "novembre": "11",
        "décembre": "12",
    }

    DAYS = {
        "dimanche": "0",
        "lundi": "1",
        "mardi": "2",
        "mercredi": "3",
        "jeudi": "4",
        "vendredi": "5",
        "samedi": "6",
    }

    DEFAULT_DATE_FORMAT = "%Y-%m-%d %H:%M"

    @classmethod
    def _apply_substitution(
        cls, date: str, pattern: Optional[str], replacement: Optional[str]
    ) -> str:
        if not pattern or replacement is None:
            return date

        # Accept PHP-like patterns with leading/trailing slashes
        if len(pattern) >= 2 and pattern[0] == "/" and pattern.rfind("/") > 0:
            pattern = pattern[1 : pattern.rfind("/")]

        # Convert $1 to \1 for Python
        replacement = re.sub(r"\$(\d+)", r"\\\1", replacement)
        try:
            return re.sub(pattern, replacement, date)
        except re.error:
            logging.error(f"[DateParser] Could not convert {pattern} to {replacement}")
            return date

    def create_timestamp(
        self,
        date: str,
        fmt: Optional[str] = None,
        pattern: Optional[str] = None,
        replacement: Optional[str] = None,
    ) -> int:
        # Normalize and translate French day/month words
        date = date.lower()
        for k, v in self.DAYS.items():
            date = date.replace(k, v)
        for k, v in self.MONTHS.items():
            date = date.replace(k, v)

        # Optional regex transform
        date = self._apply_substitution(date, pattern, replacement)
        fmt = fmt or self.DEFAULT_DATE_FORMAT

        try:
            dt = datetime.strptime(date, fmt).replace(tzinfo=timezone.utc)
            return int(dt.timestamp())
        except Exception as e:
            logging.error(
                f"[DateParser] Could not parse date '{date}' with format '{fmt}': {e}"
            )
            dt = datetime.now(timezone.utc).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            return int(dt.timestamp())
