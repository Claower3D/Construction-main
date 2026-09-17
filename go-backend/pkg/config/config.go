package config

import (
	"log"
	"os"
	"strings"
)

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
