package config

import (
	"errors"
	"log"
	"os"
	"sync"

	"github.com/joho/godotenv"
)

type APIEnvironment string

const (
	Sandbox    APIEnvironment = "sandbox"
	Production APIEnvironment = "production"
)

type EvonetConfig struct {
	APIURL  string
	KeyID   string
	SignKey string
}

type Config struct {
	Port        string
	Environment string

	// 当前使用的API环境
	CurrentAPIEnv APIEnvironment

	// Sandbox环境配置
	Sandbox EvonetConfig

	// Production环境配置
	Production EvonetConfig

	// 前端配置
	FrontendURL string

	// 互斥锁，用于环境切换时的线程安全
	mu sync.RWMutex
}

var globalConfig *Config
var once sync.Once

func Load() *Config {
	once.Do(func() {
		// 加载.env文件
		if err := godotenv.Load(); err != nil {
			log.Println("No .env file found, using system environment variables")
		}

		globalConfig = &Config{
			Port:        getEnv("PORT", "8080"),
			Environment: getEnv("ENVIRONMENT", "development"),
			FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),

			// 默认使用Sandbox环境
			CurrentAPIEnv: Sandbox,

			// Sandbox环境配置（当前使用的参数）
			Sandbox: EvonetConfig{
				APIURL:  "https://sandbox.evonetonline.com",
				KeyID:   "kid_eb9cf3216111441c8d1b11584bf2a9c8",
				SignKey: "sk_sandbox_3a0012c70873421b971a9581f81e6000",
			},

			// Production环境配置
			Production: EvonetConfig{
				APIURL:  "https://api.evonetonline.com",
				KeyID:   "cbaad717bfd24733aa1866bea83f6b81",
				SignKey: "38f82acee90f4c94b5437d8bf03474c7",
			},
		}
	})

	return globalConfig
}

// GetCurrentEvonetConfig 获取当前环境的Evonet配置
func (c *Config) GetCurrentEvonetConfig() EvonetConfig {
	c.mu.RLock()
	defer c.mu.RUnlock()

	if c.CurrentAPIEnv == Production {
		return c.Production
	}
	return c.Sandbox
}

// SwitchAPIEnvironment 切换API环境
func (c *Config) SwitchAPIEnvironment(env APIEnvironment) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if env != Sandbox && env != Production {
		return errors.New("invalid API environment, must be 'sandbox' or 'production'")
	}

	c.CurrentAPIEnv = env
	log.Printf("API environment switched to: %s", env)
	return nil
}

// GetAPIMode 获取当前API模式显示名称
func (c *Config) GetAPIMode() string {
	c.mu.RLock()
	defer c.mu.RUnlock()

	if c.CurrentAPIEnv == Production {
		return "Production"
	}
	return "Sandbox"
}

// HasAPIKeys 检查当前环境是否有API密钥
func (c *Config) HasAPIKeys() bool {
	currentConfig := c.GetCurrentEvonetConfig()
	return currentConfig.KeyID != "" && currentConfig.SignKey != ""
}

// Validate 验证配置的必需参数
func (c *Config) Validate() error {
	// 验证Sandbox配置
	if c.Sandbox.KeyID == "" || c.Sandbox.SignKey == "" || c.Sandbox.APIURL == "" {
		return errors.New("Sandbox API configuration is incomplete")
	}

	// 验证Production配置
	if c.Production.KeyID == "" || c.Production.SignKey == "" || c.Production.APIURL == "" {
		return errors.New("Production API configuration is incomplete")
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
