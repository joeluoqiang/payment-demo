import React, { useEffect, useState } from 'react';
import { Card, Button, Row, Col, Typography, Space, Alert, Divider, Tag, Steps, Spin, Radio, Form, Input, Switch } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  CreditCardOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  LockOutlined,
  CheckOutlined,
  CrownOutlined,
  SyncOutlined,
  CodeOutlined
} from '@ant-design/icons';
import type { SubscriptionPlan, PaymentRequest, CardInfo } from '../types';
import DropInComponent from '../components/DropInComponent';
import DeveloperPanel from '../components/DeveloperPanel';
import { apiService } from '../services/api';
import { useApp } from '../context/AppContext';
import { useDeveloperMode } from '../context/DeveloperModeContext';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

// 用户标识工具函数
const getUserReference = (): string => {
  const existingRef = Cookies.get('userReference');
  if (existingRef) return existingRef;

  const newRef = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  Cookies.set('userReference', newRef, { expires: 365 });
  return newRef;
};

const SubscriptionPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { config, state } = useApp();
  const [form] = Form.useForm();
  const { enabled: devModeEnabled, setEnabled: setDevModeEnabled, setPendingRedirect, setSessionId } = useDeveloperMode();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');

  // URL参数
  const scenarioType = searchParams.get('type') || 'linkpay';
  const planId = searchParams.get('planId');

  // 获取首页选择的币种
  const selectedCurrency = state.selectedCountry?.currency || 'USD';

  // 订阅套餐数据
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);

  // 加载订阅套餐 - 使用首页选择的币种
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const planData = await apiService.getSubscriptionPlans(selectedCurrency);
        setPlans(planData);
        // 如果URL中有planId，自动选中
        if (planId) {
          const plan = planData.find(p => p.id === planId);
          if (plan) setSelectedPlan(plan);
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
      } finally {
        setPlansLoading(false);
      }
    };
    loadPlans();
  }, [planId, selectedCurrency]);

  // 生成订单ID
  const generateMerchantTransId = () => {
    const timestamp = Math.floor(Date.now() / 1000).toString().slice(-8);
    const perfTime = Math.floor(performance.now() * 100).toString().slice(-4);
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `sub_${timestamp}${perfTime}${random}`;
  };

  // 组件初始化
  useEffect(() => {
    setResult(null);
    setError(null);
    setCurrentStep(0);
    setLoading(false);
    const newOrderId = generateMerchantTransId();
    setCurrentOrderId(newOrderId);
    form.resetFields();
    setSessionId(newOrderId);
  }, [scenarioType, form]);

  // 处理套餐选择
  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setError(null);
    // 重置结果状态，允许重新选择
    if (result) {
      setResult(null);
      setCurrentStep(0);
    }
  };

  // 发起订阅支付（LinkPay和Drop-in）
  const handleStartPayment = async () => {
    if (!selectedPlan) {
      setError('Please select a subscription plan');
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentStep(1);

    const merchantTransId = currentOrderId || generateMerchantTransId();
    const baseUrl = window.location.origin;
    const userReference = getUserReference();

    const paymentRequest: PaymentRequest = {
      amount: selectedPlan.price,
      currency: selectedPlan.currency,
      merchantTransId,
      paymentType: scenarioType,
      returnUrl: `${baseUrl}/payment-result?orderId=${merchantTransId}&paymentType=${scenarioType}&amount=${selectedPlan.price}&currency=${selectedPlan.currency}&isRecurring=true&userReference=${userReference}${devModeEnabled ? '&devMode=true' : ''}`,
      webhookUrl: `${API_BASE_URL}/api/v1/payment/webhook`,
      isRecurring: true,
      userReference: userReference,
    };

    try {
      const response = await apiService.createInteraction(paymentRequest);

      setResult(response);
      setCurrentStep(2);

      // LinkPay直接重定向
      if (scenarioType === 'linkpay' && response.linkUrl) {
        if (devModeEnabled) {
          setPendingRedirect({ url: response.linkUrl, label: 'Go to Payment Page' });
        } else {
          window.location.href = response.linkUrl;
        }
        return;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Subscription failed');
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  // Direct API订阅支付
  const handleDirectPayment = async (values: any) => {
    if (!selectedPlan) {
      setError('Please select a subscription plan');
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentStep(1);

    const merchantTransId = currentOrderId || generateMerchantTransId();
    const baseUrl = window.location.origin;
    const userReference = getUserReference();

    const cardInfo: CardInfo = {
      cardNumber: values.cardNumber.replace(/\s/g, ''),
      expiryDate: values.expiryDate.replace(/\D/g, ''),
      cvv: values.cvv,
      holderName: values.holderName,
    };

    const paymentRequest: PaymentRequest = {
      amount: selectedPlan.price,
      currency: selectedPlan.currency,
      merchantTransId,
      paymentType: 'directapi',
      returnUrl: `${baseUrl}/payment-result?orderId=${merchantTransId}&paymentType=directapi&amount=${selectedPlan.price}&currency=${selectedPlan.currency}&isRecurring=true&userReference=${userReference}${devModeEnabled ? '&devMode=true' : ''}`,
      webhookUrl: `${API_BASE_URL}/api/v1/payment/webhook`,
      cardInfo,
      isRecurring: true,
      userReference: userReference,
    };

    try {
      const response = await apiService.createDirectPayment(paymentRequest);

      setResult(response);
      setCurrentStep(2);

      // 处理3DS重定向
      if (response.action && response.action.type === 'threeDSRedirect') {
        const threeDSUrl = response.action.data?.threeDSData?.url;
        if (threeDSUrl) {
          if (devModeEnabled) {
            setPendingRedirect({ url: threeDSUrl, label: 'Proceed to 3DS Authentication' });
          } else {
            window.location.href = threeDSUrl;
          }
          return;
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment failed');
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  // 渲染套餐选择
  const renderPlanSelection = () => (
    <Row gutter={[24, 24]} className="plans-grid">
      {plans.map((plan) => (
        <Col key={plan.id} xs={24} sm={8}>
          <Card
            className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
            onClick={() => handlePlanSelect(plan)}
            hoverable
          >
            <div className="plan-header">
              <CrownOutlined className="plan-icon" />
              <Title level={4}>{plan.name}</Title>
              <div className="plan-price">
                <Text className="price-amount">{plan.currency} {plan.price}</Text>
                <Text className="price-interval">/{plan.interval}</Text>
              </div>
            </div>
            <Divider />
            <Paragraph className="plan-description">{plan.description}</Paragraph>
            <div className="plan-select">
              <Radio checked={selectedPlan?.id === plan.id} />
              <Text>{selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}</Text>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  // 渲染Direct API卡片表单
  const renderCardForm = () => (
    <Card className="payment-form-card" title={<><CreditCardOutlined /> Card Information</>}>
      <Alert
        message="Test Card Info"
        description="Card: 4895 3301 1111 1119, Expiry: 12/31, CVV: 390, OTP: 123456"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Form
        form={form}
        layout="vertical"
        onFinish={handleDirectPayment}
        initialValues={{
          cardNumber: '4895 3301 1111 1119',
          expiryDate: '12/31',
          cvv: '390',
          holderName: 'John Doe',
        }}
      >
        <Form.Item
          name="cardNumber"
          label="Card Number"
          rules={[{ required: true, message: 'Please enter card number' }]}
        >
          <Input
            size="large"
            placeholder="4895 3301 1111 1119"
            maxLength={19}
            prefix={<CreditCardOutlined />}
            onChange={(e) => {
              const value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
              form.setFieldsValue({ cardNumber: value });
            }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="expiryDate"
              label="Expiry Date (MM/YY)"
              rules={[{ required: true, message: 'Please enter expiry date' }]}
            >
              <Input
                size="large"
                placeholder="MM/YY"
                maxLength={5}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
                  form.setFieldsValue({ expiryDate: value });
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="cvv"
              label="CVV"
              rules={[{ required: true, message: 'Please enter CVV' }]}
            >
              <Input
                size="large"
                placeholder="390"
                maxLength={4}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="holderName"
          label="Cardholder Name"
          rules={[{ required: true, message: 'Please enter cardholder name' }]}
        >
          <Input
            size="large"
            placeholder="John Doe"
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loading}
          disabled={!selectedPlan}
          icon={<CreditCardOutlined />}
          className="subscribe-button"
        >
          {loading ? 'Processing...' : `Subscribe - ${selectedPlan?.currency || 'USD'} ${selectedPlan?.price || 0}`}
        </Button>

        {/* 开发者模式开关 */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Switch
            checked={devModeEnabled}
            onChange={setDevModeEnabled}
            checkedChildren={<><CodeOutlined /> Dev Mode</>}
            unCheckedChildren="Normal"
          />
        </div>
      </Form>
    </Card>
  );

  // 渲染进度步骤
  const renderPaymentSteps = () => (
    <Card className="steps-card">
      <Steps current={currentStep} size="small">
        <Step title="Select Plan" icon={<ShoppingCartOutlined />} />
        <Step title="Subscribe" icon={<CreditCardOutlined />} />
        <Step title="Confirmation" icon={<CheckCircleOutlined />} />
      </Steps>
    </Card>
  );

  if (plansLoading) {
    return (
      <div className="payment-page">
        <div className="payment-container" style={{ textAlign: 'center', paddingTop: 100 }}>
          <Spin size="large" />
          <Text style={{ display: 'block', marginTop: 16, color: 'white' }}>Loading subscription plans...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        {/* 头部导航 */}
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
              Subscription Checkout - {scenarioType.toUpperCase()}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              Choose your plan and start your subscription
            </Text>
          </div>
        </div>

        {/* 进度步骤 */}
        {renderPaymentSteps()}

        {/* 主要内容区域 */}
        <Row gutter={[24, 24]} className="payment-row">
          <Col xs={24} lg={16}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {error && (
                <Alert
                  message="Error"
                  description={error}
                  type="error"
                  showIcon
                  closable
                  className="error-alert"
                />
              )}

              {result && scenarioType !== 'dropin' && (
                <Alert
                  message={result.success ? 'Subscription Initiated' : 'Error'}
                  description={
                    <div>
                      <div>Status: {result.status}</div>
                      <div>Message: {result.message}</div>
                      {result.merchantTransId && (
                        <div>Transaction ID: {result.merchantTransId}</div>
                      )}
                    </div>
                  }
                  type={result.success ? 'success' : 'error'}
                  showIcon
                  className="result-alert"
                />
              )}

              {/* 套餐选择 - 始终显示 */}
              <Card className="plans-selection-card" title={<><CrownOutlined /> Select Your Plan</>}>
                {renderPlanSelection()}
              </Card>

              {/* Direct API - 显示卡片表单 */}
              {scenarioType === 'directapi' && !result && renderCardForm()}

              {/* Drop-in - 显示创建session按钮 */}
              {scenarioType === 'dropin' && !result && (
                <Card className="subscribe-action-card">
                  <Alert
                    message="Subscription Details"
                    description={
                      selectedPlan
                        ? `You are about to subscribe to ${selectedPlan.name} at ${selectedPlan.currency} ${selectedPlan.price}/${selectedPlan.interval}`
                        : 'Please select a subscription plan first'
                    }
                    type="info"
                    showIcon
                    icon={<SyncOutlined />}
                    style={{ marginBottom: 16 }}
                  />
                  <Button
                    type="primary"
                    size="large"
                    block
                    loading={loading}
                    disabled={!selectedPlan}
                    onClick={handleStartPayment}
                    icon={<CreditCardOutlined />}
                    className="subscribe-button"
                  >
                    {loading ? 'Processing...' : `Proceed to Payment - ${selectedPlan?.currency || 'USD'} ${selectedPlan?.price || 0}`}
                  </Button>
                  {/* 开发者模式开关 */}
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Switch
                      checked={devModeEnabled}
                      onChange={setDevModeEnabled}
                      checkedChildren={<><CodeOutlined /> Dev Mode</>}
                      unCheckedChildren="Normal"
                    />
                  </div>
                </Card>
              )}

              {/* Drop-in组件 */}
              {scenarioType === 'dropin' && result?.sessionId && (
                <Card title="Complete Your Subscription" className="dropin-card">
                  <Alert
                    message="Secure Subscription"
                    description="Complete your subscription payment securely."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <DropInComponent
                    key={result.sessionId}
                    sessionId={result.sessionId}
                    environment={config?.currentEnv === 'production' ? 'PROD' : 'UAT'}
                    onPaymentCompleted={() => {
                      const merchantTransId = currentOrderId || result.merchantTransId;
                      navigate(`/payment-result?orderId=${merchantTransId}&paymentType=dropin&amount=${selectedPlan?.price}&currency=${selectedPlan?.currency}&isRecurring=true&userReference=${getUserReference()}${devModeEnabled ? '&devMode=true' : ''}`);
                    }}
                    onPaymentFailed={(params) => {
                      setError('Payment failed: ' + (params.message || 'Unknown error'));
                    }}
                    onPaymentCancelled={() => {
                      setResult({ ...result, status: 'cancelled' });
                    }}
                  />
                </Card>
              )}

              {/* LinkPay - 显示订阅按钮 */}
              {scenarioType === 'linkpay' && !result && (
                <Card className="subscribe-action-card">
                  <Alert
                    message="LinkPay Subscription"
                    description={
                      selectedPlan
                        ? `You will be redirected to complete your subscription to ${selectedPlan.name}`
                        : 'Please select a subscription plan first'
                    }
                    type="info"
                    showIcon
                    icon={<SyncOutlined />}
                    style={{ marginBottom: 16 }}
                  />
                  <Button
                    type="primary"
                    size="large"
                    block
                    loading={loading}
                    disabled={!selectedPlan}
                    onClick={handleStartPayment}
                    icon={<CreditCardOutlined />}
                    className="subscribe-button"
                  >
                    {loading ? 'Processing...' : `Subscribe Now - ${selectedPlan?.currency || 'USD'} ${selectedPlan?.price || 0}`}
                  </Button>
                  {/* 开发者模式开关 */}
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Switch
                      checked={devModeEnabled}
                      onChange={setDevModeEnabled}
                      checkedChildren={<><CodeOutlined /> Dev Mode</>}
                      unCheckedChildren="Normal"
                    />
                  </div>
                </Card>
              )}
            </Space>
          </Col>

          {/* 右侧 - 订单摘要 */}
          <Col xs={24} lg={8}>
            <Card className="order-summary-card" title={<><ShoppingCartOutlined /> Subscription Summary</>}>
              {selectedPlan ? (
                <>
                  <div className="selected-plan-info">
                    <Title level={4}>{selectedPlan.name}</Title>
                    <Paragraph>{selectedPlan.description}</Paragraph>
                  </div>
                  <Divider />
                  <div className="price-breakdown">
                    <div className="price-row">
                      <Text>Plan:</Text>
                      <Text>{selectedPlan.name}</Text>
                    </div>
                    <div className="price-row">
                      <Text>Billing Cycle:</Text>
                      <Text>{selectedPlan.interval}</Text>
                    </div>
                    <Divider style={{ margin: '12px 0' }} />
                    <div className="price-row total-row">
                      <Text strong style={{ fontSize: '18px' }}>Total:</Text>
                      <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                        {selectedPlan.currency} {selectedPlan.price}
                      </Text>
                    </div>
                  </div>
                </>
              ) : (
                <Alert
                  message="No Plan Selected"
                  description="Please select a subscription plan from the left."
                  type="warning"
                  showIcon
                />
              )}

              <Divider />

              <div className="security-badges">
                <Space>
                  <Tag icon={<LockOutlined />} color="success">SSL Secured</Tag>
                  <Tag icon={<CheckOutlined />} color="processing">Verified Merchant</Tag>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 开发者面板 - 在页面底部 */}
        {devModeEnabled && <DeveloperPanel />}
      </div>
    </div>
  );
};

export default SubscriptionPaymentPage;