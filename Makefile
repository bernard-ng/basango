.PHONY: default
default: help

.PHONY: help
help:
	@echo Tasks:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

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
