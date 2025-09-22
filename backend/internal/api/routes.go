package api

import (
	"payment-demo/config"
	"payment-demo/internal/models"
	"payment-demo/internal/service"

	"github.com/gin-gonic/gin"
)

// 设置所有路由
func SetupRoutes(r *gin.Engine) {
	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1 路由组
	v1 := r.Group("/api/v1")
	{
		// 配置相关
		v1.GET("/countries", getCountries)
		v1.GET("/scenarios", getScenarios)
		v1.GET("/config", getConfig)

		// 支付相关
		payment := v1.Group("/payment")
		{
			payment.POST("/interaction", createInteraction)
			payment.POST("/direct", createDirectPayment)
			payment.POST("/webhook", handleWebhook)
			payment.GET("/:merchantTransId", getPaymentStatus)
		}

		// 交互状态查询（用于LinkPay和Drop-in）
		interaction := v1.Group("/interaction")
		{
			interaction.GET("/:merchantOrderId", getInteractionStatus)
		}
	}
}

// 获取支持的国家列表
func getCountries(c *gin.Context) {
	countries := []models.Country{
		{Code: "GLOBAL", Name: "Global", Currency: "USD", Language: "en"},
		{Code: "HK", Name: "Hong Kong", Currency: "HKD", Language: "zh-HK"},
		{Code: "KR", Name: "South Korea", Currency: "KRW", Language: "ko"},
		{Code: "JP", Name: "Japan", Currency: "JPY", Language: "ja"},
		{Code: "MY", Name: "Malaysia", Currency: "MYR", Language: "ms"},
		{Code: "ID", Name: "Indonesia", Currency: "IDR", Language: "id"},
		{Code: "TH", Name: "Thailand", Currency: "THB", Language: "th"},
		{Code: "SG", Name: "Singapore", Currency: "SGD", Language: "en"},
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    countries,
	})
}

// 获取支付场景列表
func getScenarios(c *gin.Context) {
	scenarios := []models.PaymentScenario{
		{
			ID:          "uat-ecommerce-linkpay",
			Name:        "UAT-电商-LinkPay Demo",
			Environment: "UAT",
			Type:        "linkpay",
			Description: "UAT环境电商场景LinkPay支付演示",
		},
		{
			ID:          "uat-ecommerce-dropin",
			Name:        "UAT-电商-Drop-in Demo",
			Environment: "UAT",
			Type:        "dropin",
			Description: "UAT环境电商场景Drop-in支付演示",
		},
		{
			ID:          "uat-ecommerce-directapi",
			Name:        "UAT-电商-Direct API Demo",
			Environment: "UAT",
			Type:        "directapi",
			Description: "UAT环境电商场景Direct API支付演示",
		},
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    scenarios,
	})
}

// 创建支付交互（用于LinkPay和Drop-in）
func createInteraction(c *gin.Context) {
	var req models.PaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{
			"success": false,
			"message": "Invalid request parameters",
			"error":   err.Error(),
		})
		return
	}

	paymentService := service.NewPaymentService()
	response, err := paymentService.CreateInteraction(&req)
	if err != nil {
		c.JSON(500, gin.H{
			"success": false,
			"message": "Failed to create payment interaction",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, response)
}

// 创建直接支付（用于Direct API）
func createDirectPayment(c *gin.Context) {
	var req models.PaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{
			"success": false,
			"message": "Invalid request parameters",
			"error":   err.Error(),
		})
		return
	}

	paymentService := service.NewPaymentService()
	response, err := paymentService.CreateDirectPayment(&req)
	if err != nil {
		c.JSON(500, gin.H{
			"success": false,
			"message": "Failed to create direct payment",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, response)
}

// 处理Webhook通知
func handleWebhook(c *gin.Context) {
	var notification models.WebhookNotification
	if err := c.ShouldBindJSON(&notification); err != nil {
		c.JSON(400, gin.H{
			"success": false,
			"message": "Invalid webhook data",
		})
		return
	}

	// 在实际应用中，这里应该验证webhook签名
	// 并更新数据库中的支付状态

	// 返回SUCCESS确认收到通知
	c.String(200, "SUCCESS")
}

// 查询支付状态
func getPaymentStatus(c *gin.Context) {
	merchantTransId := c.Param("merchantTransId")
	if merchantTransId == "" {
		c.JSON(400, gin.H{
			"success": false,
			"message": "merchantTransId is required",
		})
		return
	}

	paymentService := service.NewPaymentService()
	payment, err := paymentService.GetPaymentStatus(merchantTransId)
	if err != nil {
		c.JSON(500, gin.H{
			"success": false,
			"message": "Failed to get payment status",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    payment,
	})
}

// 查询交互状态（用于LinkPay和Drop-in）
func getInteractionStatus(c *gin.Context) {
	merchantOrderId := c.Param("merchantOrderId")
	if merchantOrderId == "" {
		c.JSON(400, gin.H{
			"success": false,
			"message": "merchantOrderId is required",
		})
		return
	}

	paymentService := service.NewPaymentService()
	payment, err := paymentService.GetInteractionStatus(merchantOrderId)
	if err != nil {
		c.JSON(500, gin.H{
			"success": false,
			"message": "Failed to get interaction status",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    payment,
	})
}

// 获取配置信息
func getConfig(c *gin.Context) {
	cfg := config.Load()

	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"environment": cfg.Environment,
			"apiUrl":      cfg.EvonetAPIURL,
		},
	})
}
