from pydantic import BaseModel


class LoggingConfig(BaseModel):
    level: str = "INFO"
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    file_logging: bool = True
    console_logging: bool = True
    log_file: str = "pipeline.log"
    max_log_size: int = 10 * 1024 * 1024  # 10MB
    backup_count: int = 5
