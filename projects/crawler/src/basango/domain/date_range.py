from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Optional


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


@dataclass(frozen=True)
class DateRange:
    start: int  # Unix timestamp
    end: int  # Unix timestamp

    def __post_init__(self) -> None:
        assert self.start != 0, "[DateRange] Start timestamp cannot be 0"
        assert self.end != 0, "[DateRange] End timestamp cannot be 0"
        assert self.end >= self.start, (
            "[DateRange] End must be greater than or equal to start"
        )

    def __str__(self) -> str:
        return f"{self.start}:{self.end}"

    def in_range(self, ts: int) -> bool:
        return self.start <= ts <= self.end

    def out_range(self, ts: int) -> bool:
        return ts < self.start or ts > self.end

    def format(self, fmt: str = "%Y-%m-%d") -> str:
        start = datetime.fromtimestamp(self.start, tz=timezone.utc).strftime(fmt)
        end = datetime.fromtimestamp(self.end, tz=timezone.utc).strftime(fmt)
        return f"{start}:{end}"

    @classmethod
    def create(
        cls, spec: str, fmt: str = "%Y-%m-%d", separator: str = ":"
    ) -> "DateRange":
        assert separator != "", "[DateRange] Separator cannot be empty"
        assert separator in spec, f"[DateRange] {separator} must be in {spec}"

        parts = spec.split(separator)
        assert len(parts) == 2, f"[DateRange] Invalid date interval: {spec}"

        start = _ensure_utc(datetime.strptime(parts[0], fmt))
        end = _ensure_utc(datetime.strptime(parts[1], fmt))
        return cls(int(start.timestamp()), int(end.timestamp()))

    @classmethod
    def backward(cls, date: Optional[datetime] = None, days: int = 30) -> "DateRange":
        base = _ensure_utc(date or datetime.now(timezone.utc))

        start = base - timedelta(days=days)
        end = base + timedelta(days=1)  # in future to avoid timezone issues
        return cls(int(start.timestamp()), int(end.timestamp()))

    @classmethod
    def forward(cls, date: datetime) -> "DateRange":
        start = _ensure_utc(date)
        end = datetime.now(timezone.utc) + timedelta(days=1)
        return cls(int(start.timestamp()), int(end.timestamp()))
