.PHONY: default
default: help

COMPOSE ?= docker compose
POSTGRES_DATABASE ?= app
POSTGRES_SERVICE ?= postgres
POSTGRES_USER ?= postgres

.PHONY: help
help:
	@echo Tasks:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# -----------------------------------
# Local data
# -----------------------------------
.PHONY: db-rebuild
db-rebuild: ## Rebuild the local PostgreSQL database and run migrations
	$(COMPOSE) up -d $(POSTGRES_SERVICE)
	@echo "Waiting for Postgres..."
	@until $(COMPOSE) exec -T $(POSTGRES_SERVICE) pg_isready -U $(POSTGRES_USER) -d postgres >/dev/null; do sleep 1; done
	@echo "Resetting Postgres database $(POSTGRES_DATABASE)..."
	$(COMPOSE) exec -T $(POSTGRES_SERVICE) psql -U $(POSTGRES_USER) -d postgres -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$(POSTGRES_DATABASE)' AND pid <> pg_backend_pid();" -c "DROP DATABASE IF EXISTS \"$(POSTGRES_DATABASE)\";" -c "CREATE DATABASE \"$(POSTGRES_DATABASE)\";"
	@echo "Running Postgres migrations..."
	bun run migrate

# -----------------------------------
# Deployment
# -----------------------------------
.PHONY: deploy
deploy:
	~/.bun/bin/bun install --frozen-lockfile.
	~/.bun/bin/bun run build:database
	~/.bun/bin/bun run migrate
	pm2 reload ecosystem.config.js --env production

# -----------------------------------                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
# PM2 Commands
# -----------------------------------
.PHONY: start
start:
	pm2 start ecosystem.config.js --env production

.PHONY: restart
restart:
	pm2 reload ecosystem.config.js --env production

.PHONY: stop
stop:
	pm2 stop ecosystem.config.js --env production

.PHONY: logs
logs:
	pm2 logs --lines 100 --env production

.PHONY: monit
monit:
	pm2 monit --env production
