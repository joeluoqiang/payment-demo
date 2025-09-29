import React, { useState } from 'react';
import { Card, Select, Button, Row, Col, Typography, Space, Spin, Alert, Badge, Switch, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  GlobalOutlined, 
  CreditCardOutlined,
  ShoppingCartOutlined,
  LinkOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { getSupportedLanguage, getLanguageByCountry } from '../locales';
import { apiService } from '../services/api';
import type { Country, PaymentScenario } from '../types';
import i18n from '../locales';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

interface HomePageProps {
  // 不需要onStartDemo了，使用useNavigate
}

// 场景配置
const scenarioConfigs = {
  'uat-ecommerce-linkpay': {
    icon: <ShoppingCartOutlined />,
    color: '#0275DD',
    bgGradient: 'linear-gradient(135deg, #0275DD 0%, #054D8E 100%)',
    image: '/api/placeholder/300/200',
    features: ['One-click payment', 'Mobile optimized', 'Multi-currency']
  },
  'uat-ecommerce-dropin': {
    icon: <CreditCardOutlined />,
    color: '#4ADAFC',
    bgGradient: 'linear-gradient(135deg, #4ADAFC 0%, #0275DD 100%)',
    image: '/api/placeholder/300/200',
    features: ['Embedded UI', 'Multiple methods', 'Real-time validation']
  },
  'uat-ecommerce-directapi': {
    icon: <ApiOutlined />,
    color: '#48E5CE',
    bgGradient: 'linear-gradient(135deg, #48E5CE 0%, #4ADAFC 100%)',
    image: '/api/placeholder/300/200',
    features: ['Full control', 'Custom UI', 'Advanced integration']
  }
};

const HomePage: React.FC<HomePageProps> = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state, loading, error, config, selectCountry, selectScenario } = useApp();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [environmentSwitching, setEnvironmentSwitching] = useState(false);

  const handleEnvironmentSwitch = async (checked: boolean) => {
    const targetEnv = checked ? 'production' : 'sandbox';
    setEnvironmentSwitching(true);
    
    try {
      await apiService.switchEnvironment(targetEnv);
      message.success(`已切换到 ${targetEnv === 'production' ? 'Production' : 'Sandbox'} 环境`);
      // 重新加载页面以获取最新配置
      window.location.reload();
    } catch (err: any) {
      message.error(`环境切换失败: ${err.message}`);
    } finally {
      setEnvironmentSwitching(false);
    }
  };

  const handleCountryChange = (value: string) => {
    const country = state.countries.find(c => c.code === value);
    if (country) {
      selectCountry(country);
      // 根据国家自动切换语言
      const countryLanguage = getLanguageByCountry(value);
      const supportedLang = getSupportedLanguage(countryLanguage);
      if (i18n.language !== supportedLang) {
        i18n.changeLanguage(supportedLang);
        console.log(`[HomePage] Language changed to: ${supportedLang} for country: ${value}`);
      }
    }
  };

  const handleScenarioSelect = (scenarioId: string) => {
    const scenario = state.scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      selectScenario(scenario);
      setSelectedScenarioId(scenarioId);
      // 直接进入支付演示，添加时间戳确保每次都是全新的体验
      const timestamp = Date.now();
      setTimeout(() => {
        navigate(`/payment?t=${timestamp}`);
      }, 300);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Spin size="large" />
          <Text style={{ marginTop: 16, color: 'white' }}>Loading payment demos...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage-container">
      {/* 头部区域 */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <img 
              src="https://evonetglobal.com/wp-content/uploads/2025/07/logo-3.png" 
              alt="Evonet" 
              className="logo-image"
            />
          </div>
          
          <div className="header-controls">
            {/* 国家选择器 */}
            <div className="country-selector" style={{ 
              background: 'rgba(255, 255, 255, 0.15)',
              WebkitBackdropFilter: 'blur(10px)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '30px',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <GlobalOutlined className="country-icon" />
              <Select
                className="country-select"
                value={state.selectedCountry?.code || 'GLOBAL'}
                onChange={handleCountryChange}
                suffixIcon={null}
                bordered={false}
                dropdownClassName="country-dropdown"
                getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.95)'
                }}
              >
                {state.countries.map((country: Country) => (
                  <Option key={country.code} value={country.code}>
                    <Space>
                      <span>{t(`countries.${country.code}`)}</span>
                      <Badge 
                        count={country.currency} 
                        style={{ 
                          backgroundColor: 'var(--primary-color)', 
                          fontSize: '10px',
                          minWidth: '32px'
                        }} 
                      />
                    </Space>
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="main-content">
        <div className="hero-section">
          <div className="hero-content fade-in-up">
            <Title level={1} className="hero-title">
              {t('home.title')}
            </Title>
            <Paragraph className="hero-subtitle">
              {t('home.subtitle')}
            </Paragraph>
            
            {config && (
              <div className="status-indicator fade-in-up delay-200">
                <div className="api-mode-display">
                  <span className="api-mode-label">API Mode</span>
                  <Switch
                    checked={config.currentEnv === 'production'}
                    onChange={handleEnvironmentSwitch}
                    loading={environmentSwitching}
                    checkedChildren="Production"
                    unCheckedChildren="Sandbox"
                    className="api-mode-switch"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="error-container fade-in-up delay-300">
            <Alert
              message={t('common.error')}
              description={error}
              type="error"
              showIcon
              closable
              className="error-alert"
            />
          </div>
        )}

        {/* 场景选择网格 */}
        <div className="scenarios-section">
          <Title level={2} className="section-title fade-in-up delay-400">
            Choose Your Payment Experience
          </Title>
          
          <Row gutter={[24, 24]} className="scenarios-grid">
            {state.scenarios.map((scenario: PaymentScenario, index) => {
              const config = scenarioConfigs[scenario.id as keyof typeof scenarioConfigs];
              if (!config) return null;
              
              return (
                <Col 
                  key={scenario.id} 
                  xs={24} 
                  sm={12} 
                  lg={6}
                  className={`fade-in-up delay-${(index + 5) * 100}`}
                >
                  <Card
                    className={`scenario-card hover-lift ${
                      selectedScenarioId === scenario.id ? 'selected' : ''
                    }`}
                    onClick={() => handleScenarioSelect(scenario.id)}
                    cover={
                      <div 
                        className="scenario-cover"
                        style={{ background: config.bgGradient }}
                      >
                        <div className="scenario-image">
                          <div className="placeholder-image">
                            {scenario.type === 'linkpay' && <ShoppingCartOutlined style={{ fontSize: 48 }} />}
                            {scenario.type === 'dropin' && <CreditCardOutlined style={{ fontSize: 48 }} />}
                            {scenario.type === 'directapi' && <ApiOutlined style={{ fontSize: 48 }} />}
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <div className="scenario-content">
                      <Title level={4} className="scenario-title">
                        {t(`scenarios.${scenario.id}`)}
                      </Title>
                      
                      <ul className="scenario-features">
                        {config.features.map((feature, idx) => (
                          <li key={idx} className="feature-item">
                            <span className="feature-dot"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      <Button 
                        type="primary" 
                        block
                        className="scenario-button"
                        icon={<LinkOutlined />}
                      >
                        Try Demo
                      </Button>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      </main>
    </div>
  );
};

export default HomePage;