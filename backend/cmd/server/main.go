package main

import (
	"log"
	"net/http"
	"os"

	"payment-demo/internal/api"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// CORS配置
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{
		"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:3000",
		"https://*.vercel.app", "https://vercel.app",
		"https://*.onrender.com", // Render域名支持
		// 部署后请添加您的实际域名
		// "https://your-app-name.vercel.app",
		// "https://your-app-name.onrender.com",
	}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	// 初始化路由
	api.SetupRoutes(r)

	// 获取端口
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}