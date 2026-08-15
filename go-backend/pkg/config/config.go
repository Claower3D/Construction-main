package config

import (
	"os"
)

type Config struct {
	Port        string
	Env         string
	JwtSecret   string
	UploadDir   string
	FrontendURL string
	CorsOrigins []string
}

func LoadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	env := os.Getenv("NODE_ENV")
	if env == "" {
		env = "development"
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "qazgost-ai-super-secret-jwt-key-2026"
	}

	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	return &Config{
		Port:        port,
		Env:         env,
		JwtSecret:   secret,
		UploadDir:   uploadDir,
		FrontendURL: frontendURL,
		CorsOrigins: []string{"*", "http://localhost:5173", "http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:5173"},
	}
}
