import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Space,
  Alert,
  Tag,
  Divider,
  List,
  Spin,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { SubscriptionPlan } from '../types';
import { apiService } from '../services/api';
import { useApp } from '../context/AppContext';
import RoleLabel from '../components/RoleLabel';
import FlowIndicator from '../components/FlowIndicator';
import DeveloperTools from '../components/DeveloperTools';
import DropInComponent from '../components/DropInComponent';
import './SubscriptionPage.css';

const { Title, Text, Paragraph } = Typography;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { config } = useApp();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'select' | 'payment' | 'result'>('select');
  const [requestData, setRequestData] = useState<any>(null);
  const [responseData, setResponseData] = useState<any>(null);

  // Flow steps for FlowIndicator
  const flowSteps = [
    { id: 'select', label: 'Select Plan', role: 'merchant' as const },
    { id: 'payment', label: 'Payment', role: 'evonet' as const },
    { id: 'result', label: 'Confirmation', role: 'merchant' as const },
  ];

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setPlansLoading(true);
      const data = await apiService.getSubscriptionPlans();
      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans:', error);
      message.error('Failed to load subscription plans');
    } finally {
      setPlansLoading(false);
    }
  };

  const generateMerchantTransId = () => {
    const timestamp = Math.floor(Date.now() / 1000).toString().slice(-8);
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `sub${timestamp}${random}`;
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setLoading(true);
    setCurrentStep('payment');

    try {
      const merchantTransId = generateMerchantTransId();
      const baseUrl = window.location.origin;

      const request = {
        planId: plan.id,
        merchantTransId,
        returnUrl: `${baseUrl}/subscription-result?orderId=${merchantTransId}`,
        webhookUrl: `${API_BASE_URL}/api/v1/payment/webhook`,
      };

      setRequestData(request);

      const response = await apiService.createSubscription(request);
      setResponseData(response);

      if (response.success && response.sessionId) {
        setSessionId(response.sessionId);
      } else if (response.linkUrl) {
        window.location.href = response.linkUrl;
      }
    } catch (error) {
      console.error('Failed to create subscription:', error);
      message.error('Failed to create subscription');
      setCurrentStep('select');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCompleted = (params: any) => {
    console.log('Payment completed:', params);
    setCurrentStep('result');
    message.success('Subscription activated successfully!');
  };

  const handlePaymentFailed = (params: any) => {
    console.log('Payment failed:', params);
    message.error('Payment failed. Please try again.');
  };

  const handlePaymentCancelled = () => {
    setCurrentStep('select');
    setSessionId('');
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isSelected = selectedPlan?.id === plan.id;
    const isPopular = plan.id === 'pro';

    return (
      <Col xs={24} md={8} key={plan.id}>
        <Card
          className={`plan-card ${isSelected ? 'plan-card--selected' : ''} ${isPopular ? 'plan-card--popular' : ''}`}
          hoverable
          onClick={() => handleSelectPlan(plan)}
        >
          {isPopular && (
            <div className="plan-card__badge">
              <Tag color="gold">Most Popular</Tag>
            </div>
          )}

          <div className="plan-card__header">
            <CrownOutlined className="plan-card__icon" />
            <Title level={4}>{plan.name}</Title>
            <Text type="secondary">{plan.description}</Text>
          </div>

          <div className="plan-card__price">
            <Text className="plan-card__currency">{plan.currency}</Text>
            <Text className="plan-card__amount">{plan.price.toFixed(2)}</Text>
            <Text className="plan-card__interval">/{plan.interval}</Text>
          </div>

          <Divider />

          <List
            dataSource={plan.features}
            renderItem={(feature) => (
              <List.Item className="plan-card__feature">
                <CheckOutlined className="plan-card__check" />
                <Text>{feature}</Text>
              </List.Item>
            )}
          />

          <Button
            type={isPopular ? 'primary' : 'default'}
            block
            size="large"
            loading={loading && selectedPlan?.id === plan.id}
          >
            {loading && selectedPlan?.id === plan.id ? 'Processing...' : 'Select Plan'}
          </Button>
        </Card>
      </Col>
    );
  };

  const renderPaymentSection = () => (
    <Card className="payment-card">
      <RoleLabel role="evonet" className="section-role-label" />

      <Title level={4}>Complete Your Subscription</Title>
      <Paragraph>
        You are subscribing to <strong>{selectedPlan?.name}</strong> at{' '}
        <strong>
          {selectedPlan?.currency} {selectedPlan?.price?.toFixed(2)}/{selectedPlan?.interval}
        </strong>
      </Paragraph>

      {sessionId && (
        <>
          <Alert
            message="Test Card Information"
            description="Card Number: 4895 3301 1111 1119, Expiry: 12/31, CVV: 390, OTP: 123456"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <DropInComponent
            key={sessionId}
            sessionId={sessionId}
            environment={config?.currentEnv === 'production' ? 'PROD' : 'UAT'}
            onPaymentCompleted={handlePaymentCompleted}
            onPaymentFailed={handlePaymentFailed}
            onPaymentCancelled={handlePaymentCancelled}
          />
        </>
      )}
    </Card>
  );

  const renderResultSection = () => (
    <Card className="result-card">
      <RoleLabel role="merchant" className="section-role-label" />

      <div className="result-card__content">
        <CheckOutlined className="result-card__icon" />
        <Title level={3}>Subscription Activated!</Title>
        <Paragraph>
          Your <strong>{selectedPlan?.name}</strong> subscription is now active.
        </Paragraph>

        <div className="result-card__details">
          <div className="result-card__detail-row">
            <Text type="secondary">Plan:</Text>
            <Text strong>{selectedPlan?.name}</Text>
          </div>
          <div className="result-card__detail-row">
            <Text type="secondary">Price:</Text>
            <Text strong>
              {selectedPlan?.currency} {selectedPlan?.price?.toFixed(2)}/{selectedPlan?.interval}
            </Text>
          </div>
          <div className="result-card__detail-row">
            <Text type="secondary">Status:</Text>
            <Tag color="green">Active</Tag>
          </div>
        </div>

        <Space>
          <Button type="primary" onClick={() => navigate('/')}>
            Back to Home
          </Button>
          <Button onClick={() => {
            setCurrentStep('select');
            setSelectedPlan(null);
            setSessionId('');
          }}>
            Subscribe to Another Plan
          </Button>
        </Space>
      </div>
    </Card>
  );

  if (plansLoading) {
    return (
      <div className="subscription-page subscription-page--loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <div className="subscription-container">
        {/* Header */}
        <div className="page-header">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            size="large"
            className="back-button"
          >
            Back
          </Button>

          <div className="page-title">
            <Title level={2} style={{ margin: 0, color: 'white' }}>
              Subscription Plans
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              Choose the perfect plan for your needs
            </Text>
          </div>

          <DeveloperTools
            requestData={requestData}
            responseData={responseData}
          />
        </div>

        {/* Flow Indicator */}
        <Card className="flow-card">
          <FlowIndicator
            steps={flowSteps}
            currentStep={currentStep}
          />
        </Card>

        {/* Main Content */}
        <RoleLabel role="merchant" className="main-role-label" />

        {currentStep === 'select' && (
          <Row gutter={[24, 24]}>
            {plans.map(renderPlanCard)}
          </Row>
        )}

        {currentStep === 'payment' && (
          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} lg={16}>
              {renderPaymentSection()}
            </Col>
          </Row>
        )}

        {currentStep === 'result' && (
          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} lg={12}>
              {renderResultSection()}
            </Col>
          </Row>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;