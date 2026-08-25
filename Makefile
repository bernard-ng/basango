.PHONY: default
default: help

COMPOSE ?= docker compose
BUN ?= $(HOME)/.bun/bin/bun
PM2 ?= pm2
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
deploy: ## Install, build, migrate, and reload the production applications
	$(BUN) install --frozen-lockfile
	$(BUN) run build:dashboard
	NODE_ENV=production $(BUN) run migrate
	$(PM2) startOrReload ecosystem.config.js
	$(PM2) save

# -----------------------------------                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
# PM2 Commands
# -----------------------------------
.PHONY: start
start:
	$(PM2) start ecosystem.config.js

.PHONY: restart
restart:
	$(PM2) reload ecosystem.config.js

.PHONY: stop
stop:
	$(PM2) stop ecosystem.config.js

.PHONY: logs
logs:
	$(PM2) logs --lines 100

.PHONY: monit
monit:
	$(PM2) monit
