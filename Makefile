.PHONY: help
help: ## Show this help message
	@echo "Chess Endgame Trainer - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

dev: ## Start development server
	pnpm run dev

test: ## Run all tests
	pnpm test

test-chess: ## Run chess-core tests only
	pnpm test:chess

test-watch: ## Run tests in watch mode
	pnpm run test:watch

test-e2e: ## Run E2E tests
	pnpm run test:e2e

lint: ## Run linter and typecheck
	pnpm run lint && pnpm tsc

build: ## Build for production
	pnpm run build

clean: ## Clean build artifacts
	rm -rf dist/ .next/ coverage/

install: ## Install dependencies
	pnpm install

typecheck: ## Run TypeScript compiler check
	pnpm tsc --noEmit

format: ## Format code with prettier
	pnpm prettier --write .

deps-update: ## Update dependencies
	pnpm update

serve: ## Serve production build locally
	pnpm start

smoke: ## Smoke test (verify basic functionality)
	@echo "Running smoke test..."
	@pnpm run build > /dev/null 2>&1 && echo "✅ Build successful" || echo "❌ Build failed"
	@pnpm tsc --noEmit > /dev/null 2>&1 && echo "✅ TypeScript check passed" || echo "❌ TypeScript errors"