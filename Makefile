.PHONY: default
default: help

.PHONY: help
help:
	@echo Tasks:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# -----------------------------------
# Variables
# -----------------------------------
BUN ?= bun
BUNX ?= bunx
PM2 ?= pm2
PWD := $(shell pwd)
DRIZZLE_CONFIG ?= packages/db/drizzle.config.ts

# -----------------------------------
# Deployment
# -----------------------------------
.PHONY: deploy
deploy:
	$(BUN) install --frozen-lockfile. 						# Install dependencies 
	$(BUN) run build:dashboard								# Build dashboard app
	cd packages/db											# Change directory to packages/db
	$(BUNX) drizzle-kit migrate                         	# Run database migrations
	cd $(PWD)                                            	# Change back to root directory
	$(PM2) reload ecosystem.config.js --env production  	# Reload PM2 processes


# -----------------------------------
# PM2 Commands
# -----------------------------------
.PHONY: start
start:
	$(PM2) start ecosystem.config.js --env production

.PHONY: restart
restart:
	$(PM2) reload ecosystem.config.js --env production

.PHONY: stop
stop:
	$(PM2) stop ecosystem.config.js --env production
