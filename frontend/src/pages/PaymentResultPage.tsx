import React, { useState, useEffect } from 'react';
import { Card, Button, Result, Spin, Row, Col, Typography, Space, Tag } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  HomeOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

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
}

const PaymentResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 从URL参数中获取订单号和支付方式
  const getOrderInfoFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return {
      orderId: params.get('orderId'),
      paymentType: params.get('paymentType') || params.get('type'), // 兼容两种参数名
      merchantOrderID: params.get('merchantOrderID'), // LinkPay返回的订单ID
    };
  };

  // 查询支付状态
  const fetchPaymentStatus = async (orderId: string, paymentType?: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[PaymentResult] 开始查询支付状态:', { orderId, paymentType });
      
      let response;
      
      // 根据支付类型调用不同API
      if (paymentType === 'linkpay' || paymentType === 'dropin') {
        // LinkPay和Drop-in使用交互状态查询接口
        console.log('[PaymentResult] 使用交互状态查询接口 - merchantOrderId:', orderId);
        response = await apiService.getInteractionStatus(orderId);
        console.log('[PaymentResult] 交互状态查询结果:', response);
      } else {
        // Direct API使用支付状态查询接口
        console.log('[PaymentResult] 使用支付状态查询接口 - merchantTransId:', orderId);
        response = await apiService.getPaymentStatus(orderId);
        console.log('[PaymentResult] 支付状态查询结果:', response);
      }
      
      setPaymentStatus(response);
      console.log('[PaymentResult] 状态设置成功:', response);
    } catch (err: any) {
      console.error('[PaymentResult] 查询支付状态失败:', {
        orderId,
        paymentType,
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        message: err.message
      });
      const errorMessage = err.response?.data?.message || err.message || '查询支付状态失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { orderId, paymentType, merchantOrderID } = getOrderInfoFromUrl();
    console.log('[PaymentResult] URL参数:', { orderId, paymentType, merchantOrderID });
    
    if (!orderId) {
      setError('未找到订单号信息');
      setLoading(false);
      return;
    }
    
    // 对于LinkPay，优先使用merchantOrderID作为查询ID
    let queryId = orderId;
    if (paymentType === 'linkpay' && merchantOrderID) {
      queryId = merchantOrderID;
      console.log('[PaymentResult] LinkPay使用merchantOrderID作为查询ID:', queryId);
    }
    
    // 使用API查询支付状态
    fetchPaymentStatus(queryId, paymentType || undefined);
  }, [location.search]);

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
        <Card className="result-card">
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

                      {paymentStatus.amount && (
                        <>
                          <Col span={12}>
                            <Text strong>Amount:</Text>
                          </Col>
                          <Col span={12}>
                            <Text>{paymentStatus.currency} {paymentStatus.amount}</Text>
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
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentResultPage;