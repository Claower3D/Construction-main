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
	"net/http"
	"strings"
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

// CorsMiddleware handles CORS with origin allowlist
func CorsMiddleware(allowedOrigins []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			allowed := false
			for _, ao := range allowedOrigins {
				if ao == "*" || ao == origin {
					allowed = true
					break
				}
			}
			if allowed && origin != "" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			}
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID, X-CSRF-Token")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Vary", "Origin")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
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
