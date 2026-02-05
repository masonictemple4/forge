# Forge - Project Makefile
# Common commands for local development

.PHONY: setup dev seed clean db-start db-stop db-reset help

# Default target
help:
	@echo "Forge - Available Commands"
	@echo "─────────────────────────────"
	@echo "  make setup     - Install deps, start Docker, run migrations"
	@echo "  make dev       - Start development server"
	@echo "  make seed      - Seed database with demo data"
	@echo "  make clean     - Stop Docker, remove node_modules"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-start  - Start PostgreSQL container"
	@echo "  make db-stop   - Stop PostgreSQL container"
	@echo "  make db-reset  - Reset database (drop & recreate)"
	@echo "  make db-studio - Open Drizzle Studio"
	@echo ""
	@echo "Build Commands:"
	@echo "  make build     - Build for production"
	@echo "  make start     - Start production server"
	@echo "  make typecheck - Run TypeScript type checking"

# Full setup: install, docker, migrate
setup:
	@echo "📦 Installing dependencies..."
	pnpm install
	@echo ""
	@echo "🐳 Starting PostgreSQL..."
	docker compose up -d --wait
	@echo ""
	@echo "⏳ Waiting for database to be ready..."
	@sleep 2
	@echo ""
	@echo "🔄 Running database migrations..."
	pnpm db:push
	@echo ""
	@echo "✅ Setup complete! Run 'make dev' to start the dev server."

# Start development server
dev:
	pnpm dev

# Seed database with demo data
seed:
	pnpm db:seed

# Clean up everything
clean:
	@echo "🛑 Stopping Docker containers..."
	docker compose down -v || true
	@echo ""
	@echo "🗑️  Removing node_modules..."
	rm -rf node_modules
	rm -rf packages/*/node_modules
	@echo ""
	@echo "✅ Cleanup complete!"

# Database commands
db-start:
	docker compose up -d --wait
	@echo "✅ PostgreSQL is running on localhost:5432"

db-stop:
	docker compose down
	@echo "✅ PostgreSQL stopped"

db-reset:
	@echo "⚠️  This will delete all data. Press Ctrl+C to cancel..."
	@sleep 3
	docker compose down -v
	docker compose up -d --wait
	@sleep 2
	pnpm db:push
	@echo "✅ Database reset complete!"

db-studio:
	pnpm db:studio

# Build commands
build:
	pnpm build

start:
	pnpm start

typecheck:
	pnpm exec tsc --noEmit
