from dataclasses import dataclass


@dataclass
class TokenStatistics:
    """Counts of tokens for different article sections."""

    title: int
    body: int
    excerpt: int
    categories: int

    def to_dict(self) -> dict[str, int]:
        return {
            "title": self.title,
            "body": self.body,
            "excerpt": self.excerpt,
            "categories": self.categories,
        }
