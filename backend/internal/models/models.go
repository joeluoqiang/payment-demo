package models

import "time"

// 国家和币种配置
type Country struct {
	Code     string `json:"code"`
	Name     string `json:"name"`
	Currency string `json:"currency"`
	Language string `json:"language"`
}

// 支付场景
type PaymentScenario struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Environment string `json:"environment"` // UAT, Production
	Type        string `json:"type"`        // linkpay, dropin, directapi
	Description string `json:"description"`
}

// 支付请求
type PaymentRequest struct {
	Amount          float64 `json:"amount"`
	Currency        string  `json:"currency"`
	MerchantTransID string  `json:"merchantTransId"`
	PaymentType     string  `json:"paymentType"`
	PaymentMethod   string  `json:"paymentMethod,omitempty"`
	ReturnURL       string  `json:"returnUrl"`
	WebhookURL      string  `json:"webhookUrl"`
	
	// 卡片信息（Direct API）
	CardInfo *CardInfo `json:"cardInfo,omitempty"`
}

// 卡片信息
type CardInfo struct {
	CardNumber  string `json:"cardNumber"`
	ExpiryDate  string `json:"expiryDate"`
	CVV         string `json:"cvv"`
	HolderName  string `json:"holderName"`
}

// 支付响应
type PaymentResponse struct {
	Success         bool                   `json:"success"`
	SessionID       string                 `json:"sessionId,omitempty"`
	LinkURL         string                 `json:"linkUrl,omitempty"`
	MerchantTransID string                 `json:"merchantTransId"`
	Status          string                 `json:"status"`
	Message         string                 `json:"message"`
	Data            map[string]interface{} `json:"data,omitempty"`
	Action          *ActionInfo            `json:"action,omitempty"`
}

// 操作信息（用于Direct API的3DS重定向等）
type ActionInfo struct {
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
}

// Webhook通知
type WebhookNotification struct {
	EventCode string    `json:"eventCode"`
	Payment   *Payment  `json:"payment,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// 支付信息
type Payment struct {
	MerchantTransID string    `json:"merchantTransId"`
	Status          string    `json:"status"`
	Amount          float64   `json:"amount"`
	Currency        string    `json:"currency"`
	CreatedAt       time.Time `json:"createdAt"`
}

// Evonet API响应结构
type EvonetInteractionResponse struct {
	SessionID         string                 `json:"sessionID"`
	MerchantOrderInfo map[string]interface{} `json:"merchantOrderInfo"`
	LinkURL           string                 `json:"linkUrl"`
	Result            struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"result"`
}

type EvonetPaymentResponse struct {
	Payment struct {
		MerchantTransInfo struct {
			MerchantTransID string `json:"merchantTransID"`
		} `json:"merchantTransInfo"`
		Status string `json:"status"`
	} `json:"payment"`
	Action *struct {
		Type         string                 `json:"type"`
		ThreeDSData  map[string]interface{} `json:"threeDSData,omitempty"`
		RedirectData map[string]interface{} `json:"redirectData,omitempty"`
	} `json:"action,omitempty"`
	Result struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"result"`
}

// ================= Subscription Models =================

// SubscriptionPlan 订阅计划
type SubscriptionPlan struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Currency    string  `json:"currency"`
	Interval    string  `json:"interval"` // monthly, yearly
	Features    []string `json:"features"`
}

// SubscriptionRequest 订阅请求
type SubscriptionRequest struct {
	PlanID          string `json:"planId"`
	MerchantTransID string `json:"merchantTransId"`
	ReturnURL       string `json:"returnUrl"`
	WebhookURL      string `json:"webhookUrl"`
}

// Subscription 订阅信息
type Subscription struct {
	ID                string    `json:"id"`
	MerchantTransID   string    `json:"merchantTransId"`
	PlanID            string    `json:"planId"`
	Status            string    `json:"status"` // active, cancelled, expired
	CurrentPeriodStart time.Time `json:"currentPeriodStart"`
	CurrentPeriodEnd   time.Time `json:"currentPeriodEnd"`
	Amount            float64   `json:"amount"`
	Currency          string    `json:"currency"`
	CreatedAt         time.Time `json:"createdAt"`
}

// SubscriptionResponse 订阅响应
type SubscriptionResponse struct {
	Success         bool          `json:"success"`
	SessionID       string        `json:"sessionId,omitempty"`
	LinkURL         string        `json:"linkUrl,omitempty"`
	MerchantTransID string        `json:"merchantTransId"`
	SubscriptionID  string        `json:"subscriptionId,omitempty"`
	Status          string        `json:"status"`
	Message         string        `json:"message"`
}

// ================= Refund Models =================

// RefundRequest 退款请求
type RefundRequest struct {
	Amount          float64 `json:"amount"`
	Currency        string  `json:"currency"`
	MerchantTransID string  `json:"merchantTransId"` // Original payment transaction ID
	RefundTransID   string  `json:"refundTransId"`   // New refund transaction ID
	Reason          string  `json:"reason"`
}

// Refund 退款信息
type Refund struct {
	ID              string    `json:"id"`
	MerchantTransID string    `json:"merchantTransId"`
	RefundTransID   string    `json:"refundTransId"`
	OriginalAmount  float64   `json:"originalAmount"`
	RefundAmount    float64   `json:"refundAmount"`
	Currency        string    `json:"currency"`
	Status          string    `json:"status"` // pending, processing, success, failed
	Reason          string    `json:"reason"`
	CreatedAt       time.Time `json:"createdAt"`
}

// RefundResponse 退款响应
type RefundResponse struct {
	Success         bool    `json:"success"`
	RefundID        string  `json:"refundId,omitempty"`
	RefundTransID   string  `json:"refundTransId"`
	MerchantTransID string  `json:"merchantTransId"`
	Status          string  `json:"status"`
	Message         string  `json:"message"`
	Amount          float64 `json:"amount"`
	Currency        string  `json:"currency"`
}