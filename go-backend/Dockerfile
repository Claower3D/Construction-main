# ── Build Stage ──
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server ./cmd/server/

# ── Runtime Stage ──
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /server /app/server
COPY --from=builder /app/ai-service/app/data/price_db.json /app/ai-service/app/data/price_db.json

RUN mkdir -p /app/data /app/uploads

ENV PORT=8080
ENV NODE_ENV=production
ENV DB_PATH=/app/data/qazgost.db
ENV UPLOAD_DIR=/app/uploads

EXPOSE 8080

VOLUME ["/app/data", "/app/uploads"]

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["/app/server"]
