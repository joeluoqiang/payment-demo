package storage

import (
	"sync"
	"time"

	"payment-demo/internal/models"
)

// TokenStore 内存存储token与userReference的关联
type TokenStore struct {
	tokens map[string]*models.StoredToken // key: userReference
	mu     sync.RWMutex
}

var globalTokenStore *TokenStore
var once sync.Once

// GetTokenStore 获取全局TokenStore实例（单例模式）
func GetTokenStore() *TokenStore {
	once.Do(func() {
		globalTokenStore = &TokenStore{
			tokens: make(map[string]*models.StoredToken),
		}
	})
	return globalTokenStore
}

// SaveToken 保存token
func (s *TokenStore) SaveToken(userReference, tokenValue string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.tokens[userReference] = &models.StoredToken{
		TokenValue:    tokenValue,
		UserReference: userReference,
		CreatedAt:     time.Now(),
	}
}

// GetToken 根据userReference获取token
func (s *TokenStore) GetToken(userReference string) *models.StoredToken {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.tokens[userReference]
}

// DeleteToken 删除token
func (s *TokenStore) DeleteToken(userReference string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.tokens, userReference)
}

// GetAllTokens 获取所有token（用于调试）
func (s *TokenStore) GetAllTokens() []*models.StoredToken {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]*models.StoredToken, 0, len(s.tokens))
	for _, token := range s.tokens {
		result = append(result, token)
	}
	return result
}