from pathlib import Path
from pydantic import Field, BaseModel

from basango.core.config.fetch_config import FetchConfig
from basango.core.config.logging_config import LoggingConfig
from basango.core.config.source_config import SourcesConfig
from basango.core.project_paths import ProjectPaths


def _default_project_paths() -> ProjectPaths:
    """Create default project paths relative to the project root."""
    root = Path.cwd()
    return ProjectPaths(
        root=root,
        configs=root / "config",
        data=root / "data" / "dataset",
        logs=root / "data" / "logs",
    )


class PipelineConfig(BaseModel):
    paths: ProjectPaths = Field(default_factory=_default_project_paths, alias="paths")
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    fetch: FetchConfig = Field(default_factory=FetchConfig)
    sources: SourcesConfig = Field(default_factory=SourcesConfig)
