package service

import (
	"encoding/json"
	"fmt"
	"payment-demo/internal/models"
	"time"
)

// 预定义的订阅计划
var subscriptionPlans = []models.SubscriptionPlan{
	{
		ID:          "basic",
		Name:        "Basic Plan",
		Description: "Perfect for individuals and small projects",
		Price:       9.99,
		Currency:    "USD",
		Interval:    "monthly",
		Features:    []string{"5 API calls/day", "Email support", "Basic analytics"},
	},
	{
		ID:          "pro",
		Name:        "Pro Plan",
		Description: "Ideal for growing businesses",
		Price:       19.99,
		Currency:    "USD",
		Interval:    "monthly",
		Features:    []string{"100 API calls/day", "Priority support", "Advanced analytics", "Webhook notifications"},
	},
	{
		ID:          "enterprise",
		Name:        "Enterprise Plan",
		Description: "For large-scale operations",
		Price:       49.99,
		Currency:    "USD",
		Interval:    "monthly",
		Features:    []string{"Unlimited API calls", "24/7 dedicated support", "Custom analytics", "SLA guarantee", "Custom integrations"},
	},
}

// GetSubscriptionPlans 获取订阅计划列表
func (s *PaymentService) GetSubscriptionPlans() []models.SubscriptionPlan {
	return subscriptionPlans
}

// CreateSubscription 创建订阅
func (s *PaymentService) CreateSubscription(req *models.SubscriptionRequest) (*models.SubscriptionResponse, error) {
	// 查找订阅计划
	var selectedPlan *models.SubscriptionPlan
	for i := range subscriptionPlans {
		if subscriptionPlans[i].ID == req.PlanID {
			selectedPlan = &subscriptionPlans[i]
			break
		}
	}
	if selectedPlan == nil {
		return nil, fmt.Errorf("invalid plan ID: %s", req.PlanID)
	}

	// 构建 Evonet 订阅请求
	evonetReq := map[string]interface{}{
		"validTime": 43200, // 12小时有效期
		"returnUrl": req.ReturnURL,
		"webhook":   req.WebhookURL,
		"transAmount": map[string]interface{}{
			"currency": selectedPlan.Currency,
			"value":    fmt.Sprintf("%.0f", selectedPlan.Price*100), // 转换为分
		},
		"merchantOrderInfo": map[string]interface{}{
			"merchantOrderID":   req.MerchantTransID,
			"merchantOrderTime": time.Now().Format("2006-01-02T15:04:05+08:00"),
		},
		"tradeInfo": map[string]interface{}{
			"tradeType":        "Subscription",
			"totalQuantity":    1,
			"goodsName":        selectedPlan.Name,
			"goodsDescription": selectedPlan.Description,
		},
	}

	// 发送请求到 Evonet
	resp, err := s.sendEvonetRequest("POST", "/interaction", evonetReq)
	if err != nil {
		fmt.Printf("Subscription API Error: %v\n", err)
		return nil, fmt.Errorf("failed to create subscription: %w", err)
	}

	var evonetResp models.EvonetInteractionResponse
	if err := json.Unmarshal(resp, &evonetResp); err != nil {
		fmt.Printf("Failed to parse Evonet response: %v\n", err)
		return nil, fmt.Errorf("failed to parse Evonet response: %w", err)
	}

	return &models.SubscriptionResponse{
		Success:         evonetResp.Result.Code == "S0000",
		SessionID:       evonetResp.SessionID,
		LinkURL:         evonetResp.LinkURL,
		MerchantTransID: req.MerchantTransID,
		Status:          "pending",
		Message:         evonetResp.Result.Message,
	}, nil
}

