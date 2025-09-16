package service

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"payment-demo/config"
	"payment-demo/internal/models"
	"payment-demo/internal/utils"
	"strconv"
	"strings"
	"time"
)

type PaymentService struct {
	config *config.Config
	client *http.Client
}

func NewPaymentService() *PaymentService {
	return &PaymentService{
		config: config.Load(),
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

// hasAPIKeys 检查是否配置了API密钥
func (s *PaymentService) hasAPIKeys() bool {
	return s.config.EvonetKeyID != "" && s.config.EvonetSignKey != ""
}

// 创建支付交互（LinkPay和Drop-in）
func (s *PaymentService) CreateInteraction(req *models.PaymentRequest) (*models.PaymentResponse, error) {
	// 检查配置
	if s.config.EvonetKeyID == "" || s.config.EvonetSignKey == "" {
		// 为了演示目的，返回模拟响应
		return s.createMockInteractionResponse(req), nil
	}

	// 构建Evonet API请求
	// 根据Evonet API文档的标准格式
	evonetReq := map[string]interface{}{
		"merchantOrderInfo": map[string]interface{}{
			"merchantOrderID": req.MerchantTransID,
		},
		"transAmount": map[string]interface{}{
			"currency": req.Currency,
			"value":    fmt.Sprintf("%.0f", req.Amount),
		},
		"returnURL": req.ReturnURL,
		"webhook":   req.WebhookURL,
	}

	// 如果指定了支付方式，添加到请求中
	if req.PaymentMethod != "" {
		evonetReq["merchantOrderInfo"].(map[string]interface{})["enabledPaymentMethod"] = []string{req.PaymentMethod}
	}

	// 发送请求到Evonet
	resp, err := s.sendEvonetRequest("POST", "/interaction", evonetReq)
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

	// 检查配置
	if s.config.EvonetKeyID == "" || s.config.EvonetSignKey == "" {
		// 为了演示目的，返回模拟响应
		return s.createMockDirectPaymentResponse(req), nil
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
					"holderName": req.CardInfo.HolderName,
				},
			},
		},
		"captureAfterHours":   "0",
		"allowAuthentication": true,
		"returnURL":           req.ReturnURL,
		"webhook":             req.WebhookURL,
	}

	// 发送请求到Evonet
	resp, err := s.sendEvonetRequest("POST", "/payment", evonetReq)
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
	if !s.hasAPIKeys() {
		// 演示模式：返回模拟支付状态
		return s.createMockPaymentStatus(merchantTransID), nil
	}

	// 真实API模式：调用Evonet API查询状态
	return s.queryRealPaymentStatus(merchantTransID)
}

// GetInteractionStatus 获取交互状态（用于LinkPay和Drop-in）
func (s *PaymentService) GetInteractionStatus(merchantOrderID string) (*models.Payment, error) {
	if !s.hasAPIKeys() {
		// 演示模式：返回模拟支付状态
		return s.createMockPaymentStatus(merchantOrderID), nil
	}

	// 真实API模式：调用Evonet API查询交互状态
	return s.queryRealInteractionStatus(merchantOrderID)
}

