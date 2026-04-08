package api

import (
	"encoding/json"
	"log"
	"payment-demo/config"
	"payment-demo/internal/models"
	"payment-demo/internal/service"
	"payment-demo/internal/storage"
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

		// 订阅套餐
		v1.GET("/subscription-plans", getSubscriptionPlans)

		// 支付相关
		payment := v1.Group("/payment")
		{
			payment.POST("/interaction", createInteraction)
			payment.POST("/direct", createDirectPayment)
			payment.POST("/recurring", createRecurringPayment)
			payment.POST("/webhook", handleWebhook)
			payment.GET("/:merchantTransId", getPaymentStatus)
		}

		// 交互状态查询（用于LinkPay和Drop-in）
		interaction := v1.Group("/interaction")
		{
			interaction.GET("/:merchantOrderId", getInteractionStatus)
		}

		// Token相关
		v1.GET("/tokens/:userReference", getTokenByReference)

		// 开发者模式 - API日志
		v1.GET("/dev-logs/:sessionId", getApiLogs)
		v1.DELETE("/dev-logs/:sessionId", clearApiLogs)
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

	log.Printf("[createInteraction] 收到请求, merchantTransID: %s", req.MerchantTransID)

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

	log.Printf("[createDirectPayment] 收到请求, merchantTransID: %s", req.MerchantTransID)

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
	startTime := time.Now()

	// 打印收到异步通知的日志
	log.Println("==================================================")
	log.Println("收到Evonet异步通知")
	log.Println("==================================================")

	// 收集请求头
	reqHeaders := make(map[string]string)
	for key, values := range c.Request.Header {
		if len(values) > 0 {
			reqHeaders[key] = values[0]
		}
	}

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
		c.String(200, "SUCCESS")
		return
	}

	// 打印请求体
	log.Println("\n[Webhook Body]")
	log.Printf("%s", body)
	log.Println("==================================================")

	// 解析请求体为通用map以提取信息
	var rawNotification map[string]interface{}
	var sessionId string // 用于记录日志的会话ID
	var reqBody interface{}

	if err := json.Unmarshal(body, &rawNotification); err != nil {
		log.Printf("[Webhook] 解析请求体失败: %v", err)
	} else {
		reqBody = rawNotification

		// 尝试提取merchantTransId或merchantOrderID作为sessionId
		if payment, ok := rawNotification["payment"].(map[string]interface{}); ok {
			// Direct API: merchantTransInfo.merchantTransID
			if merchantTransInfo, ok := payment["merchantTransInfo"].(map[string]interface{}); ok {
				if transId, ok := merchantTransInfo["merchantTransID"].(string); ok {
					sessionId = transId
					log.Printf("[Webhook] 从merchantTransInfo提取sessionId: %s", sessionId)
				}
			}
			// LinkPay/Drop-in: merchantOrderInfo.merchantOrderID
			if merchantOrderInfo, ok := payment["merchantOrderInfo"].(map[string]interface{}); ok {
				if orderId, ok := merchantOrderInfo["merchantOrderID"].(string); ok {
					sessionId = orderId
					log.Printf("[Webhook] 从merchantOrderInfo提取sessionId: %s", sessionId)
				}
			}

			// 提取userReference
			var userReference string
			if userInfo, ok := payment["userInfo"].(map[string]interface{}); ok {
				if ref, ok := userInfo["reference"].(string); ok {
					userReference = ref
					log.Printf("[Webhook] UserReference: %s", userReference)
				}
			}

			// 提取token
			if paymentMethod, ok := payment["paymentMethod"].(map[string]interface{}); ok {
				if token, ok := paymentMethod["token"].(map[string]interface{}); ok {
					if tokenValue, ok := token["value"].(string); ok {
						log.Printf("[Webhook] Token: %s", tokenValue)

						// 保存token到存储
						if userReference != "" {
							tokenStore := storage.GetTokenStore()
							tokenStore.SaveToken(userReference, tokenValue)
							log.Printf("[Webhook] Token已保存 - UserReference: %s, Token: %s", userReference, tokenValue)
						}
					}
				}
			}
		}

		// 从merchantOrderInfo中提取（LinkPay/Drop-in结构）
		if merchantOrderInfo, ok := rawNotification["merchantOrderInfo"].(map[string]interface{}); ok {
			if orderId, ok := merchantOrderInfo["merchantOrderID"].(string); ok {
				if sessionId == "" {
					sessionId = orderId
					log.Printf("[Webhook] 从顶层merchantOrderInfo提取sessionId: %s", sessionId)
				}
			}
		}
	}

	// 记录webhook请求日志到session store
	if sessionId != "" {
		sessionStore := storage.GetPaymentSessionStore()
		sessionStore.AddLog(sessionId, storage.ApiLogEntry{
			ID:        storage.GenerateLogID(),
			Timestamp: startTime.Format(time.RFC3339),
			Type:      "request",
			ApiName:   "webhook (from Evonet)",
			Method:    "POST",
			URL:       "/api/v1/payment/webhook",
			Headers:   reqHeaders,
			Body:      reqBody,
		})
	}

	// 无论处理结果如何，都返回SUCCESS确认收到通知
	log.Println("[Webhook] 处理完成，返回SUCCESS")
	log.Println("==================================================")

	// 记录webhook响应日志到session store
	if sessionId != "" {
		sessionStore := storage.GetPaymentSessionStore()
		duration := time.Since(startTime).Milliseconds()
		sessionStore.AddLog(sessionId, storage.ApiLogEntry{
			ID:        storage.GenerateLogID(),
			Timestamp: time.Now().Format(time.RFC3339),
			Type:      "response",
			ApiName:   "webhook (to Evonet)",
			Method:    "POST",
			URL:       "/api/v1/payment/webhook",
			Status:    200,
			Duration:  duration,
			Body:      "SUCCESS",
		})
	}

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

