# Build from the REPOSITORY ROOT (the image needs ai-service/app/data/price_db.json):
#   docker build -f go-backend/Dockerfile .
# ── Build Stage ──
FROM golang:1.26-alpine AS builder

RUN apk add --no-cache git

WORKDIR /src

COPY go-backend/go.mod go-backend/go.sum ./
RUN go mod download

COPY go-backend/ ./

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server ./cmd/server/

# ── Runtime Stage ──
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata && adduser -D -u 10001 app

WORKDIR /app

COPY --from=builder /server /app/server
# 23 864 SNiP/GESN prices (without this file the API falls back to 10 demo prices)
COPY ai-service/app/data/price_db.json /app/ai-service/app/data/price_db.json

RUN mkdir -p /app/uploads && chown -R app /app/uploads

ENV PORT=8080
ENV NODE_ENV=production
ENV UPLOAD_DIR=/app/uploads
ENV PRICE_DB_PATH=/app/ai-service/app/data/price_db.json

EXPOSE 8080
VOLUME ["/app/uploads"]
USER app

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["/app/server"]
