package utils

import (
	"fmt"
	"math/rand"
	"time"
)

// 生成唯一的商户交易ID
func GenerateMerchantTransID() string {
	timestamp := time.Now().Format("20060102150405")
	random := rand.Intn(999999)
	return fmt.Sprintf("trans_%s_%06d", timestamp, random)
}

// 生成幂等性密钥
func GenerateIdempotencyKey() string {
	timestamp := time.Now().Format("20060102150405")
	random := rand.Intn(999999)
	return fmt.Sprintf("idem_%s_%06d", timestamp, random)
}

// 验证货币代码
func IsValidCurrency(currency string) bool {
	validCurrencies := map[string]bool{
		"USD": true, "HKD": true, "KRW": true, "JPY": true,
		"MYR": true, "IDR": true, "THB": true, "SGD": true,
	}
	return validCurrencies[currency]
}

// 格式化金额（整数格式）
func FormatAmount(amount float64) string {
	return fmt.Sprintf("%.0f", amount)
}