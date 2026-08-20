.PHONY: build run test clean docker-build docker-up docker-down

# ── Development ──
build:
	cd go-backend && go build -o server ./cmd/server/

run:
	cd go-backend && go run ./cmd/server/main.go

test:
	cd go-backend && go test -v -race ./...

vet:
	cd go-backend && go vet ./...

lint: vet
	@echo "✅ Lint passed"

# ── Frontend ──
frontend-install:
	cd frontend && npm ci

frontend-build:
	cd frontend && npm run build

frontend-dev:
	cd frontend && npm run dev

# ── Docker ──
docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

# ── Database ──
db-reset:
	rm -f go-backend/data/qazgost.db go-backend/data/qazgost.db-wal go-backend/data/qazgost.db-shm
	@echo "✅ Database reset. Restart server to re-seed."

# ── Full Pipeline ──
ci: vet test build frontend-build
	@echo "✅ CI pipeline passed"

all: build frontend-build
	@echo "✅ Full build complete"

# ── Cleanup ──
clean:
	rm -f go-backend/server go-backend/server.exe
	rm -rf frontend/dist
	@echo "✅ Cleaned"
