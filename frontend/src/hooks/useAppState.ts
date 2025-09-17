import { useState, useEffect } from 'react';
import type { Country, PaymentScenario, AppState } from '../types';
import { apiService } from '../services/api';
import { useTranslation } from 'react-i18next';

export const useAppState = () => {
  const { i18n } = useTranslation();
  
  const [state, setState] = useState<AppState>({
    selectedCountry: null,
    selectedScenario: null,
    countries: [],
    scenarios: [],
    language: 'en',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  // 检查本地缓存
  const getCachedData = () => {
    try {
      const cached = localStorage.getItem('payment-demo-cache');
      if (cached) {
        const data = JSON.parse(cached);
        const now = Date.now();
        // 缓存5分钟有效
        if (now - data.timestamp < 5 * 60 * 1000) {
          console.log('使用缓存数据');
          return data;
        }
      }
    } catch (e) {
      console.error('读取缓存失败:', e);
    }
    return null;
  };

  const setCachedData = (data: any) => {
    try {
      localStorage.setItem('payment-demo-cache', JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('保存缓存失败:', e);
    }
  };

  // 加载国家和场景数据
  useEffect(() => {
    if (!initialized) {
      loadInitialData();
    }
  }, [initialized]);

  const loadInitialData = async () => {
    if (loading || initialized) return;
    
    // 先检查缓存
    const cachedData = getCachedData();
    if (cachedData) {
      setState(prev => ({
        ...prev,
        countries: cachedData.countries,
        scenarios: cachedData.scenarios,
        selectedCountry: cachedData.selectedCountry,
      }));
      setConfig(cachedData.config);
      setInitialized(true);
      console.log('使用缓存数据初始化完成');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('开始加载初始数据...');
      console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
      
      // 为Chrome浏览器添加超时处理和重试机制
      const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
      const timeoutMs = isChrome ? 10000 : 30000; // Chrome使用更短的超时时间
      
      console.log(`检测到浏览器: ${isChrome ? 'Chrome' : '其他'}, 使用超时时间: ${timeoutMs}ms`);
      
      // 使用Promise.race来实现超时控制
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      });
      
      const dataPromise = Promise.all([
        apiService.getCountries(),
        apiService.getScenarios(),
        apiService.getConfig(),
      ]);
      
      const [countries, scenarios, configData] = await Promise.race([
        dataPromise,
        timeoutPromise
      ]) as [any, any, any];
      
      console.log('Countries loaded:', countries);
      console.log('Scenarios loaded:', scenarios);
      console.log('Config loaded:', configData);
      
      // 默认选择Global国家
      const globalCountry = countries.find((c: Country) => c.code === 'GLOBAL');
      const selectedCountry = globalCountry || countries[0];
      
      setState(prev => ({
        ...prev,
        countries,
        scenarios,
        selectedCountry,
      }));
      
      setConfig(configData);
      setInitialized(true);
      
      // 缓存数据
      setCachedData({
        countries,
        scenarios,
        config: configData,
        selectedCountry
      });
      
      console.log('初始数据加载完成');
    } catch (err: any) {
      console.error('加载初始数据失败:', err);
      console.log('切换到演示模式，使用静态数据');
      
      // 使用静态数据作为降级方案
      const staticCountries: Country[] = [
        { code: 'GLOBAL', name: 'Global', currency: 'USD', language: 'en' },
        { code: 'HK', name: 'Hong Kong', currency: 'HKD', language: 'zh' },
        { code: 'SG', name: 'Singapore', currency: 'SGD', language: 'en' },
      ];
      
      const staticScenarios: PaymentScenario[] = [
        { 
          id: 'uat-ecommerce-linkpay', 
          name: 'E-commerce LinkPay (UAT)', 
          type: 'linkpay', 
          environment: 'uat',
          description: 'Redirect-based payment method for e-commerce'
        },
        { 
          id: 'uat-ecommerce-dropin', 
          name: 'E-commerce Drop-in (UAT)', 
          type: 'dropin', 
          environment: 'uat',
          description: 'Embedded payment component for seamless checkout'
        },
        { 
          id: 'uat-ecommerce-directapi', 
          name: 'E-commerce Direct API (UAT)', 
          type: 'directapi', 
          environment: 'uat',
          description: 'Direct API integration with full control'
        },
      ];
      
      const staticConfig = {
        hasApiKeys: false,
        environment: 'UAT',
        mode: 'demonstration'
      };
      
      const selectedCountry = staticCountries[0];
      
      setState(prev => ({
        ...prev,
        countries: staticCountries,
        scenarios: staticScenarios,
        selectedCountry,
      }));
      
      setConfig(staticConfig);
      setInitialized(true);
      
      // 缓存静态数据
      setCachedData({
        countries: staticCountries,
        scenarios: staticScenarios,
        config: staticConfig,
        selectedCountry
      });
      
      // 不设置error，让应用继续以演示模式运行
      console.log('演示模式初始化完成');
    } finally {
      setLoading(false);
    }
  };

  const selectCountry = (country: Country) => {
    setState(prev => ({
      ...prev,
      selectedCountry: country,
    }));
    
    // 更新语言
    const languageMap: Record<string, string> = {
      'GLOBAL': 'en',
      'HK': 'zh',
      'KR': 'ko',
      'JP': 'ja',
      'MY': 'ms',
      'ID': 'id',
      'TH': 'th',
      'SG': 'en',
    };
    
    const newLanguage = languageMap[country.code] || 'en';
    if (newLanguage !== state.language) {
      setState(prev => ({ ...prev, language: newLanguage }));
      i18n.changeLanguage(newLanguage === 'zh' ? 'zh' : 'en');
    }
  };

  const selectScenario = (scenario: PaymentScenario) => {
    setState(prev => ({
      ...prev,
      selectedScenario: scenario,
    }));
  };

  const resetSelection = () => {
    setState(prev => ({
      ...prev,
      selectedCountry: null,
      selectedScenario: null,
    }));
  };

  return {
    state,
    loading,
    error,
    config,
    selectCountry,
    selectScenario,
    resetSelection,
    loadInitialData,
  };
};