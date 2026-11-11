package config

import (
	"bufio"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"os"
	"path/filepath"
	"strings"
)

// loadDotEnv reads KEY=VALUE pairs from .env in the working directory or its parent
// (START_*.bat runs the binary from go-backend/, the .env lives in the repo root).
// Variables already set in the real environment always win (Railway, Docker).
func loadDotEnv() {
	for _, p := range []string{".env", filepath.Join("..", ".env")} {
		f, err := os.Open(p)
		if err != nil {
			continue
		}
		sc := bufio.NewScanner(f)
		for sc.Scan() {
			line := strings.TrimSpace(sc.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			k, v, ok := strings.Cut(line, "=")
			if !ok {
				continue
			}
			k = strings.TrimSpace(strings.TrimPrefix(k, "export "))
			v = strings.Trim(strings.TrimSpace(v), `"'`)
			if _, exists := os.LookupEnv(k); !exists && k != "" {
				_ = os.Setenv(k, v)
			}
		}
		f.Close()
		log.Printf("[config] loaded %s", p)
		return
	}
}

// weakJWTSecrets — заглушки из примеров настроек и ключ, который раньше был вшит в код.
// Их знает любой, кто видел репозиторий: с таким ключом можно подписать токен администратора.
var weakJWTSecrets = map[string]bool{
	"qazgost-ai-secret-2026-production":         true,
	"change-me-to-random-string":                true,
	"change-me-in-production":                   true,
	"your-super-secret-key-change-in-production": true,
	"your-jwt-secret-here":                      true,
}

// minJWTSecretLen — ключ короче подбирается перебором по любому выданному токену.
const minJWTSecretLen = 16

// ResolveJWTSecret выбирает ключ подписи сессий и сообщает, откуда он взят:
//   - "env" — JWT_SECRET из окружения (не заглушка и не короче 16 символов);
//   - "database" — ключ выведен из DATABASE_URL: строка подключения секретна, одинакова на всех
//     экземплярах сервера и не меняется между перезапусками, поэтому сессии переживают деплой;
//   - "random" — нет ни ключа, ни базы (локальный запуск): случайный ключ на время работы процесса.
//
// Вшитого в код ключа больше нет ни в одной ветке.
func ResolveJWTSecret(envSecret, dbURL string) (secret, source string) {
	envSecret = strings.TrimSpace(envSecret)
	if len(envSecret) >= minJWTSecretLen && !weakJWTSecrets[envSecret] {
		return envSecret, "env"
	}
	if dbURL = strings.TrimSpace(dbURL); dbURL != "" {
		sum := sha256.Sum256([]byte("qazgost-jwt-v1|" + dbURL))
		return hex.EncodeToString(sum[:]), "database"
	}
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		log.Fatalf("[config] не удалось получить случайный ключ подписи сессий: %v", err)
	}
	return hex.EncodeToString(buf), "random"
}

type Config struct {
	Port              string
	Env               string
	JwtSecret         string
	UploadDir         string
	FrontendURL       string
	CorsOrigins       []string
	OpenAIKey         string
	OpenAIDetailedKey string
}

func LoadConfig() *Config {
	loadDotEnv()
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	env := os.Getenv("NODE_ENV")
	if env == "" {
		env = "development"
	}

	secret, secretSource := ResolveJWTSecret(os.Getenv("JWT_SECRET"), os.Getenv("DATABASE_URL"))
	switch secretSource {
	case "database":
		log.Println("[config] JWT_SECRET не задан или небезопасен: ключ подписи сессий выведен из DATABASE_URL. Надёжнее задать свой JWT_SECRET (32+ случайных символа).")
	case "random":
		log.Println("[config] JWT_SECRET и DATABASE_URL не заданы: ключ подписи сессий случайный, сессии сбросятся при перезапуске.")
	}

	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	openAIKey := os.Getenv("OPENAI_API_KEY")
	openAIDetailedKey := os.Getenv("OPENAI_DETAILED_KEY")
	if openAIDetailedKey == "" {
		openAIDetailedKey = openAIKey
	}

	// CORS: allow localhost, capacitor schemes, and custom Railway origins
	corsOrigins := []string{
		"http://localhost:5173",
		"http://localhost:5174",
		"http://localhost:5175",
		"http://localhost:3000",
		"http://localhost:8080",
		"http://127.0.0.1:5173",
		"http://127.0.0.1:5174",
		"http://127.0.0.1:5175",
		"https://localhost",
		"http://localhost",
		"capacitor://localhost",
		"https://construction-main-production.up.railway.app",
	}
	if frontendURL != "" {
		corsOrigins = append(corsOrigins, strings.TrimRight(frontendURL, "/"))
	}

	if envOrigins := os.Getenv("CORS_ORIGINS"); envOrigins != "" {
		for _, o := range strings.Split(envOrigins, ",") {
			trimmed := strings.TrimSpace(o)
			if trimmed != "" {
				corsOrigins = append(corsOrigins, trimmed)
			}
		}
	}

	return &Config{
		Port:              port,
		Env:               env,
		JwtSecret:         secret,
		UploadDir:         uploadDir,
		FrontendURL:       frontendURL,
		CorsOrigins:       corsOrigins,
		OpenAIKey:         openAIKey,
		OpenAIDetailedKey: openAIDetailedKey,
	}
}
