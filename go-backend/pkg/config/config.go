package config

import (
	"log"
	"os"
)

type Config struct {
	Port        string
	Env         string
	JwtSecret   string
	UploadDir   string
	FrontendURL string
	CorsOrigins []string
	OpenAIKey   string
}

func LoadConfig() *Config {
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
			log.Fatal("[SECURITY] JWT_SECRET не задан! В production-режиме это обязательно. Установите переменную JWT_SECRET.")
		}
		log.Println("[⚠️ WARNING] JWT_SECRET не задан — используется dev-ключ. Не запускайте так в production!")
		secret = "qazgost-ai-dev-secret-NOT-FOR-PRODUCTION"
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

	// CORS: in production use only specified origins, in dev allow localhost
	corsOrigins := []string{
		"http://localhost:5173",
		"http://localhost:3000",
		"http://localhost:8080",
		"http://127.0.0.1:5173",
	}

	return &Config{
		Port:        port,
		Env:         env,
		JwtSecret:   secret,
		UploadDir:   uploadDir,
		FrontendURL: frontendURL,
		CorsOrigins: corsOrigins,
		OpenAIKey:   openAIKey,
	}
}
