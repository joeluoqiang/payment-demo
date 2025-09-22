package config

import (
	"errors"
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

	config := &Config{
		Port:          getEnv("PORT", "8080"),
		Environment:   getEnv("ENVIRONMENT", "development"),
		EvonetAPIURL:  getEnv("EVONET_API_URL", "https://sandbox.evonetonline.com"),
		EvonetKeyID:   getEnv("EVONET_KEY_ID", ""),
		EvonetSignKey: getEnv("EVONET_SIGN_KEY", ""),
		FrontendURL:   getEnv("FRONTEND_URL", "http://localhost:5173"),
	}

	// 验证必需配置
	if err := config.Validate(); err != nil {
		log.Fatalf("Configuration validation failed: %v", err)
	}

	return config
}

// Validate 验证配置的必需参数
func (c *Config) Validate() error {
	if c.EvonetKeyID == "" {
		return errors.New("EVONET_KEY_ID is required")
	}
	if c.EvonetSignKey == "" {
		return errors.New("EVONET_SIGN_KEY is required")
	}
	if c.EvonetAPIURL == "" {
		return errors.New("EVONET_API_URL is required")
	}
	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
