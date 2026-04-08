package service

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/tls"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"payment-demo/config"
	"payment-demo/internal/models"
	"payment-demo/internal/storage"
	"payment-demo/internal/utils"
	"strconv"
	"strings"
	"time"
)

type PaymentService struct {
	config *config.Config
	client *http.Client
}

// validatePaymentConfig 验证支付服务所需的配置
func validatePaymentConfig(cfg *config.Config) error {
	currentConfig := cfg.GetCurrentEvonetConfig()
	if currentConfig.KeyID == "" {
		return errors.New("Evonet KeyID is required for payment service")
	}
	if currentConfig.SignKey == "" {
		return errors.New("Evonet SignKey is required for payment service")
	}
	if currentConfig.APIURL == "" {
		return errors.New("Evonet API URL is required for payment service")
	}
	return nil
}

func NewPaymentService() *PaymentService {
	cfg := config.Load()

	// 再次验证配置（双重保险）
	if err := validatePaymentConfig(cfg); err != nil {
		log.Fatalf("Payment service configuration validation failed: %v", err)
	}

	// 创建HTTP客户端，根据环境配置SSL验证
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// 如果是Sandbox环境，禁用SSL证书验证（处理证书不匹配问题）
	if cfg.CurrentAPIEnv == config.Sandbox {
		client.Transport = &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		}
	}

	return &PaymentService{
		config: cfg,
		client: client,
	}
}

// 创建支付交互（LinkPay和Drop-in）
func (s *PaymentService) CreateInteraction(req *models.PaymentRequest) (*models.PaymentResponse, error) {

	// 构建Evonet API请求
	// 根据Evonet API文档的标准格式
	evonetReq := map[string]interface{}{
		"validTime": 43200, // 12小时有效期
		"returnUrl": req.ReturnURL, // 使用正确的驼峰命名
		"webhook":   req.WebhookURL,
		"transAmount": map[string]interface{}{
			"currency": req.Currency,
			"value":    fmt.Sprintf("%.0f", req.Amount),
		},
		"merchantOrderInfo": map[string]interface{}{
			"merchantOrderID":   req.MerchantTransID,
			"merchantOrderTime": time.Now().Format("2006-01-02T15:04:05+08:00"),
		},
	}

	// 如果指定了支付方式，添加到请求中
	if req.PaymentMethod != "" {
		evonetReq["merchantOrderInfo"].(map[string]interface{})["enabledPaymentMethod"] = []string{req.PaymentMethod}
	}

	// 添加基本的交易信息
	evonetReq["tradeInfo"] = map[string]interface{}{
		"tradeType":      "Others",
		"totalQuantity":   1,
		"goodsName":       "Demo Product",
		"goodsDescription": "Demo goods description",
	}

	// 订阅支付额外参数
	if req.IsRecurring {
		evonetReq["userInfo"] = map[string]interface{}{
			"reference": req.UserReference,
		}
		evonetReq["paymentMethod"] = map[string]interface{}{
			"recurringProcessingModel": "Subscription",
		}
		fmt.Printf("[CreateInteraction] 订阅模式启用 - UserReference: %s\n", req.UserReference)
	}

	// 发送请求到Evonet
	resp, err := s.sendEvonetRequest("POST", "/interaction", evonetReq, req.MerchantTransID)
	if err != nil {
		// 添加详细的错误日志
		fmt.Printf("Interaction API Error: %v\n", err)
		fmt.Printf("Request data: %+v\n", evonetReq)
		return nil, fmt.Errorf("failed to send request to Evonet: %w", err)
	}

	var evonetResp models.EvonetInteractionResponse
	if err := json.Unmarshal(resp, &evonetResp); err != nil {
		// 添加详细的响应日志
		fmt.Printf("Failed to parse Evonet response: %v\n", err)
		fmt.Printf("Raw response: %s\n", string(resp))
		return nil, fmt.Errorf("failed to parse Evonet response: %w", err)
	}

	// 打印成功响应的日志
	fmt.Printf("Evonet response parsed successfully: %+v\n", evonetResp)

	// 构建响应
	response := &models.PaymentResponse{
		Success:         evonetResp.Result.Code == "S0000",
		SessionID:       evonetResp.SessionID,
		LinkURL:         evonetResp.LinkURL,
		MerchantTransID: req.MerchantTransID,
		Status:          "pending",
		Message:         evonetResp.Result.Message,
	}

	return response, nil
}