// getSubscriptionPlans 获取订阅套餐列表
func getSubscriptionPlans(c *gin.Context) {
	// 获取用户选择的币种（从查询参数）
	currency := c.Query("currency")
	if currency == "" {
		currency = "USD"
	}

	plans := []models.SubscriptionPlan{
		{
			ID:          "basic",
			Name:        "Basic Plan",
			Price:       1,
			Currency:    currency,
			Interval:    "monthly",
			Description: "Basic subscription with essential features",
		},
		{
			ID:          "premium",
			Name:        "Premium Plan",
			Price:       10,
			Currency:    currency,
			Interval:    "monthly",
			Description: "Premium subscription with advanced features",
		},
		{
			ID:          "enterprise",
			Name:        "Enterprise Plan",
			Price:       100,
			Currency:    currency,
			Interval:    "monthly",
			Description: "Enterprise subscription with unlimited access",
		},
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    plans,
	})
}

// createRecurringPayment 创建后续订阅支付
func createRecurringPayment(c *gin.Context) {
	var req models.RecurringPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{
			"success": false,
			"message": "Invalid request parameters",
			"error":   err.Error(),
		})
		return
	}

	paymentService := service.NewPaymentService()
	response, err := paymentService.CreateRecurringPayment(&req)
	if err != nil {
		c.JSON(500, gin.H{
			"success": false,
			"message": "Failed to create recurring payment",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, response)
}

// getTokenByReference 根据userReference获取保存的token
func getTokenByReference(c *gin.Context) {
	userReference := c.Param("userReference")
	if userReference == "" {
		c.JSON(400, gin.H{
			"success": false,
			"message": "userReference is required",
		})
		return
	}

	tokenStore := storage.GetTokenStore()
	token := tokenStore.GetToken(userReference)

	if token == nil {
		c.JSON(404, gin.H{
			"success": false,
			"message": "Token not found for the given userReference",
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    token,
	})
}

// getApiLogs 获取API日志
func getApiLogs(c *gin.Context) {
	sessionId := c.Param("sessionId")
	log.Printf("[getApiLogs] 收到请求, sessionId: %s", sessionId)

	if sessionId == "" {
		c.JSON(400, gin.H{
			"success": false,
			"message": "sessionId is required",
		})
		return
	}

	sessionStore := storage.GetPaymentSessionStore()
	logs := sessionStore.GetLogs(sessionId)
	log.Printf("[getApiLogs] 返回日志数量: %d, sessionId: %s", len(logs), sessionId)

	c.JSON(200, gin.H{
		"success": true,
		"data":    logs,
	})
}

// clearApiLogs 清除API日志
func clearApiLogs(c *gin.Context) {
	sessionId := c.Param("sessionId")
	if sessionId == "" {
		c.JSON(400, gin.H{
			"success": false,
			"message": "sessionId is required",
		})
		return
	}

	sessionStore := storage.GetPaymentSessionStore()
	sessionStore.ClearLogs(sessionId)

	c.JSON(200, gin.H{
		"success": true,
		"message": "Logs cleared",
	})
}