// queryRealPaymentStatus 查询真实支付状态（Direct API）
func (s *PaymentService) queryRealPaymentStatus(merchantTransID string) (*models.Payment, error) {
	// 发送查询请求到Evonet
	fmt.Printf("[PaymentService] 查询Direct API支付状态 - merchantTransID: %s\n", merchantTransID)
	resp, err := s.sendEvonetRequest("GET", fmt.Sprintf("/payment/%s", merchantTransID), nil)
	if err != nil {
		fmt.Printf("[PaymentService] Direct API查询失败: %v\n", err)
		return nil, fmt.Errorf("failed to get payment status: %w", err)
	}

	fmt.Printf("[PaymentService] Direct API查询响应: %s\n", string(resp))

	// 解析响应
	var apiResponse struct {
		Result struct {
			Code     string `json:"code"`
			Message  string `json:"message"`
			Category string `json:"category"`
		} `json:"result"`
		Payment struct {
			MerchantTransInfo struct {
				MerchantTransID string `json:"merchantTransID"`
			} `json:"merchantTransInfo"`
			Status   string  `json:"status"`
			Amount   float64 `json:"amount"`
			Currency string  `json:"currency"`
		} `json:"payment"`
	}

	if err := json.Unmarshal(resp, &apiResponse); err != nil {
		fmt.Printf("[PaymentService] 解析响应失败: %v\n", err)
		return nil, fmt.Errorf("failed to parse payment status response: %w", err)
	}

	// 检查API响应结果
	if apiResponse.Result.Category == "E" {
		fmt.Printf("[PaymentService] API返回错误 - Code: %s, Message: %s\n", apiResponse.Result.Code, apiResponse.Result.Message)

		// 如果订单不存在，返回未知状态而不是错误
		if apiResponse.Result.Code == "C0004" {
			return &models.Payment{
				MerchantTransID: merchantTransID,
				Status:          "unknown",
				Amount:          0,
				Currency:        "USD",
				CreatedAt:       time.Now(),
			}, nil
		}

		return nil, fmt.Errorf("API error: %s - %s", apiResponse.Result.Code, apiResponse.Result.Message)
	}

	// 转换为标准Payment结构
	return &models.Payment{
		MerchantTransID: apiResponse.Payment.MerchantTransInfo.MerchantTransID,
		Status:          s.normalizeStatus(apiResponse.Payment.Status),
		Amount:          apiResponse.Payment.Amount,
		Currency:        apiResponse.Payment.Currency,
		CreatedAt:       time.Now(), // API可能不返回创建时间，使用当前时间
	}, nil
}

// queryRealInteractionStatus 查询真实交互状态（LinkPay和Drop-in）
func (s *PaymentService) queryRealInteractionStatus(merchantOrderID string) (*models.Payment, error) {
	// 发送查询请求到Evonet
	fmt.Printf("[PaymentService] 查询Interaction状态 - merchantOrderID: %s\n", merchantOrderID)
	resp, err := s.sendEvonetRequest("GET", fmt.Sprintf("/interaction/%s", merchantOrderID), nil)
	if err != nil {
		fmt.Printf("[PaymentService] Interaction查询失败: %v\n", err)
		return nil, fmt.Errorf("failed to get interaction status: %w", err)
	}

	fmt.Printf("[PaymentService] Interaction查询响应: %s\n", string(resp))

	// 解析响应
	var apiResponse struct {
		Result struct {
			Code     string `json:"code"`
			Message  string `json:"message"`
			Category string `json:"category"`
		} `json:"result"`
		MerchantOrderInfo struct {
			MerchantOrderID string `json:"merchantOrderID"`
			Status          string `json:"status"`
		} `json:"merchantOrderInfo"`
		TransactionInfo struct {
			TransAmount struct {
				Currency string `json:"currency"`
				Value    string `json:"value"`
			} `json:"transAmount"`
			Status string `json:"status"`
		} `json:"transactionInfo"`
	}

	if err := json.Unmarshal(resp, &apiResponse); err != nil {
		fmt.Printf("[PaymentService] 解析交互响应失败: %v\n", err)
		return nil, fmt.Errorf("failed to parse interaction status response: %w", err)
	}

	// 检查API响应结果
	if apiResponse.Result.Category == "E" {
		fmt.Printf("[PaymentService] 交互API返回错误 - Code: %s, Message: %s\n", apiResponse.Result.Code, apiResponse.Result.Message)

		// 如果订单不存在，返回未知状态而不是错误
		if apiResponse.Result.Code == "C0004" {
			return &models.Payment{
				MerchantTransID: merchantOrderID,
				Status:          "unknown",
				Amount:          0,
				Currency:        "USD",
				CreatedAt:       time.Now(),
			}, nil
		}

		return nil, fmt.Errorf("API error: %s - %s", apiResponse.Result.Code, apiResponse.Result.Message)
	}

	// 转换为标准Payment结构
	// 解析金额（从字符串转换为float64）
	var amount float64
	if apiResponse.TransactionInfo.TransAmount.Value != "" {
		if parsedAmount, err := strconv.ParseFloat(apiResponse.TransactionInfo.TransAmount.Value, 64); err == nil {
			amount = parsedAmount
		}
	}

	// 使用transactionInfo中的状态，因为它更准确
	status := apiResponse.TransactionInfo.Status
	if status == "" {
		// 如果没有transactionInfo状态，使用merchantOrderInfo状态
		status = apiResponse.MerchantOrderInfo.Status
	}

	return &models.Payment{
		MerchantTransID: apiResponse.MerchantOrderInfo.MerchantOrderID,
		Status:          s.normalizeStatus(status),
		Amount:          amount,
		Currency:        apiResponse.TransactionInfo.TransAmount.Currency,
		CreatedAt:       time.Now(), // API可能不返回创建时间，使用当前时间
	}, nil
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

// 发送请求到Evonet API
func (s *PaymentService) sendEvonetRequest(method, endpoint string, data interface{}) ([]byte, error) {
	url := s.config.EvonetAPIURL + endpoint
	fmt.Printf("[sendEvonetRequest] %s %s\n", method, url)

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
	req.Header.Set("KeyID", s.config.EvonetKeyID)
	req.Header.Set("SignType", "Key-based")

	fmt.Printf("[sendEvonetRequest] Headers - KeyID: %s, DateTime: %s\n", s.config.EvonetKeyID, dateTime)

	// 生成签名
	if s.config.EvonetSignKey != "" {
		req.Header.Set("Authorization", s.config.EvonetSignKey)
		fmt.Printf("[sendEvonetRequest] Authorization: %s\n", s.config.EvonetSignKey)
	}

	// 生成幂等性密钥
	idempotencyKey := utils.GenerateIdempotencyKey()
	req.Header.Set("Idempotency-Key", idempotencyKey)
	fmt.Printf("[sendEvonetRequest] Idempotency-Key: %s\n", idempotencyKey)

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

	if resp.StatusCode >= 400 {
		fmt.Printf("[sendEvonetRequest] API Error - Status: %d, Body: %s\n", resp.StatusCode, string(responseBody))
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(responseBody))
	}

	return responseBody, nil
}

