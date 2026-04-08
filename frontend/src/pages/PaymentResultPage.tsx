import React, { useState, useEffect } from 'react';
import { Card, Button, Result, Spin, Row, Col, Typography, Space, Tag, Input, InputNumber, Alert, message } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  CreditCardOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useDeveloperMode } from '../context/DeveloperModeContext';
import DeveloperPanel from '../components/DeveloperPanel';
import type { StoredToken } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const { Title, Text, Paragraph } = Typography;

interface PaymentStatus {
  status: string;
  message: string;
  merchantTransId: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  transactionId?: string;
  createTime?: string;
  updateTime?: string;
  // 订阅相关字段
  tokenValue?: string;
  userReference?: string;
}

const PaymentResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { enabled: devModeEnabled, setEnabled: setDevModeEnabled, setSessionId } = useDeveloperMode();

  // 订阅相关状态
  const [isRecurring, setIsRecurring] = useState(false);
  const [storedToken, setStoredToken] = useState<StoredToken | null>(null);
  const [recurringAmount, setRecurringAmount] = useState<number>(10);
  const [recurringCurrency, setRecurringCurrency] = useState<string>('USD');
  const [recurringLoading, setRecurringLoading] = useState(false);
  // 后续订阅支付结果
  const [recurringResult, setRecurringResult] = useState<{ success: boolean; message: string; status?: string; transId?: string } | null>(null);

  // 从URL参数中获取订单号和支付方式
  const getOrderInfoFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return {
      orderId: params.get('orderId'),
      paymentType: params.get('paymentType') || params.get('type'),
      merchantOrderID: params.get('merchantOrderID'),
      amount: params.get('amount'),
      currency: params.get('currency'),
      isRecurring: params.get('isRecurring') === 'true',
      userReference: params.get('userReference'),
      devMode: params.get('devMode') === 'true',
    };
  };

  // 查询支付状态
  const fetchPaymentStatus = async (orderId: string, paymentType?: string, fallbackData?: { amount?: string, currency?: string }) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[PaymentResult] 开始查询支付状态:', { orderId, paymentType, fallbackData });

      let response;

      if (paymentType === 'linkpay' || paymentType === 'dropin') {
        console.log('[PaymentResult] 使用交互状态查询接口 - merchantOrderId:', orderId);
        response = await apiService.getInteractionStatus(orderId);
        console.log('[PaymentResult] 交互状态查询结果:', response);
      } else {
        console.log('[PaymentResult] 使用支付状态查询接口 - merchantTransId:', orderId);
        response = await apiService.getPaymentStatus(orderId);
        console.log('[PaymentResult] 支付状态查询结果:', response);
      }

      if (fallbackData && (!response.amount || response.amount === 0)) {
        if (fallbackData.amount) {
          const amount = parseFloat(fallbackData.amount);
          if (!isNaN(amount)) {
            response.amount = amount;
          }
        }
        if (fallbackData.currency && !response.currency) {
          response.currency = fallbackData.currency;
        }
      }

      setPaymentStatus(response);

      // 如果是订阅支付，设置默认金额为首次支付金额
      if (response.amount) {
        setRecurringAmount(response.amount);
      }
      if (response.currency) {
        setRecurringCurrency(response.currency);
      }

      // 如果响应中包含token，直接使用
      if (response.tokenValue) {
        console.log('[PaymentResult] 从查询响应中获取到Token:', response.tokenValue);
        setStoredToken({
          tokenValue: response.tokenValue,
          userReference: response.userReference || '',
          createdAt: new Date().toISOString(),
        });
      }

    } catch (err: any) {
      console.error('[PaymentResult] 查询支付状态失败:', err);
      const errorMessage = err.response?.data?.message || err.message || '查询支付状态失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 获取保存的token（从后端存储）
  const fetchToken = async (userRef: string) => {
    try {
      const token = await apiService.getToken(userRef);
      if (token) {
        setStoredToken(token);
        console.log('[PaymentResult] 从后端存储获取Token成功:', token);
      }
    } catch (err) {
      console.error('[PaymentResult] 从后端存储获取Token失败:', err);
    }
  };

  useEffect(() => {
    const { orderId, paymentType, merchantOrderID, amount, currency, isRecurring: isRec, userReference: userRef, devMode } = getOrderInfoFromUrl();
    console.log('[PaymentResult] URL参数:', { orderId, paymentType, merchantOrderID, amount, currency, isRec, userRef, devMode });

    // 如果URL中有devMode参数，启用开发者模式
    if (devMode) {
      setDevModeEnabled(true);
    }

    // 设置sessionId以便获取API日志
    if (orderId) {
      setSessionId(orderId);
    }

    // 设置订阅相关状态
    setIsRecurring(isRec);

    if (!orderId) {
      setError('未找到订单号信息');
      setLoading(false);
      return;
    }

    let queryId = orderId;
    if (paymentType === 'linkpay' && merchantOrderID) {
      queryId = merchantOrderID;
    }

    fetchPaymentStatus(queryId, paymentType || undefined, {
      amount: amount || undefined,
      currency: currency || undefined
    });

    // 如果是订阅支付，延迟尝试从后端存储获取token（作为备选方案）
    if (isRec && userRef) {
      // 延迟5秒，给webhook和查询响应处理时间
      setTimeout(() => {
        // 只有当还没有token时才尝试从存储获取
        setStoredToken(prev => {
          if (!prev || !prev.tokenValue) {
            fetchToken(userRef);
          }
          return prev;
        });
      }, 5000);
    }
  }, [location.search]);

  // 发起后续订阅支付
  const handleRecurringPayment = async () => {
    if (!storedToken || !storedToken.tokenValue) {
      message.error('Token not available. Please wait for the webhook to process.');
      return;
    }

    if (!recurringAmount || recurringAmount <= 0) {
      message.error('Please enter a valid amount');
      return;
    }

    setRecurringLoading(true);
    setRecurringResult(null); // 清除之前的结果

    const merchantTransId = 'recurring_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const baseUrl = window.location.origin;

    // 更新sessionId以便获取后续订阅支付的API日志
    console.log('[PaymentResult] 设置新的sessionId用于后续订阅支付:', merchantTransId);
    setSessionId(merchantTransId);

    try {
      const response = await apiService.createRecurringPayment({
        tokenValue: storedToken.tokenValue,
        amount: recurringAmount,
        currency: recurringCurrency,
        merchantTransId,
        returnUrl: `${baseUrl}/payment-result?orderId=${merchantTransId}&paymentType=recurring&amount=${recurringAmount}&currency=${recurringCurrency}${devModeEnabled ? '&devMode=true' : ''}`,
        webhookUrl: `${API_BASE_URL}/api/v1/payment/webhook`,
      });

      console.log('[PaymentResult] 后续订阅支付响应:', response);

      if (response.success) {
        const statusText = response.status?.toLowerCase() === 'captured' ? 'Captured' : response.status || 'Success';
        setRecurringResult({
          success: true,
          message: response.message || 'Payment completed successfully!',
          status: statusText,
          transId: response.merchantTransId,
        });
        message.success('Subsequent subscription payment successful!');
      } else {
        setRecurringResult({
          success: false,
          message: response.message || 'Payment failed',
        });
        message.error(`Payment failed: ${response.message}`);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Payment failed';
      setRecurringResult({
        success: false,
        message: errorMsg,
      });
      message.error(`Payment failed: ${errorMsg}`);
    } finally {
      setRecurringLoading(false);
    }
  };

  const handleRetry = () => {
    const { orderId, paymentType } = getOrderInfoFromUrl();
    if (orderId) {
      fetchPaymentStatus(orderId, paymentType || undefined);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'paid':
      case 'captured':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 64 }} />;
      case 'failed':
      case 'error':
      case 'declined':
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 64 }} />;
      case 'pending':
      case 'processing':
        return <ClockCircleOutlined style={{ color: '#1890ff', fontSize: 64 }} />;
      case 'unknown':
        return <InfoCircleOutlined style={{ color: '#faad14', fontSize: 64 }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#faad14', fontSize: 64 }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'paid':
      case 'captured':
        return 'success';
      case 'failed':
      case 'error':
      case 'declined':
        return 'error';
      case 'pending':
      case 'processing':
        return 'processing';
      case 'unknown':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusTitle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'paid':
      case 'captured':
        return 'Payment Successful';
      case 'failed':
      case 'error':
      case 'declined':
        return 'Payment Failed';
      case 'pending':
      case 'processing':
        return 'Payment Processing';
      case 'unknown':
        return 'Payment Status Unknown';
      default:
        return 'Payment Status';
    }
  };

  const getStatusDescription = (status: string, message: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'paid':
      case 'captured':
        return 'Your payment has been processed successfully. Thank you for your purchase!';
      case 'failed':
      case 'error':
      case 'declined':
        return `Payment failed: ${message || 'Please try again or contact support.'}`;
      case 'pending':
      case 'processing':
        return 'Your payment is being processed. Please wait a moment.';
      case 'unknown':
        return 'This is a demo payment. In demo mode, the payment status cannot be verified from the payment gateway. In production, you would see the actual payment status here.';
      default:
        return message || 'Please check your payment status or contact support.';
    }
  };

  if (loading) {
    return (
      <div className="payment-result-page">
        <div className="result-container">
          <Card className="result-card">
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
              <Text style={{ display: 'block', marginTop: 16, fontSize: 16 }}>
                Checking payment status...
              </Text>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-result-page">
        <div className="result-container">
          <Card className="result-card">
            <Result
              status="error"
              title="Unable to Check Payment Status"
              subTitle={error}
              extra={[
                <Button type="primary" onClick={handleRetry} icon={<ReloadOutlined />} key="retry">
                  Retry
                </Button>,
                <Button onClick={handleBackToHome} icon={<HomeOutlined />} key="home">
                  Back to Home
                </Button>,
              ]}
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-page">
      <div className="result-container">
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={24}>
            <Card className="result-card">
              {/* 开发者模式开关 */}
              <div style={{ textAlign: 'right', marginBottom: 16 }}>
                <Tag
                  icon={<CodeOutlined />}
                  color={devModeEnabled ? 'blue' : 'default'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setDevModeEnabled(!devModeEnabled)}
                >
                  {devModeEnabled ? 'Dev Mode ON' : 'Dev Mode OFF'}
                </Tag>
              </div>

              <div className="result-header">
                <div className="status-icon">
                  {getStatusIcon(paymentStatus?.status || '')}
                </div>
                <Title level={2} className="status-title">
                  {getStatusTitle(paymentStatus?.status || '')}
                </Title>
                <Paragraph className="status-description">
                  {getStatusDescription(paymentStatus?.status || '', paymentStatus?.message || '')}
                </Paragraph>
              </div>

          {paymentStatus && (
            <div className="payment-details">
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card size="small" title="Payment Details" className="details-card">
                    <Row gutter={[16, 8]}>
                      <Col span={12}>
                        <Text strong>Order ID:</Text>
                      </Col>
                      <Col span={12}>
                        <Text code>{paymentStatus.merchantTransId}</Text>
                      </Col>

                      <Col span={12}>
                        <Text strong>Status:</Text>
                      </Col>
                      <Col span={12}>
                        <Tag color={getStatusColor(paymentStatus.status)}>
                          {paymentStatus.status?.toUpperCase()}
                        </Tag>
                      </Col>

                      {(paymentStatus.amount !== undefined && paymentStatus.amount !== null && paymentStatus.amount !== 0) && (
                        <>
                          <Col span={12}>
                            <Text strong>Amount:</Text>
                          </Col>
                          <Col span={12}>
                            <Text>{paymentStatus.currency || 'USD'} {paymentStatus.amount}</Text>
                          </Col>
                        </>
                      )}

                      {paymentStatus.paymentMethod && (
                        <>
                          <Col span={12}>
                            <Text strong>Payment Method:</Text>
                          </Col>
                          <Col span={12}>
                            <Text>{paymentStatus.paymentMethod}</Text>
                          </Col>
                        </>
                      )}

                      {paymentStatus.transactionId && (
                        <>
                          <Col span={12}>
                            <Text strong>Transaction ID:</Text>
                          </Col>
                          <Col span={12}>
                            <Text code>{paymentStatus.transactionId}</Text>
                          </Col>
                        </>
                      )}

                      {paymentStatus.createTime && (
                        <>
                          <Col span={12}>
                            <Text strong>Created:</Text>
                          </Col>
                          <Col span={12}>
                            <Text>{new Date(paymentStatus.createTime).toLocaleString()}</Text>
                          </Col>
                        </>
                      )}

                      {paymentStatus.updateTime && (
                        <>
                          <Col span={12}>
                            <Text strong>Updated:</Text>
                          </Col>
                          <Col span={12}>
                            <Text>{new Date(paymentStatus.updateTime).toLocaleString()}</Text>
                          </Col>
                        </>
                      )}
                    </Row>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          <div className="result-actions">
            <Space size="large" direction="vertical" style={{ width: '100%' }}>
              {/* 订阅支付成功后显示后续订阅支付功能 */}
              {isRecurring && paymentStatus?.status?.toLowerCase() === 'captured' && (
                <Card className="recurring-payment-card" title={<><SyncOutlined /> Subsequent Subscription Payment</>} style={{ marginBottom: 16 }}>
                  <Alert
                    message="Token Available"
                    description={storedToken ? `Your payment token has been saved. Use it to make subsequent subscription payments.` : 'Waiting for token from webhook...'}
                    type={storedToken ? 'success' : 'info'}
                    showIcon
                    style={{ marginBottom: 16 }}
                  />

                  {storedToken && (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Token: <Text code>{storedToken.tokenValue.substring(0, 20)}...</Text>
                        </Text>
                      </div>

                      <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={12}>
                          <Text strong>Amount:</Text>
                          <InputNumber
                            style={{ width: '100%', marginTop: 4 }}
                            value={recurringAmount}
                            onChange={(value) => setRecurringAmount(value || 0)}
                            min={0.01}
                            step={0.01}
                            prefix="$"
                          />
                        </Col>
                        <Col span={12}>
                          <Text strong>Currency:</Text>
                          <Input
                            style={{ marginTop: 4 }}
                            value={recurringCurrency}
                            onChange={(e) => setRecurringCurrency(e.target.value.toUpperCase())}
                            maxLength={3}
                            placeholder="USD"
                          />
                        </Col>
                      </Row>

                      <Button
                        type="primary"
                        block
                        loading={recurringLoading}
                        onClick={handleRecurringPayment}
                        icon={<CreditCardOutlined />}
                      >
                        Pay {recurringCurrency} {recurringAmount} with Token
                      </Button>

                      {/* 后续订阅支付结果 */}
                      {recurringResult && (
                        <Alert
                          message={recurringResult.success ? 'Subsequent Subscription Payment Successful' : 'Payment Failed'}
                          description={
                            <div>
                              <div><strong>Status:</strong> {recurringResult.status || (recurringResult.success ? 'Captured' : 'Failed')}</div>
                              <div><strong>Message:</strong> {recurringResult.message}</div>
                              {recurringResult.transId && <div><strong>Transaction ID:</strong> {recurringResult.transId}</div>}
                              <div><strong>Amount:</strong> {recurringCurrency} {recurringAmount}</div>
                            </div>
                          }
                          type={recurringResult.success ? 'success' : 'error'}
                          showIcon
                          style={{ marginTop: 16 }}
                        />
                      )}
                    </>
                  )}
                </Card>
              )}

              <Space size="large">
                {paymentStatus?.status?.toLowerCase() === 'pending' && (
                  <Button
                    type="default"
                    onClick={handleRetry}
                    icon={<ReloadOutlined />}
                    size="large"
                  >
                    Refresh Status
                  </Button>
                )}
                <Button
                  type="primary"
                  onClick={handleBackToHome}
                  icon={<HomeOutlined />}
                  size="large"
                  className="home-button"
                >
                  Back to Home
                </Button>
              </Space>
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

export default PaymentResultPage;