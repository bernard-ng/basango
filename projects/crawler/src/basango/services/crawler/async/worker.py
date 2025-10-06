import logging
from typing import Sequence

from rq import Queue, Worker, SimpleWorker

from .queue import QueueManager, QueueSettings


logger = logging.getLogger(__name__)


def start_worker(
    queue_names: Sequence[str] | None = None,
    *,
    settings: QueueSettings | None = None,
    burst: bool = False,
    simple: bool = False,
) -> None:
    manager = QueueManager(settings=settings)
    if queue_names is None or not list(queue_names):
        queue_names = [manager.settings.article_queue]

    resolved = [manager.queue_name(name) for name in queue_names]
    queues = [Queue(name, connection=manager.connection) for name in resolved]

    worker_cls = SimpleWorker if simple else Worker
    logger.info(
        "Starting RQ %s for queues %s",
        worker_cls.__name__,
        ", ".join(resolved),
    )
    worker = worker_cls(queues, connection=manager.connection)
    worker.work(burst=burst)