// 生成HMAC签名
func (s *PaymentService) generateSignature(method, endpoint, body, dateTime string) string {
	message := method + endpoint + body + dateTime
	h := hmac.New(sha256.New, []byte(s.config.EvonetSignKey))
	h.Write([]byte(message))
	signature := hex.EncodeToString(h.Sum(nil))
	return "sk_" + s.config.Environment + "_" + signature
}

// 创建模拟交互响应（用于演示）
func (s *PaymentService) createMockInteractionResponse(req *models.PaymentRequest) *models.PaymentResponse {
	sessionID := "demo_session_" + utils.GenerateIdempotencyKey()
	linkURL := ""

	// 如果是 LinkPay，生成模拟链接
	if req.PaymentType == "linkpay" {
		linkURL = "https://demo.linkpay.com/payment?session=" + sessionID
	}

	return &models.PaymentResponse{
		Success:         true,
		SessionID:       sessionID,
		LinkURL:         linkURL,
		MerchantTransID: req.MerchantTransID,
		Status:          "pending",
		Message:         "Demo mode: Payment interaction created successfully",
	}
}

// 创建模拟直接支付响应（用于演示）
func (s *PaymentService) createMockDirectPaymentResponse(req *models.PaymentRequest) *models.PaymentResponse {
	// 模拟成功支付
	return &models.PaymentResponse{
		Success:         true,
		MerchantTransID: req.MerchantTransID,
		Status:          "captured",
		Message:         "Demo mode: Payment completed successfully",
	}
}

// 创建模拟支付状态（用于演示）
func (s *PaymentService) createMockPaymentStatus(merchantTransID string) *models.Payment {
	// 模拟不同的支付状态
	statuses := []string{"captured", "pending", "failed"}
	statusIndex := len(merchantTransID) % len(statuses)
	status := statuses[statusIndex]

	// 为captured状态提供更详细的信息
	if status == "captured" {
		return &models.Payment{
			MerchantTransID: merchantTransID,
			Status:          "captured",
			Amount:          300, // 模拟金额（整数）
			Currency:        "USD",
			CreatedAt:       time.Now().Add(-time.Minute * 5), // 5分钟前创建
		}
	}

	return &models.Payment{
		MerchantTransID: merchantTransID,
		Status:          status,
		Amount:          289.97, // 模拟金额
		Currency:        "USD",
		CreatedAt:       time.Now().Add(-time.Minute * 5), // 5分钟前创建
	}
}