// 创建直接支付（Direct API）
func (s *PaymentService) CreateDirectPayment(req *models.PaymentRequest) (*models.PaymentResponse, error) {
	if req.CardInfo == nil {
		return nil, fmt.Errorf("card information is required for direct payment")
	}

	// 构建Evonet Direct API请求
	evonetReq := map[string]interface{}{
		"merchantTransInfo": map[string]interface{}{
			"merchantTransID":   req.MerchantTransID,
			"merchantTransTime": time.Now().Format("2006-01-02T15:04:05+08:00"),
		},
		"transAmount": map[string]interface{}{
			"currency": req.Currency,
			"value":    fmt.Sprintf("%.0f", req.Amount),
		},
		"paymentMethod": map[string]interface{}{
			"type": "card",
			"card": map[string]interface{}{
				"cardInfo": map[string]interface{}{
					"cardNumber": req.CardInfo.CardNumber,
					"expiryDate": req.CardInfo.ExpiryDate,
					"cvv": req.CardInfo.CVV,
					"holderName": req.CardInfo.HolderName,
				},
			},
		},
		"captureAfterHours":   "0",
		"allowAuthentication": true,
		"returnURL":           req.ReturnURL,
		"webhook":             req.WebhookURL,
	}

	// 订阅支付额外参数
	if req.IsRecurring {
		evonetReq["userInfo"] = map[string]interface{}{
			"reference": req.UserReference,
		}
		// 对于订阅支付，需要在paymentMethod中添加recurringProcessingModel
		pm := evonetReq["paymentMethod"].(map[string]interface{})
		pm["recurringProcessingModel"] = "Subscription"
		fmt.Printf("[CreateDirectPayment] 订阅模式启用 - UserReference: %s\n", req.UserReference)
	}

	// 发送请求到Evonet
	resp, err := s.sendEvonetRequest("POST", "/payment", evonetReq, req.MerchantTransID)
	if err != nil {
		return nil, fmt.Errorf("failed to send request to Evonet: %w", err)
	}

	var evonetResp models.EvonetPaymentResponse
	if err := json.Unmarshal(resp, &evonetResp); err != nil {
		return nil, fmt.Errorf("failed to parse Evonet response: %w", err)
	}

	// 构建响应
	response := &models.PaymentResponse{
		Success:         evonetResp.Result.Code[0] == 'S',
		MerchantTransID: evonetResp.Payment.MerchantTransInfo.MerchantTransID,
		Status:          evonetResp.Payment.Status,
		Message:         evonetResp.Result.Message,
	}

	// 处理需要额外操作的情况（如3DS重定向）
	if evonetResp.Action != nil {
		response.Action = &models.ActionInfo{
			Type: evonetResp.Action.Type,
			Data: make(map[string]interface{}),
		}

		if evonetResp.Action.ThreeDSData != nil {
			response.Action.Data["threeDSData"] = evonetResp.Action.ThreeDSData
		}
		if evonetResp.Action.RedirectData != nil {
			response.Action.Data["redirectData"] = evonetResp.Action.RedirectData
		}
	}

	return response, nil
}

// GetPaymentStatus 获取支付状态
func (s *PaymentService) GetPaymentStatus(merchantTransID string) (*models.Payment, error) {
	// 调用Evonet API查询状态
	return s.queryRealPaymentStatus(merchantTransID)
}

// GetInteractionStatus 获取交互状态（用于LinkPay和Drop-in）
func (s *PaymentService) GetInteractionStatus(merchantOrderID string) (*models.Payment, error) {
	// 调用Evonet API查询交互状态
	return s.queryRealInteractionStatus(merchantOrderID)
}

