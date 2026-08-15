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

COPY go-backend/go.mod ./go-backend/
# We add "|| true" just in case go.sum is missing and it errors, but go mod download is safe
RUN cd go-backend && go mod download || true

COPY go-backend/ ./go-backend/
RUN cd go-backend && CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server/main.go

# Stage 3: Final image
FROM alpine:latest
WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy built backend
COPY --from=backend-builder /app/go-backend/server ./server

# Set default port
ENV PORT=3030
EXPOSE 3030

# Start the Go backend server
CMD ["./server"]
