import axios from 'axios';
import type { Country, PaymentScenario, PaymentRequest, PaymentResponse, SubscriptionPlan, RecurringPaymentRequest, StoredToken, ApiLogEntry } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export const apiService = {
  // 获取国家列表
  getCountries: async (): Promise<Country[]> => {
    console.log('请求国家列表...');
    const response = await api.get('/countries');
    return response.data.data;
  },

  // 获取场景列表
  getScenarios: async (): Promise<PaymentScenario[]> => {
    console.log('请求场景列表...');
    const response = await api.get('/scenarios');
    return response.data.data;
  },

  // 获取配置信息
  getConfig: async (): Promise<any> => {
    console.log('请求配置信息...');
    const response = await api.get('/config');
    return response.data.data;
  },

  // 切换API环境
  switchEnvironment: async (environment: 'sandbox' | 'production'): Promise<any> => {
    console.log(`切换环境到: ${environment}`);
    const response = await api.post('/config/switch-env', { environment });
    return response.data.data;
  },

  // 创建支付交互（LinkPay和Drop-in）
  createInteraction: async (request: PaymentRequest): Promise<PaymentResponse> => {
    const response = await api.post('/payment/interaction', request);
    return response.data;
  },

  // 创建直接支付（Direct API）
  createDirectPayment: async (request: PaymentRequest): Promise<PaymentResponse> => {
    const response = await api.post('/payment/direct', request);
    return response.data;
  },

  // 查询支付状态（Direct API）
  getPaymentStatus: async (merchantTransId: string): Promise<any> => {
    console.log('[API] 查询Direct API支付状态 - merchantTransId:', merchantTransId);
    console.log('[API] 请求URL:', `/payment/${merchantTransId}`);

    try {
      const response = await api.get(`/payment/${merchantTransId}`);
      console.log('[API] Direct API查询成功响应:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('[API] Direct API查询失败:', {
        url: `/payment/${merchantTransId}`,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // 查询交互状态（LinkPay和Drop-in）
  getInteractionStatus: async (merchantOrderId: string): Promise<any> => {
    console.log('[API] 查询Interaction状态 - merchantOrderId:', merchantOrderId);
    console.log('[API] 请求URL:', `/interaction/${merchantOrderId}`);

    try {
      const response = await api.get(`/interaction/${merchantOrderId}`);
      console.log('[API] Interaction查询成功响应:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('[API] Interaction查询失败:', {
        url: `/interaction/${merchantOrderId}`,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // 获取订阅套餐列表
  getSubscriptionPlans: async (currency?: string): Promise<SubscriptionPlan[]> => {
    console.log('[API] 获取订阅套餐列表...', currency ? `币种: ${currency}` : '');
    const params = currency ? { currency } : {};
    const response = await api.get('/subscription-plans', { params });
    return response.data.data;
  },

  // 创建后续订阅支付
  createRecurringPayment: async (request: RecurringPaymentRequest): Promise<PaymentResponse> => {
    console.log('[API] 创建后续订阅支付...', request);
    const response = await api.post('/payment/recurring', request);
    return response.data;
  },

  // 根据userReference获取token
  getToken: async (userReference: string): Promise<StoredToken | null> => {
    console.log('[API] 获取Token - userReference:', userReference);
    try {
      const response = await api.get(`/tokens/${userReference}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('[API] Token未找到');
        return null;
      }
      throw error;
    }
  },

  // 获取API日志（开发者模式）- 从后端获取Evonet API交互日志
  getApiLogs: async (sessionId: string): Promise<ApiLogEntry[]> => {
    try {
      const response = await api.get(`/dev-logs/${sessionId}`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('[API] 获取API日志失败:', error);
      return [];
    }
  },

  // 清除API日志（开发者模式）
  clearApiLogs: async (sessionId: string): Promise<void> => {
    try {
      await api.delete(`/dev-logs/${sessionId}`);
    } catch (error: any) {
      console.error('[API] 清除API日志失败:', error);
    }
  },
};

export default api;