// queryRealPaymentStatus 查询真实支付状态（Direct API）
func (s *PaymentService) queryRealPaymentStatus(merchantTransID string) (*models.Payment, error) {
	// 发送查询请求到Evonet
	fmt.Printf("[PaymentService] 查询Direct API支付状态 - merchantTransID: %s\n", merchantTransID)
	resp, err := s.sendEvonetRequest("GET", fmt.Sprintf("/payment/%s", merchantTransID), nil, merchantTransID)
	if err != nil {
		fmt.Printf("[PaymentService] Direct API查询失败: %v\n", err)
		return nil, fmt.Errorf("failed to get payment status: %w", err)
	}

	fmt.Printf("[PaymentService] Direct API查询响应: %s\n", string(resp))

	// 使用通用map解析响应，以便提取token
	var rawResponse map[string]interface{}
	if err := json.Unmarshal(resp, &rawResponse); err != nil {
		fmt.Printf("[PaymentService] 解析响应失败: %v\n", err)
		return nil, fmt.Errorf("failed to parse payment status response: %w", err)
	}

	// 检查API响应结果
	result, _ := rawResponse["result"].(map[string]interface{})
	category, _ := result["category"].(string)
	code, _ := result["code"].(string)

	if category == "E" {
		fmt.Printf("[PaymentService] API返回错误 - Code: %s\n", code)

		// 如果订单不存在，返回未知状态而不是错误
		if code == "C0004" {
			return &models.Payment{
				MerchantTransID: merchantTransID,
				Status:          "unknown",
				Amount:          0,
				Currency:        "USD",
				CreatedAt:       time.Now(),
			}, nil
		}

		message, _ := result["message"].(string)
		return nil, fmt.Errorf("API error: %s - %s", code, message)
	}

	// 提取支付信息
	payment, _ := rawResponse["payment"].(map[string]interface{})
	merchantTransInfo, _ := payment["merchantTransInfo"].(map[string]interface{})
	retMerchantTransID, _ := merchantTransInfo["merchantTransID"].(string)
	status, _ := payment["status"].(string)
	amount, _ := payment["amount"].(float64)
	currency, _ := payment["currency"].(string)

	// 提取token和userReference
	var tokenValue, userReference string
	if paymentMethod, ok := payment["paymentMethod"].(map[string]interface{}); ok {
		if token, ok := paymentMethod["token"].(map[string]interface{}); ok {
			tokenValue, _ = token["value"].(string)
			fmt.Printf("[PaymentService] 从查询响应中提取到Token: %s\n", tokenValue)
		}
	}
	if userInfo, ok := payment["userInfo"].(map[string]interface{}); ok {
		userReference, _ = userInfo["reference"].(string)
	}

	// 如果有token，保存到存储
	if tokenValue != "" && userReference != "" {
		storage.GetTokenStore().SaveToken(userReference, tokenValue)
		fmt.Printf("[PaymentService] Token已保存 - UserReference: %s, Token: %s\n", userReference, tokenValue)
	}

	// 转换为标准Payment结构
	return &models.Payment{
		MerchantTransID: retMerchantTransID,
		Status:          s.normalizeStatus(status),
		Amount:          amount,
		Currency:        currency,
		CreatedAt:       time.Now(),
		TokenValue:      tokenValue,
		UserReference:   userReference,
	}, nil
}

