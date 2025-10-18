#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONSOLE_BIN="$PROJECT_ROOT/bin/console"
APPLY_MIGRATIONS=0
PGLOADER_EXTRA_ARGS=()
SOURCE_DSN=""
TARGET_DSN=""

usage() {
  cat <<USAGE
Usage: $(basename "$0") [options] <mariadb_dsn> <postgres_dsn>

Environment variables:
  SOURCE_DATABASE_URL   MariaDB connection string (fallback for <mariadb_dsn>)
  TARGET_DATABASE_URL   PostgreSQL connection string (fallback for <postgres_dsn>)

Options:
  --apply-migrations    Run Doctrine migrations after data transfer (uses local PHP runtime)
  --pgloader-arg ARG    Append a raw argument when calling pgloader (can be provided multiple times)
  -h, --help            Show this help message

Examples:
  SOURCE_DATABASE_URL="mysql://user:pass@host/db" \\
  TARGET_DATABASE_URL="postgresql://user:pass@host/db" \\
  $(basename "$0") --apply-migrations

  $(basename "$0") --pgloader-arg "--with no schema" \\
  mysql://root:root@127.0.0.1:3306/app \\
  postgresql://app:secret@127.0.0.1:5432/app
USAGE
}

log() {
  printf '[migration] %s\n' "$*"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply-migrations)
      APPLY_MIGRATIONS=1
      ;;
    --pgloader-arg)
      shift
      if [[ $# -eq 0 ]]; then
        echo "--pgloader-arg requires a value" >&2
        exit 1
      fi
      PGLOADER_EXTRA_ARGS+=("$1")
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    *)
      if [[ -z "$SOURCE_DSN" ]]; then
        SOURCE_DSN="$1"
      elif [[ -z "$TARGET_DSN" ]]; then
        TARGET_DSN="$1"
      else
        PGLOADER_EXTRA_ARGS+=("$1")
      fi
      ;;
  esac
  shift
done

if [[ -z "$SOURCE_DSN" ]]; then
  SOURCE_DSN="${SOURCE_DATABASE_URL:-}"
fi
if [[ -z "$TARGET_DSN" ]]; then
  TARGET_DSN="${TARGET_DATABASE_URL:-}"
fi

if [[ -z "$SOURCE_DSN" || -z "$TARGET_DSN" ]]; then
  echo "Source and target DSNs are required (pass as arguments or set SOURCE_DATABASE_URL/TARGET_DATABASE_URL)." >&2
  usage >&2
  exit 1
fi

if ! command -v pgloader >/dev/null 2>&1; then
  echo "pgloader is required but not available on PATH. Install it (https://pgloader.readthedocs.io) and retry." >&2
  exit 1
fi

log "Starting data copy"
log "  source : $SOURCE_DSN"
log "  target : $TARGET_DSN"

pgloader "${PGLOADER_EXTRA_ARGS[@]}" "$SOURCE_DSN" "$TARGET_DSN"

log "Data copy finished"

if [[ $APPLY_MIGRATIONS -eq 1 ]]; then
  if ! command -v php >/dev/null 2>&1; then
    echo "PHP CLI is required to run Doctrine migrations." >&2
    exit 1
  fi

  if [[ ! -x "$CONSOLE_BIN" ]]; then
    echo "Symfony console not found at $CONSOLE_BIN" >&2
    exit 1
  fi

  log "Running Doctrine migrations"
  (cd "$PROJECT_ROOT" && php "$CONSOLE_BIN" doctrine:migrations:migrate --no-interaction)
fi

log "Migration helper completed"