// GetSubscription 获取订阅详情
func (s *PaymentService) GetSubscription(subscriptionID string) (*models.Subscription, error) {
	// 查询 Evonet API 获取订阅状态
	resp, err := s.sendEvonetRequest("GET", fmt.Sprintf("/interaction/%s", subscriptionID), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get subscription: %w", err)
	}

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
		return nil, fmt.Errorf("failed to parse subscription response: %w", err)
	}

	// 转换为 Subscription 结构
	return &models.Subscription{
		ID:              subscriptionID,
		MerchantTransID: apiResponse.MerchantOrderInfo.MerchantOrderID,
		Status:          apiResponse.TransactionInfo.Status,
		CreatedAt:       time.Now(),
	}, nil
}

// CancelSubscription 取消订阅
func (s *PaymentService) CancelSubscription(subscriptionID string) (*models.SubscriptionResponse, error) {
	// 在实际应用中，这里应该调用 Evonet 的取消订阅 API
	// 目前返回模拟响应
	return &models.SubscriptionResponse{
		Success:        true,
		SubscriptionID: subscriptionID,
		Status:         "cancelled",
		Message:        "Subscription cancelled successfully",
	}, nil
}

// CreateRefund 创建退款
func (s *PaymentService) CreateRefund(req *models.RefundRequest) (*models.RefundResponse, error) {
	// 构建 Evonet 退款请求
	evonetReq := map[string]interface{}{
		"merchantTransInfo": map[string]interface{}{
			"merchantTransID":   req.RefundTransID,
			"merchantTransTime": time.Now().Format("2006-01-02T15:04:05+08:00"),
			"originalMerchantTransID": req.MerchantTransID,
		},
		"transAmount": map[string]interface{}{
			"currency": req.Currency,
			"value":    fmt.Sprintf("%.0f", req.Amount*100), // 转换为分
		},
		"refundReason": req.Reason,
	}

	// 发送退款请求到 Evonet
	resp, err := s.sendEvonetRequest("POST", "/refund", evonetReq)
	if err != nil {
		fmt.Printf("Refund API Error: %v\n", err)
		return nil, fmt.Errorf("failed to create refund: %w", err)
	}

	var apiResponse struct {
		Result struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"result"`
		Refund struct {
			RefundID string `json:"refundID"`
			Status   string `json:"status"`
			Amount   string `json:"amount"`
			Currency string `json:"currency"`
		} `json:"refund"`
	}

	if err := json.Unmarshal(resp, &apiResponse); err != nil {
		fmt.Printf("Failed to parse refund response: %v\n", err)
		return nil, fmt.Errorf("failed to parse refund response: %w", err)
	}

	return &models.RefundResponse{
		Success:       apiResponse.Result.Code == "S0000",
		RefundID:      apiResponse.Refund.RefundID,
		RefundTransID: req.RefundTransID,
		MerchantTransID: req.MerchantTransID,
		Status:        apiResponse.Refund.Status,
		Message:       apiResponse.Result.Message,
		Amount:        req.Amount,
		Currency:      req.Currency,
	}, nil
}

// GetRefund 获取退款详情
func (s *PaymentService) GetRefund(refundID string) (*models.Refund, error) {
	// 查询 Evonet API 获取退款状态
	resp, err := s.sendEvonetRequest("GET", fmt.Sprintf("/refund/%s", refundID), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get refund: %w", err)
	}

	var apiResponse struct {
		Result struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"result"`
		Refund struct {
			RefundID        string `json:"refundID"`
			MerchantTransID string `json:"merchantTransID"`
			Status          string `json:"status"`
			Amount          string `json:"amount"`
			Currency        string `json:"currency"`
			Reason          string `json:"reason"`
			CreatedAt       string `json:"createdAt"`
		} `json:"refund"`
	}

	if err := json.Unmarshal(resp, &apiResponse); err != nil {
		return nil, fmt.Errorf("failed to parse refund response: %w", err)
	}

	return &models.Refund{
		ID:              apiResponse.Refund.RefundID,
		MerchantTransID: apiResponse.Refund.MerchantTransID,
		RefundTransID:   apiResponse.Refund.RefundID,
		Status:          apiResponse.Refund.Status,
		Currency:        apiResponse.Refund.Currency,
		Reason:          apiResponse.Refund.Reason,
		CreatedAt:       time.Now(),
	}, nil
}