package middleware

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

// ContextKey type for request context values
type ContextKey string

const (
	ContextUserID ContextKey = "userID"
	ContextEmail  ContextKey = "email"
	ContextRole   ContextKey = "role"
)

// ── PASSWORD HASHING (SHA-256 + salt, zero external deps) ──

// HashPassword creates a salted SHA-256 hash: "salt:hash"
func HashPassword(password string) string {
	salt := make([]byte, 16)
	_, _ = rand.Read(salt)
	saltHex := hex.EncodeToString(salt)
	h := sha256.New()
	h.Write(salt)
	h.Write([]byte(password))
	hashHex := hex.EncodeToString(h.Sum(nil))
	return fmt.Sprintf("%s:%s", saltHex, hashHex)
}

// CheckPassword verifies a password against a "salt:hash" string
func CheckPassword(password, storedHash string) bool {
	parts := strings.SplitN(storedHash, ":", 2)
	if len(parts) != 2 {
		return false
	}
	salt, err := hex.DecodeString(parts[0])
	if err != nil {
		return false
	}
	h := sha256.New()
	h.Write(salt)
	h.Write([]byte(password))
	computedHash := hex.EncodeToString(h.Sum(nil))
	return hmac.Equal([]byte(computedHash), []byte(parts[1]))
}

// ── CORS MIDDLEWARE (allowlist, not wildcard) ──

// isLocalOrigin: exact host match. The old prefix check ("http://localhost") also
// trusted http://localhost.evil.com, and any *.railway.app site was trusted too.
func isLocalOrigin(origin string) bool {
	u, err := url.Parse(origin)
	if err != nil || u.Host == "" {
		return false
	}
	switch u.Scheme {
	case "http", "https", "capacitor", "ionic":
	default:
		return false
	}
	h := u.Hostname()
	return h == "localhost" || h == "127.0.0.1"
}

// CorsMiddleware handles CORS with an exact origin allowlist (+ localhost / Capacitor WebViews).
// Extra production origins come from CORS_ORIGINS (comma-separated).
func CorsMiddleware(allowedOrigins []string) func(http.Handler) http.Handler {
	allowed := map[string]bool{}
	for _, o := range allowedOrigins {
		allowed[strings.TrimRight(o, "/")] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" && (allowed[origin] || isLocalOrigin(origin)) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID, X-CSRF-Token, X-OpenAI-Key, X-OpenAI-Model")
			}
			w.Header().Add("Vary", "Origin")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// ── SECURITY HEADERS ──

func SecurityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "SAMEORIGIN")
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
			h.Set("Strict-Transport-Security", "max-age=31536000")
		}
		next.ServeHTTP(w, r)
	})
}

// ── BODY SIZE LIMIT ──

// BodyLimitMiddleware caps every request body (JSON decoders read without limits otherwise)
func BodyLimitMiddleware(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Body != nil {
				r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			}
			next.ServeHTTP(w, r)
		})
	}
}

// ── RATE LIMIT (per client IP, fixed window) ──

type rateWindow struct {
	start time.Time
	count int
}

// clientIP — адрес клиента для лимитов. X-Forwarded-For учитывается, только если запрос пришёл
// от прокси из внутренней сети (балансировщик Railway), и берётся ПОСЛЕДНИЙ адрес — его дописал
// этот прокси. Первый адрес задаёт сам клиент: раньше, подставив любой, он обходил лимит.
func clientIP(r *http.Request) string {
	remote := r.RemoteAddr
	if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
		remote = host
	}
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if ip := net.ParseIP(remote); trustAllProxies || (ip != nil && (ip.IsPrivate() || ip.IsLoopback() || cgnat.Contains(ip))) {
			parts := strings.Split(xff, ",")
			if last := strings.TrimSpace(parts[len(parts)-1]); last != "" {
				return last
			}
		}
	}
	return remote
}

var cgnat = &net.IPNet{IP: net.IPv4(100, 64, 0, 0), Mask: net.CIDRMask(10, 32)}

// TRUST_PROXY_HEADERS=1 — доверять X-Forwarded-For от прокси с публичным адресом (если хостинг так устроен).
var trustAllProxies = os.Getenv("TRUST_PROXY_HEADERS") == "1"

