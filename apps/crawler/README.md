# @basango/crawler

A powerful, scalable web crawler application built with Node.js and TypeScript for extracting and processing data from various news sources and websites.

The Basango Crawler is designed to systematically crawl news websites and extract article content. It supports both synchronous and asynchronous crawling modes, with configurable sources, queue-based processing, and robust error handling.

## Features

- **Multi-mode Operation**: Synchronous and asynchronous crawling capabilities
- **Queue-based Processing**: Uses BullMQ with Redis for scalable job processing
- **Configurable Sources**: JSON-based configuration for different website sources
- **HTML & WordPress Support**: Built-in parsers for HTML websites and WordPress APIs
- **Rate Limiting**: Respects website rate limits and implements backoff strategies
- **Data Persistence**: JSONL output format for processed articles
- **Worker Management**: Distributed worker system for parallel processing
- **Type Safety**: Full TypeScript implementation with Zod schema validation

## Prerequisites

- [Bun](https://bun.sh/) runtime (recommended) or Node.js (v22+)
- Redis server (for async operations)
- TypeScript knowledge for configuration

## Installation

```bash
# Navigate to the crawler directory
cd basango/apps/crawler

# Install dependencies
bun install
```

## Configuration

### 1. Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Redis configuration for async operations
BASANGO_CRAWLER_ASYNC_REDIS_URL=redis://localhost:6379/0
BASANGO_CRAWLER_ASYNC_QUEUE_LISTING=listing
BASANGO_CRAWLER_ASYNC_QUEUE_DETAILS=details
BASANGO_CRAWLER_ASYNC_QUEUE_PROCESSING=processing

# Fetch configuration
BASANGO_CRAWLER_FETCH_MAX_RETRIES=3
BASANGO_CRAWLER_FETCH_RESPECT_RETRY_AFTER=true
BASANGO_CRAWLER_FETCH_USER_AGENT=Basango/0.1 (+https://github.com/bernard-ng/basango)

# Crawler behavior
BASANGO_CRAWLER_UPDATE_DIRECTION=forward

# TTL settings (in seconds)
BASANGO_CRAWLER_ASYNC_TTL_FAILURE=3600
BASANGO_CRAWLER_ASYNC_TTL_RESULT=3600
```

### 2. Source Configuration

Sources are configured in `config/sources.json`. Example source configuration:

```json
{
  "sources": {
    "html": [
      {
        "sourceId": "example.com",
        "sourceKind": "html",
        "sourceUrl": "https://example.com",
        "sourceSelectors": {
          "articles": ".article-list .article",
          "articleTitle": "h2.title",
          "articleLink": "a.permalink",
          "articleDate": ".publish-date",
          "articleBody": ".content",
          "pagination": ".pagination .next"
        },
        "requiresDetails": true,
        "supportsCategories": false
      }
    ]
  }
}
```

## Usage

### Synchronous Crawling

Perfect for immediate, one-time crawling tasks:

```bash
# Crawl a specific source
bun run crawler:sync -- --sourceId radiookapi.net

# Crawl with page range filter
bun run crawler:sync -- --sourceId radiookapi.net --pageRange 1:5

# Crawl with date range filter
bun run crawler:sync -- --sourceId radiookapi.net --dateRange 2024-01-01:2024-01-31

# Crawl specific category (if supported)
bun run crawler:sync -- --sourceId example.com --category politics
```

Crawled data will be saved in the `data/` directory as JSONL files.
and can be push to the database using the `bun run crawler:push -- --sourceId radiookapi.net`.


### Asynchronous Crawling

Best for large-scale operations and when you need job queuing:

```bash
# Schedule an async crawl job
bun run crawler:async -- --sourceId radiookapi.net

# Schedule with filters
bun run crawler:async -- --sourceId radiookapi.net --pageRange 1:10 --category economics
```

### Worker Management

Start workers to process async jobs:

```bash
# Start workers for all queues
bun run crawler:worker

# Start workers for specific queues
bun run crawler:worker -- --queue listing --queue details

# Start workers with short option
bun run crawler:worker -- -q listing -q processing
```

## CLI Options

### Crawling Commands

| Option | Description | Example |
|--------|-------------|---------|
| `--sourceId` | **Required.** Source identifier from sources.json | `--sourceId radiookapi.net` |
| `--pageRange` | Page range to crawl (format: start:end) | `--pageRange 1:5` |
| `--dateRange` | Date range filter (format: YYYY-MM-DD:YYYY-MM-DD) | `--dateRange 2024-01-01:2024-01-31` |
| `--category` | Category slug to crawl | `--category politics` |

### Worker Commands

| Option | Description | Example |
|--------|-------------|---------|
| `--queue`, `-q` | Specify queue(s) to process (can be used multiple times) | `--queue listing --queue details` |
