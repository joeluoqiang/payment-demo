import React, { useState } from 'react';
import { Card, Select, Button, Row, Col, Typography, Space, Spin, Alert, Badge } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  GlobalOutlined, 
  CreditCardOutlined,
  ShoppingCartOutlined,
  LinkOutlined,
  ApiOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import type { Country, PaymentScenario } from '../types';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

interface HomePageProps {
  // 不需要onStartDemo了，使用useNavigate
}

// 场景配置
const scenarioConfigs = {
  'uat-ecommerce-linkpay': {
    icon: <ShoppingCartOutlined />,
    color: '#52c41a',
    bgGradient: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
    image: '/api/placeholder/300/200',
    features: ['One-click payment', 'Mobile optimized', 'Multi-currency']
  },
  'uat-ecommerce-dropin': {
    icon: <CreditCardOutlined />,
    color: '#1890ff',
    bgGradient: 'linear-gradient(135deg, #1890ff 0%, #0958d9 100%)',
    image: '/api/placeholder/300/200',
    features: ['Embedded UI', 'Multiple methods', 'Real-time validation']
  },
  'uat-ecommerce-directapi': {
    icon: <ApiOutlined />,
    color: '#722ed1',
    bgGradient: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
    image: '/api/placeholder/300/200',
    features: ['Full control', 'Custom UI', 'Advanced integration']
  }
};

const HomePage: React.FC<HomePageProps> = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state, loading, error, config, selectCountry, selectScenario } = useApp();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  const handleCountryChange = (value: string) => {
    const country = state.countries.find(c => c.code === value);
    if (country) {
      selectCountry(country);
    }
  };

  const handleScenarioSelect = (scenarioId: string) => {
    const scenario = state.scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      selectScenario(scenario);
      setSelectedScenarioId(scenarioId);
      // 直接进入支付演示
      setTimeout(() => {
        navigate('/payment');
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
  };

  return (
    <div className="homepage-container">
      {/* 头部区域 */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Text className="logo-text">Evonet</Text>
          </div>
          
          <div className="country-selector">
            <GlobalOutlined className="country-icon" />
            <Select
              className="country-select"
              value={state.selectedCountry?.code || 'GLOBAL'}
              onChange={handleCountryChange}
              suffixIcon={null}
              bordered={false}
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
                <SafetyOutlined className="status-icon" />
                <span className="status-text">
                  {config.hasApiKeys ? 'Live API Mode' : 'Demo Mode'}
                </span>
                <Badge 
                  status={config.hasApiKeys ? 'processing' : 'default'} 
                  text={config.environment || 'Sandbox'}
                />
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
                        <div className="scenario-icon">
                          {config.icon}
                        </div>
                        <div className="scenario-image">
                          {/* 这里可以放实际的场景图片 */}
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
                      
                      <div className="scenario-badges">
                        <Badge 
                          color={config.color} 
                          text={scenario.environment.toUpperCase()}
                        />
                        <Badge 
                          color="geekblue" 
                          text={scenario.type.toUpperCase()}
                        />
                      </div>
                      
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