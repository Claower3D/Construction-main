package config

import (
	"bufio"
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

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		if env == "production" {
			log.Println("[⚠️ WARNING] JWT_SECRET не задан! В production-режиме рекомендуется установить переменную JWT_SECRET.")
		}
		secret = "qazgost-ai-secret-2026-production"
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
