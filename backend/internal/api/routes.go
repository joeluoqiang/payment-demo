package api

import (
	"encoding/json"
	"log"
	"payment-demo/config"
	"payment-demo/internal/database"
	"payment-demo/internal/models"
	"payment-demo/internal/service"
	"strconv"
	"time"

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
		v1.POST("/config/switch-env", switchAPIEnvironment)

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

		// 订阅相关
		subscription := v1.Group("/subscription")
		{
			subscription.GET("/plans", getSubscriptionPlans)
			subscription.POST("", createSubscription)
			subscription.GET("/:id", getSubscription)
			subscription.POST("/:id/cancel", cancelSubscription)
		}

		// 退款相关
		refund := v1.Group("/refund")
		{
			refund.POST("", createRefund)
			refund.GET("/:id", getRefund)
		}

		// 演示录制相关
		recordings := v1.Group("/recordings")
		{
			recordings.GET("", listRecordings)
			recordings.POST("", saveRecording)
			recordings.GET("/:id", getRecording)
			recordings.DELETE("/:id", deleteRecording)
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
	cfg := config.Load()
	currentEnv := cfg.CurrentAPIEnv
	currentEnvStr := string(currentEnv)
	
	// 根据当前环境设置场景的Environment字段
	var envStr string
	if currentEnv == config.Production {
		envStr = "PROD"
	} else {
		envStr = "UAT"
	}
	
	scenarios := []models.PaymentScenario{
		{
			ID:          currentEnvStr + "-linkpay",
			Name:        envStr + "-LinkPay Demo",
			Environment: envStr,
			Type:        "linkpay",
			Description: envStr + "环境LinkPay支付演示",
		},
		{
			ID:          currentEnvStr + "-dropin",
			Name:        envStr + "-Drop-in Demo",
			Environment: envStr,
			Type:        "dropin",
			Description: envStr + "环境Drop-in支付演示",
		},
		{
			ID:          currentEnvStr + "-directapi",
			Name:        envStr + "-Direct API Demo",
			Environment: envStr,
			Type:        "directapi",
			Description: envStr + "环境Direct API支付演示",
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
	// 打印收到异步通知的日志
	log.Println("==================================================")
	log.Println("收到Evonet异步通知")
	log.Println("==================================================")
	
	// 打印请求头
	log.Println("[Webhook Header]")
	for key, values := range c.Request.Header {
		for _, value := range values {
			log.Printf("%s: %s", key, value)
		}
	}
	
	// 读取请求体
	body, err := c.GetRawData()
	if err != nil {
		log.Printf("[Webhook] 读取请求体失败: %v", err)
	} else {
		// 打印请求体
		log.Println("\n[Webhook Body]")
		log.Printf("%s", body)
		log.Println("==================================================")
		
		// 解析请求体（手动解析，不使用c.ShouldBindJSON避免EOF错误）
		var notification models.WebhookNotification
		if err := json.Unmarshal(body, &notification); err != nil {
			log.Printf("[Webhook] 解析请求体失败: %v", err)
		} else {
			// 打印解析后的通知数据
			log.Println("\n[Webhook Parsed]")
			log.Printf("EventCode: %s", notification.EventCode)
			log.Printf("Timestamp: %v", notification.Timestamp)
			if notification.Payment != nil {
				log.Printf("Payment Details:")
				log.Printf("  Transaction ID: %s", notification.Payment.MerchantTransID)
				log.Printf("  Status: %s", notification.Payment.Status)
				log.Printf("  Amount: %v %s", notification.Payment.Amount, notification.Payment.Currency)
				log.Printf("  Created At: %v", notification.Payment.CreatedAt)
			}
		}
	}
	
	// 在实际应用中，这里应该验证webhook签名
	// 并更新数据库中的支付状态

	// 无论处理结果如何，都返回SUCCESS确认收到通知
	log.Println("[Webhook] 处理完成，返回SUCCESS")
	log.Println("==================================================")
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

// 获取配置信息（更新返回环境模式信息）
func getConfig(c *gin.Context) {
	cfg := config.Load()
	currentConfig := cfg.GetCurrentEvonetConfig()

	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"environment": cfg.Environment,
			"apiMode":     cfg.GetAPIMode(),
			"apiUrl":      currentConfig.APIURL,
			"hasApiKeys":  cfg.HasAPIKeys(),
			"currentEnv":  string(cfg.CurrentAPIEnv),
		},
	})
}

// 切换API环境
func switchAPIEnvironment(c *gin.Context) {
	var req struct {
		Environment string `json:"environment" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{
			"success": false,
			"message": "Invalid request parameters",
			"error":   err.Error(),
		})
		return
	}

	cfg := config.Load()
	var apiEnv config.APIEnvironment

	switch req.Environment {
	case "sandbox":
		apiEnv = config.Sandbox
	case "production":
		apiEnv = config.Production
	default:
		c.JSON(400, gin.H{
			"success": false,
			"message": "Invalid environment, must be 'sandbox' or 'production'",
		})
		return
	}

	if err := cfg.SwitchAPIEnvironment(apiEnv); err != nil {
		c.JSON(500, gin.H{
			"success": false,
			"message": "Failed to switch environment",
			"error":   err.Error(),
		})
		return
	}

	// 返回切换后的配置信息
	currentConfig := cfg.GetCurrentEvonetConfig()
	c.JSON(200, gin.H{
		"success": true,
		"message": "Environment switched successfully",
		"data": gin.H{
			"apiMode":    cfg.GetAPIMode(),
			"apiUrl":     currentConfig.APIURL,
			"currentEnv": string(cfg.CurrentAPIEnv),
		},
	})
}

// ================= Subscription Handlers =================

// 获取订阅计划列表
func getSubscriptionPlans(c *gin.Context) {
	paymentService := service.NewPaymentService()
	plans := paymentService.GetSubscriptionPlans()

	c.JSON(200, gin.H{
		"success": true,
		"data":    plans,
	})
}

// 创建订阅
func createSubscription(c *gin.Context) {
	var req models.SubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{
			"success": false,
			"message": "Invalid request parameters",
			"error":   err.Error(),
		})
		return
	}

	paymentService := service.NewPaymentService()
	response, err := paymentService.CreateSubscription(&req)
	if err != nil {
		c.JSON(500, gin.H{
			"success": false,
			"message": "Failed to create subscription",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, response)
}

// 获取订阅详情
func getSubscription(c *gin.Context) {
	subscriptionID := c.Param("id")
	if subscriptionID == "" {
		c.JSON(400, gin.H{
			"success": false,
			"message": "subscription ID is required",
		})
		return
	}

	paymentService := service.NewPaymentService()
	subscription, err := paymentService.GetSubscription(subscriptionID)
	if err != nil {
		c.JSON(500, gin.H{
			"success": false,
			"message": "Failed to get subscription",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    subscription,
	})
}

// 取消订阅
func cancelSubscription(c *gin.Context) {
	subscriptionID := c.Param("id")
	if subscriptionID == "" {
		c.JSON(400, gin.H{
			"success": false,
			"message": "subscription ID is required",
		})
		return
	}

	paymentService := service.NewPaymentService()
	response, err := paymentService.CancelSubscription(subscriptionID)
	if err != nil {
		c.JSON(500, gin.H{
			"success": false,
			"message": "Failed to cancel subscription",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, response)
}

// ================= Refund Handlers =================

// 创建退款
func createRefund(c *gin.Context) {
	var req models.RefundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{
			"success": false,
			"message": "Invalid request parameters",
			"error":   err.Error(),
		})
		return
	}

	paymentService := service.NewPaymentService()
	response, err := paymentService.CreateRefund(&req)
	if err != nil {
		c.JSON(500, gin.H{
			"success": false,
			"message": "Failed to create refund",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, response)
}

// 获取退款详情
func getRefund(c *gin.Context) {
	refundID := c.Param("id")
	if refundID == "" {
		c.JSON(400, gin.H{
			"success": false,
			"message": "refund ID is required",
		})
		return
	}

	paymentService := service.NewPaymentService()
	refund, err := paymentService.GetRefund(refundID)
	if err != nil {
		c.JSON(500, gin.H{
			"success": false,
			"message": "Failed to get refund",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    refund,
	})
}

// ================= Demo Recording Handlers =================

// 列出演示录制
func listRecordings(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	recordings, err := database.ListRecordings(limit, offset)
	if err != nil {
		c.JSON(500, gin.H{
			"success": false,
			"message": "Failed to list recordings",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    recordings,
	})
}

// 保存演示录制
func saveRecording(c *gin.Context) {
	var req struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		Steps       []database.Step `json:"steps"`
		Duration    int64  `json:"duration"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{
			"success": false,
			"message": "Invalid request parameters",
			"error":   err.Error(),
		})
		return
	}

	// Generate ID if not provided
	if req.ID == "" {
		req.ID = "rec_" + strconv.FormatInt(time.Now().UnixNano(), 36)
	}

	recording := &database.DemoRecording{
		ID:          req.ID,
		Name:        req.Name,
		Description: req.Description,
		Steps:       req.Steps,
		Duration:    req.Duration,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := database.SaveRecording(recording); err != nil {
		c.JSON(500, gin.H{
			"success": false,
			"message": "Failed to save recording",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    recording,
	})
}

// 获取演示录制详情
func getRecording(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(400, gin.H{
			"success": false,
			"message": "Recording ID is required",
		})
		return
	}

	recording, err := database.GetRecording(id)
	if err != nil {
		c.JSON(404, gin.H{
			"success": false,
			"message": "Recording not found",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    recording,
	})
}

// 删除演示录制
func deleteRecording(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(400, gin.H{
			"success": false,
			"message": "Recording ID is required",
		})
		return
	}

	if err := database.DeleteRecording(id); err != nil {
		c.JSON(500, gin.H{
			"success": false,
			"message": "Failed to delete recording",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "Recording deleted successfully",
	})
}
