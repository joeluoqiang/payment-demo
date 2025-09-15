import axios from 'axios';
import type { Country, PaymentScenario, PaymentRequest, PaymentResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
};

export default api;