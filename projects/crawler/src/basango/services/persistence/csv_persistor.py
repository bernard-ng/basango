import csv
import json
from dataclasses import dataclass, field
from pathlib import Path
from threading import Lock
from typing import Any, Mapping, Sequence

from .base_persistor import BasePersistor


DEFAULT_FIELDS = (
    "title",
    "link",
    "body",
    "categories",
    "source",
    "timestamp",
    "metadata",
)


@dataclass
class CsvPersistor(BasePersistor):
    data_dir: Path
    source_id: str
    fieldnames: Sequence[str] = DEFAULT_FIELDS
    encoding: str = "utf-8"
    _file_path: Path = field(init=False, repr=False)
    _lock: Lock = field(default_factory=Lock, init=False, repr=False)
    _header_written: bool = field(default=False, init=False, repr=False)

    def __post_init__(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self._file_path = self.data_dir / f"{self.source_id}.csv"
        if self._file_path.exists() and self._file_path.stat().st_size > 0:
            self._header_written = True

    def persist(self, article: Mapping[str, Any]) -> None:
        record = self._serialise(article)
        with self._lock:
            needs_header = not self._header_written or not self._file_path.exists()
            with self._file_path.open(
                "a", newline="", encoding=self.encoding
            ) as handle:
                writer = csv.DictWriter(
                    handle,
                    fieldnames=self.fieldnames,
                    quoting=csv.QUOTE_ALL,
                    lineterminator="\n",
                )
                if needs_header:
                    writer.writeheader()
                    self._header_written = True
                writer.writerow(record)

    def _serialise(self, article: Mapping[str, Any]) -> dict[str, Any]:
        categories = article.get("categories")
        if isinstance(categories, (list, tuple)):
            serialised_categories = ";".join(str(item) for item in categories)
        else:
            serialised_categories = categories

        metadata = article.get("metadata")
        if metadata is None or isinstance(metadata, str):
            serialised_metadata = metadata
        else:
            # JSON-encode metadata to a string that is CSV-safe; csv module will quote it
            serialised_metadata = json.dumps(
                metadata, ensure_ascii=True, separators=(",", ":"), sort_keys=True
            )

        record = {field: article.get(field) for field in self.fieldnames}
        record["categories"] = serialised_categories
        record["metadata"] = serialised_metadata
        return record
