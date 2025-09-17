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

  // 加载国家和场景数据
  useEffect(() => {
    if (!initialized) {
      loadInitialData();
    }
  }, [initialized]);

  const loadInitialData = async () => {
    if (loading || initialized) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('开始加载初始数据...');
      console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
      
      const [countries, scenarios, configData] = await Promise.all([
        apiService.getCountries(),
        apiService.getScenarios(),
        apiService.getConfig(),
      ]);
      
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
      
      console.log('初始数据加载完成');
    } catch (err: any) {
      console.error('加载初始数据失败:', err);
      setError(err.message || '加载数据失败');
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