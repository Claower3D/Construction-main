# Stage 1: Build Frontend
# Node 18 снят с поддержки в апреле 2025 — сборка идёт на текущей LTS-версии
FROM node:22-alpine AS frontend-builder
WORKDIR /app

COPY frontend/package*.json ./frontend/
# npm ci ставит ровно те версии, что записаны в package-lock.json (сборка повторяема)
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Stage 2: Build Go Backend
FROM golang:alpine AS backend-builder
WORKDIR /app

COPY go-backend/go.mod go-backend/go.sum* ./go-backend/
RUN cd go-backend && (go mod download || true)

COPY go-backend/ ./go-backend/
RUN cd go-backend && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./cmd/server/main.go

# Stage 3: Final Production Image
# Alpine 3.19 снят с поддержки в ноябре 2025
FROM alpine:3.22
WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy built backend binary
COPY --from=backend-builder /app/go-backend/server ./server

# Price database (23 864 SNiP/GESN items). Without it production served only 10 fallback prices.
COPY ai-service/app/data/price_db.json ./ai-service/app/data/price_db.json
ENV PRICE_DB_PATH=/app/ai-service/app/data/price_db.json

# Default port for local / Railway (overridden by Railway's $PORT)
ENV PORT=8080
EXPOSE 8080

# Start Go backend
CMD ["./server"]