// queryRealInteractionStatus 查询真实交互状态（LinkPay和Drop-in）
func (s *PaymentService) queryRealInteractionStatus(merchantOrderID string) (*models.Payment, error) {
	// 发送查询请求到Evonet
	fmt.Printf("[PaymentService] 查询Interaction状态 - merchantOrderID: %s\n", merchantOrderID)
	resp, err := s.sendEvonetRequest("GET", fmt.Sprintf("/interaction/%s", merchantOrderID), nil, merchantOrderID)
	if err != nil {
		fmt.Printf("[PaymentService] Interaction查询失败: %v\n", err)
		return nil, fmt.Errorf("failed to get interaction status: %w", err)
	}

	fmt.Printf("[PaymentService] Interaction查询响应: %s\n", string(resp))

	// 使用通用map解析响应，以便提取token
	var rawResponse map[string]interface{}
	if err := json.Unmarshal(resp, &rawResponse); err != nil {
		fmt.Printf("[PaymentService] 解析交互响应失败: %v\n", err)
		return nil, fmt.Errorf("failed to parse interaction status response: %w", err)
	}

	// 打印整个响应结构的层级，帮助调试token位置
	fmt.Printf("[PaymentService] 响应结构层级:\n")
	printMapStructure(rawResponse, 0)

	// 检查API响应结果
	result, _ := rawResponse["result"].(map[string]interface{})
	category, _ := result["category"].(string)
	code, _ := result["code"].(string)

	if category == "E" {
		fmt.Printf("[PaymentService] 交互API返回错误 - Code: %s\n", code)

		// 如果订单不存在，返回未知状态而不是错误
		if code == "C0004" {
			return &models.Payment{
				MerchantTransID: merchantOrderID,
				Status:          "unknown",
				Amount:          0,
				Currency:        "USD",
				CreatedAt:       time.Now(),
			}, nil
		}

		message, _ := result["message"].(string)
		return nil, fmt.Errorf("API error: %s - %s", code, message)
	}

	// 提取订单信息
	merchantOrderInfo, _ := rawResponse["merchantOrderInfo"].(map[string]interface{})
	retMerchantOrderID, _ := merchantOrderInfo["merchantOrderID"].(string)

	// 提取交易信息
	transactionInfo, _ := rawResponse["transactionInfo"].(map[string]interface{})
	transAmount, _ := transactionInfo["transAmount"].(map[string]interface{})
	currency, _ := transAmount["currency"].(string)
	valueStr, _ := transAmount["value"].(string)
	status, _ := transactionInfo["status"].(string)

	if status == "" {
		status, _ = merchantOrderInfo["status"].(string)
	}

	// 解析金额
	var amount float64
	if valueStr != "" {
		if parsedAmount, err := strconv.ParseFloat(valueStr, 64); err == nil {
			amount = parsedAmount
		}
	}

	// 提取token和userReference - 根据实际API响应结构
	// token在 rawResponse["paymentMethod"]["token"] 中
	var tokenValue, userReference string

	if paymentMethod, ok := rawResponse["paymentMethod"].(map[string]interface{}); ok {
		fmt.Printf("[PaymentService] 找到 paymentMethod 字段\n")
		if token, ok := paymentMethod["token"].(map[string]interface{}); ok {
			fmt.Printf("[PaymentService] 找到 paymentMethod.token\n")
			tokenValue, _ = token["value"].(string)
			if tokenValue != "" {
				fmt.Printf("[PaymentService] 从 paymentMethod.token.value 提取到Token: %s\n", tokenValue)
			}
			// userReference也在token对象中
			userReference, _ = token["userReference"].(string)
			if userReference != "" {
				fmt.Printf("[PaymentService] 从 paymentMethod.token.userReference 提取到UserReference: %s\n", userReference)
			}
		}
	}

	// 如果有token，保存到存储
	if tokenValue != "" && userReference != "" {
		storage.GetTokenStore().SaveToken(userReference, tokenValue)
		fmt.Printf("[PaymentService] Token已保存 - UserReference: %s, Token: %s\n", userReference, tokenValue)
	}

	return &models.Payment{
		MerchantTransID: retMerchantOrderID,
		Status:          s.normalizeStatus(status),
		Amount:          amount,
		Currency:        currency,
		CreatedAt:       time.Now(),
		TokenValue:      tokenValue,
		UserReference:   userReference,
	}, nil
}

// printMapStructure 打印map结构帮助调试
func printMapStructure(m map[string]interface{}, depth int) {
	for key, value := range m {
		indent := ""
		for i := 0; i < depth; i++ {
			indent += "  "
		}
		if nested, ok := value.(map[string]interface{}); ok {
			fmt.Printf("%s%s: (map)\n", indent, key)
			printMapStructure(nested, depth+1)
		} else if arr, ok := value.([]interface{}); ok {
			fmt.Printf("%s%s: (array, len=%d)\n", indent, key, len(arr))
		} else {
			fmt.Printf("%s%s: %v\n", indent, key, value)
		}
	}
}

