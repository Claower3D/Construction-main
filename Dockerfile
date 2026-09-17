# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
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
FROM alpine:3.19
WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy built backend binary
COPY --from=backend-builder /app/go-backend/server ./server

# Default port for local / Railway (overridden by Railway's $PORT)
ENV PORT=8080
EXPOSE 8080

# Start Go backend
CMD ["./server"]
