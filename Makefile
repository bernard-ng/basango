.PHONY: default
default: help

COMPOSE ?= docker compose
MYSQL_BACKUP ?= var/volumes/backups/basango.mysql.gz
MYSQL_BACKUP_IN_CONTAINER ?= /var/www/var/basango.mysql.gz
MYSQL_DATABASE ?= app
MYSQL_SERVICE ?= mariadb
MYSQL_ROOT_USER ?= root
POSTGRES_DATABASE ?= app
POSTGRES_SERVICE ?= postgres
POSTGRES_USER ?= postgres
SYNC_TABLES ?= user source article

.PHONY: help
help:
	@echo Tasks:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# -----------------------------------
# Local data
# -----------------------------------
.PHONY: db-reload-from-backup
db-reload-from-backup: ## Reset local MariaDB/Postgres, load basango.mysql.gz, migrate, and sync data
	@test -f "$(MYSQL_BACKUP)" || (echo "Missing backup: $(MYSQL_BACKUP)" >&2; exit 1)
	$(COMPOSE) up -d $(MYSQL_SERVICE) $(POSTGRES_SERVICE)
	@echo "Waiting for MariaDB..."
	@until $(COMPOSE) exec -T $(MYSQL_SERVICE) sh -c 'mariadb-admin ping -u$(MYSQL_ROOT_USER) -p"$${MARIADB_ROOT_PASSWORD}" --silent'; do sleep 1; done
	@echo "Waiting for Postgres..."
	@until $(COMPOSE) exec -T $(POSTGRES_SERVICE) pg_isready -U $(POSTGRES_USER) -d postgres >/dev/null; do sleep 1; done
	@echo "Resetting MariaDB database $(MYSQL_DATABASE)..."
	$(COMPOSE) exec -T $(MYSQL_SERVICE) sh -c 'mariadb -u$(MYSQL_ROOT_USER) -p"$${MARIADB_ROOT_PASSWORD}" -e "DROP DATABASE IF EXISTS \`$(MYSQL_DATABASE)\`; CREATE DATABASE \`$(MYSQL_DATABASE)\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"'
	@echo "Loading $(MYSQL_BACKUP_IN_CONTAINER) into MariaDB database $(MYSQL_DATABASE)..."
	$(COMPOSE) exec -T $(MYSQL_SERVICE) sh -c 'gzip -dc "$(MYSQL_BACKUP_IN_CONTAINER)" | mariadb -u$(MYSQL_ROOT_USER) -p"$${MARIADB_ROOT_PASSWORD}" "$(MYSQL_DATABASE)"'
	@echo "Resetting Postgres database $(POSTGRES_DATABASE)..."
	$(COMPOSE) exec -T $(POSTGRES_SERVICE) psql -U $(POSTGRES_USER) -d postgres -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$(POSTGRES_DATABASE)' AND pid <> pg_backend_pid();" -c "DROP DATABASE IF EXISTS \"$(POSTGRES_DATABASE)\";" -c "CREATE DATABASE \"$(POSTGRES_DATABASE)\";"
	@echo "Running Postgres migrations..."
	bun run migrate
	@echo "Synchronizing legacy data into Postgres..."
	cd packages/db && bun run sync:data -- $(SYNC_TABLES)
	@echo "Synchronizing categories..."
	cd packages/db && bun run sync:categories

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
