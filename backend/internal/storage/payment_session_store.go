package storage

import (
	"fmt"
	"sync"
	"time"
)

// ApiLogEntry API日志条目
type ApiLogEntry struct {
	ID        string                 `json:"id"`
	Timestamp string                 `json:"timestamp"`
	Type      string                 `json:"type"` // request or response
	ApiName   string                 `json:"apiName"`
	Method    string                 `json:"method"`
	URL       string                 `json:"url"`
	Headers   map[string]string      `json:"headers,omitempty"`
	Body      interface{}            `json:"body,omitempty"`
	Status    int                    `json:"status,omitempty"`
	Duration  int64                  `json:"duration,omitempty"` // milliseconds
}

// PaymentSessionStore 存储支付会话的API日志
type PaymentSessionStore struct {
	sessions map[string][]ApiLogEntry // key: merchantTransId or merchantOrderId
	mu       sync.RWMutex
}

var globalPaymentSessionStore *PaymentSessionStore
var sessionOnce sync.Once

// GetPaymentSessionStore 获取支付会话存储单例
func GetPaymentSessionStore() *PaymentSessionStore {
	sessionOnce.Do(func() {
		globalPaymentSessionStore = &PaymentSessionStore{
			sessions: make(map[string][]ApiLogEntry),
		}
	})
	return globalPaymentSessionStore
}

// AddLog 添加日志到指定会话
func (s *PaymentSessionStore) AddLog(sessionId string, log ApiLogEntry) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.sessions[sessionId] = append(s.sessions[sessionId], log)
	fmt.Printf("[PaymentSessionStore] AddLog - sessionId: %s, logId: %s, apiName: %s, type: %s, total logs: %d\n",
		sessionId, log.ID, log.ApiName, log.Type, len(s.sessions[sessionId]))
}

// GetLogs 获取指定会话的所有日志
func (s *PaymentSessionStore) GetLogs(sessionId string) []ApiLogEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()
	logs := s.sessions[sessionId]
	fmt.Printf("[PaymentSessionStore] GetLogs - sessionId: %s, found %d logs\n", sessionId, len(logs))
	return logs
}

// ClearLogs 清除指定会话的日志
func (s *PaymentSessionStore) ClearLogs(sessionId string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, sessionId)
}

// ClearAllLogs 清除所有日志
func (s *PaymentSessionStore) ClearAllLogs() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.sessions = make(map[string][]ApiLogEntry)
}

// GenerateLogID 生成日志ID
func GenerateLogID() string {
	return "log_" + time.Now().Format("20060102150405") + "_" + randomString(6)
}

func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
	}
	return string(b)
}