// normalizeStatus 标准化状态名称
func (s *PaymentService) normalizeStatus(status string) string {
	// 将不同的状态名称标准化为一致的格式
	switch strings.ToLower(status) {
	case "success", "completed", "paid", "captured":
		return "captured"
	case "pending", "processing", "authorized":
		return "pending"
	case "failed", "declined", "rejected", "error":
		return "failed"
	case "cancelled", "canceled", "voided":
		return "cancelled"
	default:
		return status // 保持原状态
	}
}

// CreateRecurringPayment 创建后续订阅支付（使用token）
func (s *PaymentService) CreateRecurringPayment(req *models.RecurringPaymentRequest) (*models.PaymentResponse, error) {
	// 构建Evonet后续订阅支付请求
	evonetReq := map[string]interface{}{
		"merchantTransInfo": map[string]interface{}{
			"merchantTransID":   req.MerchantTransID,
			"merchantTransTime": time.Now().Format("2006-01-02T15:04:05+08:00"),
		},
		"transAmount": map[string]interface{}{
			"currency": req.Currency,
			"value":    fmt.Sprintf("%.0f", req.Amount),
		},
		"allowAuthentication": false, // Token支付不需要3DS认证
		"captureAfterHours":   "0",
		"returnURL":           req.ReturnURL,
		"paymentMethod": map[string]interface{}{
			"type": "token", // 使用token支付时type应为token
			"token": map[string]interface{}{
				"value": req.TokenValue,
			},
			"recurringProcessingModel": "Subscription",
		},
		"webhook": req.WebhookURL,
	}

	fmt.Printf("[CreateRecurringPayment] 发起后续订阅支付 - Token: %s, Amount: %.0f %s\n", req.TokenValue, req.Amount, req.Currency)

	// 发送请求到Evonet
	resp, err := s.sendEvonetRequest("POST", "/payment", evonetReq, req.MerchantTransID)
	if err != nil {
		return nil, fmt.Errorf("failed to send recurring payment request: %w", err)
	}

	fmt.Printf("[CreateRecurringPayment] Evonet响应: %s\n", string(resp))

	// 使用通用map解析响应
	var rawResponse map[string]interface{}
	if err := json.Unmarshal(resp, &rawResponse); err != nil {
		return nil, fmt.Errorf("failed to parse Evonet response: %w", err)
	}

	// 检查API响应结果
	result, _ := rawResponse["result"].(map[string]interface{})
	category, _ := result["category"].(string)
	code, _ := result["code"].(string)
	message, _ := result["message"].(string)

	// 构建响应
	response := &models.PaymentResponse{
		Success: category != "E" && (code == "" || code[0] == 'S'),
		Message: message,
	}

	// 如果是错误响应，直接返回
	if category == "E" {
		response.Success = false
		return response, nil
	}

	// 提取支付信息
	if payment, ok := rawResponse["payment"].(map[string]interface{}); ok {
		if merchantTransInfo, ok := payment["merchantTransInfo"].(map[string]interface{}); ok {
			response.MerchantTransID, _ = merchantTransInfo["merchantTransID"].(string)
		}
		response.Status, _ = payment["status"].(string)
	}

	// 处理需要额外操作的情况（如重定向）
	if action, ok := rawResponse["action"].(map[string]interface{}); ok {
		actionType, _ := action["type"].(string)
		response.Action = &models.ActionInfo{
			Type: actionType,
			Data: make(map[string]interface{}),
		}

		if threeDSData, ok := action["threeDSData"].(map[string]interface{}); ok {
			response.Action.Data["threeDSData"] = threeDSData
		}
		if redirectData, ok := action["redirectData"].(map[string]interface{}); ok {
			response.Action.Data["redirectData"] = redirectData
		}
	}

	return response, nil
}

