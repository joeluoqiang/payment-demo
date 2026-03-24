import React from 'react';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { AppProvider } from '../context/AppContext';
import { vi } from 'vitest';

// Mock the api service for tests
vi.mock('../services/api', () => ({
  apiService: {
    getCountries: vi.fn().mockResolvedValue([
      { code: 'GLOBAL', name: 'Global', currency: 'USD', language: 'en' },
      { code: 'US', name: 'United States', currency: 'USD', language: 'en' },
    ]),
    getScenarios: vi.fn().mockResolvedValue([
      { id: 'linkpay', name: 'LinkPay', environment: 'sandbox', type: 'linkpay', description: 'LinkPay Demo' },
      { id: 'dropin', name: 'Drop-in', environment: 'sandbox', type: 'dropin', description: 'Drop-in Demo' },
      { id: 'directapi', name: 'Direct API', environment: 'sandbox', type: 'directapi', description: 'Direct API Demo' },
    ]),
    getConfig: vi.fn().mockResolvedValue({
      currentEnv: 'sandbox',
      environments: ['sandbox', 'production'],
    }),
    switchEnvironment: vi.fn().mockResolvedValue({ success: true }),
    createInteraction: vi.fn().mockResolvedValue({
      success: true,
      sessionId: 'test-session-id',
      merchantTransId: 'test-merchant-trans-id',
      status: 'pending',
      message: 'Payment initiated',
    }),
    createDirectPayment: vi.fn().mockResolvedValue({
      success: true,
      merchantTransId: 'test-merchant-trans-id',
      status: 'success',
      message: 'Payment successful',
    }),
    getPaymentStatus: vi.fn().mockResolvedValue({
      merchantTransId: 'test-merchant-trans-id',
      status: 'success',
      amount: 100,
      currency: 'USD',
    }),
    getInteractionStatus: vi.fn().mockResolvedValue({
      merchantOrderId: 'test-merchant-order-id',
      status: 'success',
    }),
    // Subscription APIs
    getSubscriptionPlans: vi.fn().mockResolvedValue([
      { id: 'basic', name: 'Basic Plan', description: 'Basic plan', price: 9.99, currency: 'USD', interval: 'monthly', features: ['Feature 1'] },
      { id: 'pro', name: 'Pro Plan', description: 'Pro plan', price: 19.99, currency: 'USD', interval: 'monthly', features: ['Feature 1', 'Feature 2'] },
    ]),
    createSubscription: vi.fn().mockResolvedValue({
      success: true,
      sessionId: 'test-session-id',
      merchantTransId: 'test-sub-trans-id',
      status: 'pending',
      message: 'Subscription created',
    }),
    getSubscription: vi.fn().mockResolvedValue({
      id: 'test-sub-id',
      merchantTransId: 'test-sub-trans-id',
      status: 'active',
    }),
    cancelSubscription: vi.fn().mockResolvedValue({
      success: true,
      subscriptionId: 'test-sub-id',
      status: 'cancelled',
      message: 'Subscription cancelled',
    }),
    // Refund APIs
    createRefund: vi.fn().mockResolvedValue({
      success: true,
      refundId: 'test-refund-id',
      refundTransId: 'test-refund-trans-id',
      merchantTransId: 'test-merchant-trans-id',
      status: 'success',
      message: 'Refund processed',
      amount: 100,
      currency: 'USD',
    }),
    getRefund: vi.fn().mockResolvedValue({
      id: 'test-refund-id',
      merchantTransId: 'test-merchant-trans-id',
      refundTransId: 'test-refund-trans-id',
      status: 'success',
      amount: 100,
      currency: 'USD',
    }),
  },
}));

const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AppProvider>
        {children}
      </AppProvider>
    </ConfigProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };