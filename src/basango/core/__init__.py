import logging
from pathlib import Path

from basango.core.config import PipelineConfig


def ensure_directories(cfg: PipelineConfig) -> None:
    directories = [cfg.paths.data, cfg.paths.logs, cfg.paths.configs]

    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)

    logging.info("Ensured all required directories exist")


def setup_logging(cfg: PipelineConfig):
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