// 发送请求到Evonet API
func (s *PaymentService) sendEvonetRequest(method, endpoint string, data interface{}, sessionId string) ([]byte, error) {
	// 获取当前环境的配置
	currentConfig := s.config.GetCurrentEvonetConfig()
	// 使用原始端点，不添加额外前缀
	url := currentConfig.APIURL + endpoint
	fmt.Printf("[sendEvonetRequest] %s %s (使用%s环境), sessionId: %s\n", method, url, s.config.GetAPIMode(), sessionId)

	startTime := time.Now()

	var body []byte
	if data != nil {
		var err error
		body, err = json.Marshal(data)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request data: %w", err)
		}
		fmt.Printf("[sendEvonetRequest] Request Body: %s\n", string(body))
	}

	req, err := http.NewRequest(method, url, bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// 设置请求头
	dateTime := time.Now().Format("2006-01-02T15:04:05+08:00")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("DateTime", dateTime)
	req.Header.Set("KeyID", currentConfig.KeyID)
	req.Header.Set("SignType", "Key-based")

	// 生成MsgID
	msgID := utils.GenerateMsgID()
	req.Header.Set("MsgID", msgID)

	fmt.Printf("[sendEvonetRequest] Headers - KeyID: %s, DateTime: %s, MsgID: %s\n", currentConfig.KeyID, dateTime, msgID)

	// 生成签名
	if currentConfig.SignKey != "" {
		req.Header.Set("Authorization", currentConfig.SignKey)
		fmt.Printf("[sendEvonetRequest] Authorization: %s\n", currentConfig.SignKey)
	}

	// 生成幂等性密钥
	idempotencyKey := utils.GenerateIdempotencyKey()
	req.Header.Set("Idempotency-Key", idempotencyKey)
	fmt.Printf("[sendEvonetRequest] Idempotency-Key: %s\n", idempotencyKey)

	// 记录请求日志
	if sessionId != "" {
		var reqBody interface{}
		if len(body) > 0 {
			json.Unmarshal(body, &reqBody)
		}
		reqHeaders := make(map[string]string)
		for k, v := range req.Header {
			if len(v) > 0 {
				reqHeaders[k] = v[0]
			}
		}
		storage.GetPaymentSessionStore().AddLog(sessionId, storage.ApiLogEntry{
			ID:        storage.GenerateLogID(),
			Timestamp: time.Now().Format(time.RFC3339),
			Type:      "request",
			ApiName:   endpoint,
			Method:    method,
			URL:       url,
			Headers:   reqHeaders,
			Body:      reqBody,
		})
	}

	// 发送请求
	resp, err := s.client.Do(req)
	if err != nil {
		fmt.Printf("[sendEvonetRequest] Request failed: %v\n", err)
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	fmt.Printf("[sendEvonetRequest] Response Status: %d %s\n", resp.StatusCode, resp.Status)

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("[sendEvonetRequest] Failed to read response: %v\n", err)
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	fmt.Printf("[sendEvonetRequest] Response Body: %s\n", string(responseBody))

	// 记录响应日志
	if sessionId != "" {
		var respBody interface{}
		if len(responseBody) > 0 {
			json.Unmarshal(responseBody, &respBody)
		}
		duration := time.Since(startTime).Milliseconds()
		storage.GetPaymentSessionStore().AddLog(sessionId, storage.ApiLogEntry{
			ID:        storage.GenerateLogID(),
			Timestamp: time.Now().Format(time.RFC3339),
			Type:      "response",
			ApiName:   endpoint,
			Method:    method,
			URL:       url,
			Status:    resp.StatusCode,
			Duration:  duration,
			Body:      respBody,
		})
	}

	if resp.StatusCode >= 400 {
		fmt.Printf("[sendEvonetRequest] API Error - Status: %d, Body: %s\n", resp.StatusCode, string(responseBody))
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(responseBody))
	}

	return responseBody, nil
}

// 生成HMAC签名
func (s *PaymentService) generateSignature(method, endpoint, body, dateTime string) string {
	currentConfig := s.config.GetCurrentEvonetConfig()
	message := method + endpoint + body + dateTime
	h := hmac.New(sha256.New, []byte(currentConfig.SignKey))
	h.Write([]byte(message))
	signature := hex.EncodeToString(h.Sum(nil))
	return "sk_" + s.config.Environment + "_" + signature
}
