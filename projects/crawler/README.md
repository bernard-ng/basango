# Crawler

[![crawler audit](https://github.com/bernard-ng/basango/actions/workflows/crawler_audit.yml/badge.svg)](https://github.com/bernard-ng/basango/actions/workflows/crawler_audit.yml)
[![crawler quality](https://github.com/bernard-ng/basango/actions/workflows/crawler_quality.yml/badge.svg)](https://github.com/bernard-ng/basango/actions/workflows/crawler_quality.yml)
[![crawler tests](https://github.com/bernard-ng/basango/actions/workflows/crawler_tests.yml/badge.svg)](https://github.com/bernard-ng/basango/actions/workflows/crawler_tests.yml)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)
[![security: bandit](https://img.shields.io/badge/security-bandit-yellow.svg)](https://github.com/PyCQA/bandit)

---

### Usage

- Install the project in your virtualenv so the `basango` CLI is available:
  - With uv: `uv run --with . basango --help`
  - Or install locally: `pip install -e .` then `basango --help`

#### Sync crawl (in-process)

- Crawl a configured source by id and write to CSV/JSON:
  - `basango crawl --source-id my-source`
  - Limit by page range: `basango crawl --source-id my-source -p 1:3`
  - Limit by date range: `basango crawl --source-id my-source -d 2024-10-01:2024-10-31`
  - Category, when supported: `basango crawl --source-id my-source -g tech`

#### Async crawl (Redis + RQ)

- Enqueue a crawl job and return immediately:
  - `basango crawl --source-id my-source --async`
- Start one or more workers to process queues:
  - Article-only (default): `basango worker`
  - Multiple queues: `basango worker -q listing -q articles -q processed`
  - macOS friendly (no forking): `basango worker --simple`
  - One-shot draining for CI: `basango worker --burst`

#### Environment

- `BASANGO_REDIS_URL` (default `redis://localhost:6379/0`)
- `BASANGO_QUEUE_PREFIX` (default `crawler`)
- `BASANGO_QUEUE_TIMEOUT` (default `600` seconds)
- `BASANGO_QUEUE_RESULT_TTL` (default `3600` seconds)
- `BASANGO_QUEUE_FAILURE_TTL` (default `3600` seconds)

#### Configuration

- See `config/pipeline.*.yaml` for source definitions and HTTP client settings.
- Use `-c/--env` to select which pipeline to load (default `development`).