// RateLimit allows `limit` requests per `window` per client IP.
func RateLimit(limit int, window time.Duration, next http.HandlerFunc) http.HandlerFunc {
	var mu sync.Mutex
	hits := map[string]*rateWindow{}
	return func(w http.ResponseWriter, r *http.Request) {
		ip := clientIP(r)
		now := time.Now()
		mu.Lock()
		if len(hits) > 10000 { // drop stale windows
			for k, v := range hits {
				if now.Sub(v.start) > window {
					delete(hits, k)
				}
			}
		}
		rw := hits[ip]
		if rw == nil || now.Sub(rw.start) > window {
			rw = &rateWindow{start: now}
			hits[ip] = rw
		}
		rw.count++
		over := rw.count > limit
		mu.Unlock()
		if over {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", fmt.Sprintf("%d", int(window.Seconds())))
			w.WriteHeader(http.StatusTooManyRequests)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "Слишком много запросов, попробуйте через минуту"})
			return
		}
		next(w, r)
	}
}

// ── LOGGER MIDDLEWARE ──

func LoggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("[Go-Backend] %s %s %s (%v)", r.Method, r.URL.Path, r.RemoteAddr, time.Since(start))
	})
}

// ── RECOVERY MIDDLEWARE ──

func RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("[Go-Backend Panic] %v", err)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				_ = json.NewEncoder(w).Encode(map[string]string{"error": "Internal Server Error"})
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// ── AUTH MIDDLEWARE ──

// AuthMiddleware validates JWT Bearer token and injects claims into context
func AuthMiddleware(secret string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "Необходима авторизация"})
			return
		}
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := ValidateJWT(tokenStr, secret)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "Недействительный или истёкший токен"})
			return
		}
		ctx := context.WithValue(r.Context(), ContextUserID, claims.UserID)
		ctx = context.WithValue(ctx, ContextEmail, claims.Email)
		ctx = context.WithValue(ctx, ContextRole, claims.Role)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

// OptionalAuthMiddleware injects claims when a valid Bearer token is present,
// but lets anonymous requests through (used where clients do not send tokens yet).
func OptionalAuthMiddleware(secret string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			if claims, err := ValidateJWT(strings.TrimPrefix(authHeader, "Bearer "), secret); err == nil {
				ctx := context.WithValue(r.Context(), ContextUserID, claims.UserID)
				ctx = context.WithValue(ctx, ContextEmail, claims.Email)
				ctx = context.WithValue(ctx, ContextRole, claims.Role)
				r = r.WithContext(ctx)
			}
		}
		next(w, r)
	}
}

// RoleMiddleware restricts access to specific roles
func RoleMiddleware(secret string, allowedRoles []string, next http.HandlerFunc) http.HandlerFunc {
	return AuthMiddleware(secret, func(w http.ResponseWriter, r *http.Request) {
		role, _ := r.Context().Value(ContextRole).(string)
		for _, ar := range allowedRoles {
			if ar == role {
				next.ServeHTTP(w, r)
				return
			}
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Недостаточно прав"})
	})
}

// ── JWT ──

type JWTClaims struct {
	UserID string `json:"sub"`
	Role   string `json:"role"`
	Email  string `json:"email"`
	Exp    int64  `json:"exp"`
}

func GenerateJWT(userID, email, role, secret string) (string, error) {
	header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"HS256","typ":"JWT"}`))
	claims := JWTClaims{
		UserID: userID,
		Role:   role,
		Email:  email,
		Exp:    time.Now().Add(24 * time.Hour).Unix(),
	}
	claimsBytes, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	payload := base64.RawURLEncoding.EncodeToString(claimsBytes)
	unsignedToken := fmt.Sprintf("%s.%s", header, payload)
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(unsignedToken))
	signature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return fmt.Sprintf("%s.%s", unsignedToken, signature), nil
}

func ValidateJWT(tokenStr, secret string) (*JWTClaims, error) {
	parts := strings.Split(tokenStr, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token structure")
	}
	unsignedToken := fmt.Sprintf("%s.%s", parts[0], parts[1])
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(unsignedToken))
	expectedSig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if parts[2] != expectedSig {
		return nil, fmt.Errorf("invalid signature")
	}
	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, err
	}
	var claims JWTClaims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, err
	}
	if claims.Exp < time.Now().Unix() {
		return nil, fmt.Errorf("token expired")
	}
	return &claims, nil
}
