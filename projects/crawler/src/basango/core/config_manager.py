import logging
from pathlib import Path
from typing import Optional, Union, Dict

import yaml

from basango.core.config import PipelineConfig
from basango.core.project_paths import ProjectPaths


class ConfigManager:
    def __init__(self, config_path: Optional[Union[str, Path]] = None):
        self.config_path = Path(config_path) if config_path else self._find_config()
        self._config: Optional[PipelineConfig] = None
        self._setup_paths()

    def get(self, env: Optional[str] = None) -> PipelineConfig:
        if env:
            path = self.config_path.parent / f"pipeline.{env}.yaml"

            if path.exists():
                base = self.load().model_dump()
                self._override(base, self.load(path).model_dump())
                return PipelineConfig(**base)

        if self._config is None:
            self._config = self.load()
        return self._config

    def load(self, config_path: Optional[Path] = None) -> PipelineConfig:
        """Load configuration from file"""
        self.config_path = config_path if config_path else self._find_config()

        if not self.config_path.exists():
            logging.warning(
                f"Config file not found: {self.config_path}. Using defaults."
            )
            return self._create_default()

        try:
            with open(self.config_path, "r") as f:
                config_data = yaml.safe_load(f)

            if "paths" not in config_data:
                config_data["paths"] = self.default_paths.model_dump()

            self._config = PipelineConfig(**config_data)
            return self._config

        except Exception as e:
            logging.error(f"Failed to load config from {self.config_path}: {e}")
            return self._create_default()

    @classmethod
    def ensure_directories(cls, cfg: PipelineConfig) -> None:
        directories = [cfg.paths.data, cfg.paths.logs, cfg.paths.configs]

        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)

        logging.info("Ensured all required directories exist")

    @classmethod
    def setup_logging(cls, cfg: PipelineConfig):
        logs_path = cfg.paths.logs
        logs_path.mkdir(parents=True, exist_ok=True)

        # Setup logging configuration
        log_level = getattr(logging, cfg.logging.level.upper(), logging.INFO)

        # Create formatter
        formatter = logging.Formatter(cfg.logging.format)

        # Setup root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(log_level)

        # Clear existing handlers
        root_logger.handlers.clear()

        # Console handler
        if cfg.logging.console_logging:
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            root_logger.addHandler(console_handler)

        # File handler
        if cfg.logging.file_logging:
            from logging.handlers import RotatingFileHandler

            log_file_path = logs_path / cfg.logging.log_file
            file_handler = RotatingFileHandler(
                log_file_path,
                maxBytes=cfg.logging.max_log_size,
                backupCount=cfg.logging.backup_count,
            )
            file_handler.setFormatter(formatter)
            root_logger.addHandler(file_handler)

    @classmethod
    def _find_config(cls) -> Path:
        possible_paths = [
            Path.cwd() / "config" / "pipeline.yaml",
            Path.cwd() / "config" / "pipeline.yml",
            Path.cwd() / "pipeline.yaml",
            Path(__file__).parent.parent.parent.parent / "config" / "pipeline.yaml",
        ]

        for path in possible_paths:
            if path.exists():
                return path

        raise FileNotFoundError(
            "No configuration file found in the expected locations."
        )

    def _setup_paths(self) -> None:
        root = Path(__file__).parent.parent.parent.parent
        self.default_paths = ProjectPaths(
            root=root,
            configs=root / "config",
            data=root / "data" / "dataset",
            logs=root / "data" / "logs",
        )

    def _create_default(self) -> PipelineConfig:
        return PipelineConfig(paths=self.default_paths)

    def _override(self, base: Dict, update: Dict):
        for key, value in update.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._override(base[key], value)
            else:
                base[key] = value
