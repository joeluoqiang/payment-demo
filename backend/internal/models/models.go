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