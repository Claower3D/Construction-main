package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

// CorsMiddleware handles Cross-Origin Resource Sharing
func CorsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID, X-CSRF-Token")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// LoggerMiddleware logs incoming HTTP requests with timing
func LoggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("[Go-Backend] %s %s %s (%v)", r.Method, r.URL.Path, r.RemoteAddr, time.Since(start))
	})
}

// RecoveryMiddleware handles panics gracefully
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

// JWT Claims struct
type JWTClaims struct {
	UserID string `json:"sub"`
	Role   string `json:"role"`
	Email  string `json:"email"`
	Exp    int64  `json:"exp"`
}

// GenerateJWT creates a lightweight JWT token using HMAC-SHA256
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

// ValidateJWT verifies HMAC-SHA256 signature
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
