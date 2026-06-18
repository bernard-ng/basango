# Basango Crawler Binary Deployment

This deployment runs one standalone `basango-crawler` binary with external `.env` config.
Crawler results are stored in a local SQLite outbox at `BASANGO_CRAWLER_SQLITE_PATH`
and forwarded to the shared Basango API.

## Build

```bash
bun run build:crawler:arm64
bun run build:crawler:x64
```

Use `dist/crawler/basango-crawler-linux-arm64` for 64-bit Raspberry Pi 4B/ARM Ubuntu, and `dist/crawler/basango-crawler-linux-x64` for x64 Ubuntu.

## Install On A Node

```bash
sudo useradd --system --home /opt/basango-crawler --shell /usr/sbin/nologin basango
sudo mkdir -p /opt/basango-crawler /var/lib/basango-crawler
sudo cp basango-crawler-linux-arm64 /opt/basango-crawler/basango-crawler
sudo cp .env /opt/basango-crawler/.env
sudo chown -R basango:basango /opt/basango-crawler /var/lib/basango-crawler
sudo chmod 0755 /opt/basango-crawler/basango-crawler
sudo chmod 0640 /opt/basango-crawler/.env
```

Copy the systemd files:

```bash
sudo cp basango-crawler-worker.service /etc/systemd/system/
sudo cp basango-crawler-schedule.service /etc/systemd/system/
sudo cp basango-crawler-schedule.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now basango-crawler-worker.service
sudo systemctl enable --now basango-crawler-schedule.timer
```

## Configure Shards

Set a different source list per node:

```bash
BASANGO_CRAWLER_SOURCE_IDS=radiookapi.net,7sur7.cd
```

The scheduler reads this list when `basango-crawler schedule` runs. Repeated `--sourceId` flags override the env shard for manual runs.

## Operate

```bash
sudo journalctl -u basango-crawler-worker -f
sudo journalctl -u basango-crawler-schedule -n 100
sudo systemctl list-timers basango-crawler-schedule.timer
/opt/basango-crawler/basango-crawler push --limit 100
```
