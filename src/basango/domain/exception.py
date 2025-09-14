from basango.domain import DateRange


class ArticleNotFoundError(Exception):
    pass


class ArticleOutOfRange(Exception):
    def __init__(self, timestamp: str, date_range: DateRange):
        self.timestamp = timestamp
        self.date_range = date_range
        super().__init__(
            f"Article with timestamp {timestamp} is out of range {date_range}"
        )

    @classmethod
    def create(cls, timestamp: str, date_range: DateRange) -> "ArticleOutOfRange":
        return cls(timestamp, date_range)
