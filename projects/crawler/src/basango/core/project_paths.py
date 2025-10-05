from pathlib import Path

from pydantic import BaseModel, field_validator, ConfigDict


class ProjectPaths(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    root: Path
    data: Path
    logs: Path
    configs: Path

    @classmethod
    @field_validator("*", mode="before")
    def convert_to_path(cls, v):
        return Path(v) if not isinstance(v, Path) else v

    def get_data_path(self, filename: str) -> Path:
        return self.data / filename

    def get_logs_path(self, filename: str) -> Path:
        return self.logs / filename

    def get_config_path(self, filename: str) -> Path:
        return self.configs / filename
