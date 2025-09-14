from dataclasses import dataclass


@dataclass(frozen=True)
class PageRange:
    start: int
    end: int

    @staticmethod
    def create(spec: str) -> "PageRange":
        parts = spec.split(":")
        assert len(parts) == 2, f"[PageRange] Invalid page range: {spec}"

        start, end = int(parts[0]), int(parts[1])
        assert start >= 0, f"[PageRange] Invalid page range: {spec}"
        assert end >= start, f"[PageRange] Invalid page range: {spec}"
        return PageRange(start=start, end=end)

    def __str__(self):
        return f"{self.start}:{self.end}"
