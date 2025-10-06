import json
from dataclasses import dataclass, field
from pathlib import Path
from threading import Lock
from typing import Any, Mapping

from .base_persistor import BasePersistor


@dataclass
class JsonPersistor(BasePersistor):
    data_dir: Path
    source_id: str
    suffix: str = ".jsonl"
    encoding: str = "utf-8"
    _file_path: Path = field(init=False, repr=False)
    _lock: Lock = field(default_factory=Lock, init=False, repr=False)

    def __post_init__(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self._file_path = self.data_dir / f"{self.source_id}{self.suffix}"

    def persist(self, article: Mapping[str, Any]) -> None:
        payload = json.dumps(article, ensure_ascii=False)
        with self._lock:
            with self._file_path.open("a", encoding=self.encoding) as handle:
                handle.write(payload)
                handle.write("\n")
