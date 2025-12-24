import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Row, Col, Typography, Space, Alert, Divider, Tag, Steps, Switch, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftOutlined, 
  CreditCardOutlined, 
  ShoppingCartOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  LockOutlined,
  CheckOutlined
} from '@ant-design/icons';
import type { PaymentRequest, Country, PaymentScenario } from '../types';
import DropInComponent from '../components/DropInComponent';
import { apiService } from '../services/api';
import { useApp } from '../context/AppContext';

const { Title, Text } = Typography;
const { Step } = Steps;

interface PaymentPageProps {
  country: Country;
  scenario: PaymentScenario;
  // 不需要onBack了，使用useNavigate
}

// 模拟商品数据
const mockProducts = [
  {
    id: 1,
    name: 'Premium Wireless Headphones',
    price: 90,
    quantity: 1,
    description: 'High-quality wireless headphones with noise cancellation'
  },
  {
    id: 2,
    name: 'Smart Fitness Watch',
    price: 200,
    quantity: 1,
    description: 'Advanced fitness tracking with heart rate monitor'
  }
];

const PaymentPage: React.FC<PaymentPageProps> = ({ country, scenario }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentOrderId, setCurrentOrderId] = useState<string>(''); // 存储当前的订单ID
  const { config } = useApp(); // 获取当前环境配置
  
  // 自定义金额和币种状态
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [customCurrency, setCustomCurrency] = useState<string>(country.currency);
  
  // 预设币种选项
  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'KRW', label: 'KRW - Korean Won' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' },
    { value: 'HKD', label: 'HKD - Hong Kong Dollar' }
  ];

  const generateMerchantTransId = () => {
    // 使用当前时间戳的后8位（秒级时间戳）
    const timestamp = Math.floor(Date.now() / 1000).toString().slice(-8);
    // 性能时间戳的后4位
    const perfTime = Math.floor(performance.now() * 100).toString().slice(-4);
    // 6位随机数
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    // 4位会话随机数
    const sessionRandom = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    // 格式：demo + 8位时间戳 + 4位性能时间 + 6位随机数 + 4位会话随机数 = 26位
    const orderId = `demo${timestamp}${perfTime}${random}${sessionRandom}`;
    
    console.log('生成订单ID:', orderId, '长度:', orderId.length);
    return orderId;
  };

  // 在组件挂载或scenario改变时重置状态并生成新的订单ID
  useEffect(() => {
    console.log('组件初始化或scenario改变，重置状态并生成新订单ID - scenario.id:', scenario.id);
    setResult(null);
    setError(null);
    setCurrentStep(0);
    setLoading(false);
    // 立即生成新的订单ID
    const newOrderId = generateMerchantTransId();
    setCurrentOrderId(newOrderId);
    console.log('为新的支付流程生成订单ID:', newOrderId);
    // 重置表单
    form.resetFields();
    // 重置自定义金额设置
    setUseCustomAmount(false);
    setCustomAmount(0);
  }, [scenario.id]); // 移除form依赖，防止无限循环

  // 当国家变化时，更新自定义币种的默认值
  useEffect(() => {
    setCustomCurrency(country.currency);
  }, [country.currency]);

  // 计算订单总额
  const calculateTotal = () => {
    if (useCustomAmount && customAmount > 0) {
      // 如果使用自定义金额，直接返回该金额作为总价
      return {
        subtotal: customAmount,
        shipping: 0,
        tax: 0,
        total: customAmount
      };
    }
    
    const subtotal = mockProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const shipping = 10;
    const tax = Math.floor(subtotal * 0.1); // 10% 税费，取整
    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax
    };
  };

  // 获取当前使用的货币
  const getCurrentCurrency = () => {
    return useCustomAmount ? customCurrency : country.currency;
  };

  // 获取当前使用的总金额
  const getCurrentTotal = () => {
    return calculateTotal().total;
  };

  const orderSummary = calculateTotal();
  const currentCurrency = getCurrentCurrency();
  const currentTotal = getCurrentTotal();

  const handleSubmit = async (values: any) => {
    // 强制重置所有状态，确保全新开始
    console.log('开始新的支付流程，当前订单ID:', currentOrderId);
    
    // 记录用户点击支付按钮的日志，特别是dropin类型
    if (scenario.type === 'dropin') {
      console.log('[DropIn] 用户点击了体验dropin支付流程按钮');
      console.log('[DropIn] 当前场景:', scenario.name);
      console.log('[DropIn] 当前环境:', scenario.environment);
      console.log('[DropIn] 支付金额:', currentCurrency, currentTotal);
    }
    
    setResult(null);
    setError(null);
    setCurrentStep(1);
    setLoading(true);

    try {
      // 使用预生成的订单ID，如果没有则生成新的
      const merchantTransId = currentOrderId || generateMerchantTransId();
      const baseUrl = window.location.origin;
      
      console.log('使用订单ID创建支付请求 - merchantTransId:', merchantTransId);
      console.log('当前时间戳:', Date.now(), '，性能时间:', performance.now());
      
      const paymentRequest: PaymentRequest = {
        amount: currentTotal,
        currency: currentCurrency,
        merchantTransId,
        paymentType: scenario.type,
        returnUrl: `${baseUrl}/payment-result?orderId=${merchantTransId}&paymentType=${scenario.type}&amount=${currentTotal}&currency=${currentCurrency}`,
        webhookUrl: `${baseUrl}/api/v1/payment/webhook`,
      };

      let response;

      if (scenario.type === 'directapi') {
        paymentRequest.cardInfo = {
          cardNumber: values.cardNumber.replace(/\s/g, ''),
          expiryDate: values.expiryDate.replace(/\D/g, ''), // 去除非数字字符
          cvv: values.cvv,
          holderName: values.holderName,
        };
        response = await apiService.createDirectPayment(paymentRequest);
      } else {
        console.log('[DropIn] 调用API创建支付交互，获取sessionId');
        response = await apiService.createInteraction(paymentRequest);
      }

      console.log('支付请求成功响应:', response);
      setResult(response);
      setCurrentStep(2);

      // 如果是 LinkPay，直接重定向到支付链接
      if (scenario.type === 'linkpay' && response.linkUrl) {
        window.location.href = response.linkUrl;
        return;
      }

      // 如果是 Direct API 且返回了重定向链接（如3DS认证）
      if (scenario.type === 'directapi' && response.action && response.action.type === 'threeDSRedirect') {
        const threeDSUrl = response.action.data.threeDSData?.url;
        if (threeDSUrl) {
          window.location.href = threeDSUrl;
          return;
        }
      }

    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment failed');
      setCurrentStep(0);
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderOrderSummary = () => (
    <Card className="order-summary-card" title={<><ShoppingCartOutlined /> Order Summary</>}>
      {useCustomAmount && (
        <Alert
          message="Custom Amount Applied"
          description={`You are using a custom payment amount: ${currentCurrency} ${currentTotal}`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      {!useCustomAmount && (
        <div className="products-list">
          {mockProducts.map(product => (
            <div key={product.id} className="product-item">
              <div className="product-image">
                <div className="image-placeholder">
                  <ShoppingCartOutlined style={{ fontSize: 24, color: '#ccc' }} />
                </div>
              </div>
              <div className="product-details">
                <Text strong>{product.name}</Text>
                <Text type="secondary" className="product-description">
                  {product.description}
                </Text>
                <div className="product-quantity">
                  Qty: {product.quantity}
                </div>
              </div>
              <div className="product-price">
                <Text strong>{country.currency} {product.price}</Text>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <Divider style={{ margin: '16px 0' }} />
      
      <div className="price-breakdown">
        {!useCustomAmount && (
          <>
            <div className="price-row">
              <Text>Subtotal:</Text>
              <Text>{country.currency} {orderSummary.subtotal}</Text>
            </div>
            <div className="price-row">
              <Text>Shipping:</Text>
              <Text>{country.currency} {orderSummary.shipping}</Text>
            </div>
            <div className="price-row">
              <Text>Tax:</Text>
              <Text>{country.currency} {orderSummary.tax}</Text>
            </div>
            <Divider style={{ margin: '12px 0' }} />
          </>
        )}
        <div className="price-row total-row">
          <Text strong style={{ fontSize: '18px' }}>Total:</Text>
          <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
            {currentCurrency} {currentTotal}
          </Text>
        </div>
      </div>
      
      <div className="security-badges">
        <Space>
          <Tag icon={<LockOutlined />} color="success">SSL Secured</Tag>
          <Tag icon={<CheckOutlined />} color="processing">Verified Merchant</Tag>
        </Space>
      </div>
    </Card>
  );

  const renderPaymentForm = () => {
    return (
      <Card 
        className="payment-form-card"
        title={
          <Space>
            <CreditCardOutlined />
            <span>Payment Details</span>
            <Tag color="blue">{scenario.type.toUpperCase()}</Tag>
          </Space>
        }
      >
        {/* 自定义金额和币种调整 */}
        <div className="custom-payment-section">
          <Card 
            title="Custom Payment Options" 
            size="small"
            className="custom-payment-card"
            extra={
              <Form.Item name="useCustomAmount" valuePropName="checked" noStyle>
                <Switch 
                  checked={useCustomAmount} 
                  onChange={setUseCustomAmount}
                  checkedChildren="Custom"
                  unCheckedChildren="Default"
                  size="small"
                />
              </Form.Item>
            }
          >
            {useCustomAmount ? (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="customAmount"
                      rules={[{ required: true, message: 'Please enter amount' }]}
                      noStyle
                    >
                      <Input
                        size="large"
                        placeholder="Enter custom amount"
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={customAmount}
                        onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                        prefix={<CreditCardOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Select
                      size="large"
                      value={customCurrency}
                      onChange={setCustomCurrency}
                      options={currencyOptions}
                      className="currency-select"
                    />
                  </Col>
                </Row>
                <Alert
                  message="Custom Payment Info"
                  description="You are using a custom payment amount and currency. This will override the default order amount."
                  type="info"
                  showIcon
                  style={{ marginBottom: 0 }}
                />
              </Space>
            ) : (
              <Alert
                message="Default Payment"
                description="You are using the default order amount and currency. Toggle to Custom to adjust."
                type="info"
                showIcon
                style={{ marginBottom: 0 }}
              />
            )}
          </Card>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            cardNumber: '4895 3301 1111 1119',
            expiryDate: '12/31',
            cvv: '390',
            holderName: 'John Doe',
          }}
        >
          {scenario.type === 'directapi' && (
            <>
              <Form.Item
                name="cardNumber"
                label={t('payment.cardNumber')}
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
                    label={t('payment.expiryDate')}
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
                    label={t('payment.cvv')}
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
                label={t('payment.holderName')}
                rules={[{ required: true, message: 'Please enter cardholder name' }]}
              >
                <Input
                  size="large"
                  placeholder="John Doe"
                />
              </Form.Item>
            </>
          )}

          <div className="payment-info">
            <Alert
              message="Secure Payment"
              description={`Your payment will be processed securely using ${scenario.type.toUpperCase()} integration.`}
              type="info"
              icon={<SafetyOutlined />}
              showIcon
              style={{ marginBottom: 16 }}
            />
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              icon={<CreditCardOutlined />}
              className="pay-button"
            >
              {loading ? t('payment.processing') : `Pay ${currentCurrency} ${currentTotal}`}
            </Button>
          </Form.Item>
          
          <div className="payment-security">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <LockOutlined /> Your payment information is encrypted and secure
            </Text>
          </div>
        </Form>
      </Card>
    );
  };

  const renderPaymentSteps = () => (
    <Card className="steps-card">
      <Steps current={currentStep} size="small">
        <Step title="Order Review" icon={<ShoppingCartOutlined />} />
        <Step title="Payment" icon={<CreditCardOutlined />} />
        <Step title="Confirmation" icon={<CheckCircleOutlined />} />
      </Steps>
    </Card>
  );

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
            {t('common.back')}
          </Button>
          
          <div className="page-title">
            <Title level={2} style={{ margin: 0, color: 'white' }}>
              Checkout - {t(`scenarios.${scenario.id}`)}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              {t(`countries.${country.code}`)} • {country.currency}
            </Text>
          </div>
        </div>

        {/* 进度步骤 */}
        {renderPaymentSteps()}

        {/* 主要内容区域 */}
        <Row gutter={[24, 24]} className="payment-row">
          {/* 左侧 - 支付表单 */}
          <Col 
            xs={24} 
            lg={14} 
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {error && (
                <Alert
                  message={t('common.error')}
                  description={error}
                  type="error"
                  showIcon
                  closable
                  className="error-alert"
                />
              )}

              {result && (
                <Alert
                  message={result.success ? 'Payment Initiated' : t('common.error')}
                  description={
                    <div>
                      <div>Status: {result.status}</div>
                      <div>Message: {result.message}</div>
                      {result.merchantTransId && (
                        <div>Transaction ID: {result.merchantTransId}</div>
                      )}
                      {result.sessionId && (
                        <div>Session ID: {result.sessionId}</div>
                      )}
                    </div>
                  }
                  type={result.success ? 'success' : 'error'}
                  showIcon
                  className="result-alert"
                />
              )}

              {!result && renderPaymentForm()}

              {scenario.type === 'dropin' && result?.sessionId && (
                <Card title="Complete Your Payment" className="dropin-card">
                  <Alert
                    message="Secure Payment"
                    description="Your payment will be processed securely using DROPIN integration."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Alert
                    message={t('payment.testCardInfo')}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <DropInComponent
                    key={result.sessionId} // 强制React在sessionId变化时重新挂载组件
                    sessionId={result.sessionId}
                    // 使用当前配置的环境，而不是场景固定的环境
                    environment={config?.currentEnv === 'production' ? 'PROD' : 'UAT'}
                    onPaymentCompleted={(params) => {
                      console.log('Payment completed:', params);
                      // Drop-in支付完成后跳转到结果页面，使用预生成的订单ID并传递金额信息
                      const merchantTransId = currentOrderId || result.merchantTransId || generateMerchantTransId();
                      navigate(`/payment-result?orderId=${merchantTransId}&paymentType=dropin&amount=${currentTotal}&currency=${currentCurrency}`);
                    }}
                    onPaymentFailed={async (params) => {
                      console.log('Payment failed:', params);
                      const errorMessage = params.message || 'Unknown error';
                      setError('Payment failed: ' + errorMessage);
                    }}
                    onPaymentCancelled={(params) => {
                      console.log('Payment cancelled:', params);
                      setResult({ ...result, status: 'cancelled' });
                    }}
                  />
                </Card>
              )}
            </Space>
          </Col>

          {/* 右侧 - 订单摘要 */}
          <Col 
            xs={24} 
            lg={10} 
          >
            {renderOrderSummary()}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PaymentPage;