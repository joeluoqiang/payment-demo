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