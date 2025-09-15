package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	Environment string

	// Evonet API配置
	EvonetAPIURL  string
	EvonetKeyID   string
	EvonetSignKey string

	// 前端配置
	FrontendURL string
}

func Load() *Config {
	// 加载.env文件
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	return &Config{
		Port:          getEnv("PORT", "8080"),
		Environment:   getEnv("ENVIRONMENT", "development"),
		EvonetAPIURL:  getEnv("EVONET_API_URL", "https://sandbox.evonetonline.com"),
		EvonetKeyID:   getEnv("EVONET_KEY_ID", ""),
		EvonetSignKey: getEnv("EVONET_SIGN_KEY", ""),
		FrontendURL:   getEnv("FRONTEND_URL", "http://localhost:5173"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
