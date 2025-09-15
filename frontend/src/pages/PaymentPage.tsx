import React, { useState } from 'react';
import { Card, Form, Input, Button, Row, Col, Typography, Space, Alert, Divider, Tag, Steps } from 'antd';
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
    price: 89.99,
    quantity: 1,
    description: 'High-quality wireless headphones with noise cancellation'
  },
  {
    id: 2,
    name: 'Smart Fitness Watch',
    price: 199.99,
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

  const generateMerchantTransId = () => {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `demo_${timestamp}_${random}`;
  };

  // 计算订单总额
  const calculateTotal = () => {
    const subtotal = mockProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const shipping = 9.99;
    const tax = subtotal * 0.1; // 10% 税费
    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax
    };
  };

  const orderSummary = calculateTotal();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentStep(1);

    try {
      const merchantTransId = generateMerchantTransId();
      const baseUrl = window.location.origin;
      
      const paymentRequest: PaymentRequest = {
        amount: orderSummary.total,
        currency: country.currency,
        merchantTransId,
        paymentType: scenario.type,
        returnUrl: `${baseUrl}/payment-result?orderId=${merchantTransId}&paymentType=${scenario.type}`,
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
        response = await apiService.createInteraction(paymentRequest);
      }

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
              <Text strong>${product.price}</Text>
            </div>
          </div>
        ))}
      </div>
      
      <Divider style={{ margin: '16px 0' }} />
      
      <div className="price-breakdown">
        <div className="price-row">
          <Text>Subtotal:</Text>
          <Text>${orderSummary.subtotal.toFixed(2)}</Text>
        </div>
        <div className="price-row">
          <Text>Shipping:</Text>
          <Text>${orderSummary.shipping.toFixed(2)}</Text>
        </div>
        <div className="price-row">
          <Text>Tax:</Text>
          <Text>${orderSummary.tax.toFixed(2)}</Text>
        </div>
        <Divider style={{ margin: '12px 0' }} />
        <div className="price-row total-row">
          <Text strong style={{ fontSize: '18px' }}>Total:</Text>
          <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
            {country.currency} {orderSummary.total.toFixed(2)}
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
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            cardNumber: '4761 3600 7211 8507',
            expiryDate: '05/29',
            cvv: '123',
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
                  placeholder="4761 3600 7211 8507"
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
                      placeholder="123"
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
              {loading ? t('payment.processing') : `Pay ${country.currency} ${orderSummary.total.toFixed(2)}`}
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
        <Row gutter={[24, 24]}>
          {/* 左侧 - 支付表单 */}
          <Col xs={24} lg={14}>
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
                    message="Drop-in Payment Component"
                    description="Complete your payment using the secure payment form below"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <DropInComponent
                    sessionId={result.sessionId}
                    environment={scenario.environment}
                    onPaymentCompleted={(params) => {
                      console.log('Payment completed:', params);
                      // Drop-in支付完成后跳转到结果页面，传递支付类型参数
                      const merchantTransId = result.merchantTransId || generateMerchantTransId();
                      navigate(`/payment-result?orderId=${merchantTransId}&paymentType=dropin`);
                    }}
                    onPaymentFailed={(params) => {
                      console.log('Payment failed:', params);
                      setError('Payment failed: ' + (params.message || 'Unknown error'));
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
          <Col xs={24} lg={10}>
            {renderOrderSummary()}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PaymentPage;