from pydantic import Field, BaseModel

from basango.core.config.fetch_config import FetchConfig
from basango.core.config.logging_config import LoggingConfig
from basango.core.config.source_config import SourcesConfig
from basango.core.project_paths import ProjectPaths


class PipelineConfig(BaseModel):
    paths: ProjectPaths = Field(default_factory=ProjectPaths, alias="paths")
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    fetch: FetchConfig = Field(default_factory=FetchConfig)
    sources: SourcesConfig = Field(default_factory=SourcesConfig)
