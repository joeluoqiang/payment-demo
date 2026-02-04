import React, { useState } from 'react';
import { Button, Card, Form, Input, Select, Alert, Space } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';

const { Option } = Select;

interface MockDropInComponentProps {
  sessionId: string;
  environment: string;
  onPaymentCompleted?: (result: any) => void;
  onPaymentFailed?: (result: any) => void;
  onPaymentCancelled?: (result: any) => void;
}

const MockDropInComponent: React.FC<MockDropInComponentProps> = ({
  sessionId,
  environment,
  onPaymentCompleted,
  onPaymentFailed,
  onPaymentCancelled,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 组件初始化时记录日志
  React.useEffect(() => {
    console.log('[DropIn] Current index.min.js source: Local mock component (not using external index.min.js)');
    console.log('[DropIn] Mock component environment:', environment);
    console.log('[DropIn] Mock component session ID:', sessionId);
  }, [environment, sessionId]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    
    console.log('Mock Drop-in payment processing:', values);
    
    // 模拟支付处理时间
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% 成功率
      
      if (success) {
        const result = {
          type: 'payment_completed',
          merchantTransID: 'mock_' + Date.now(),
          sessionID: sessionId,
          amount: values.amount || '100.00',
          currency: 'USD',
          paymentMethod: values.paymentMethod,
          timestamp: new Date().toISOString()
        };
        console.log('Mock payment completed:', result);
        onPaymentCompleted?.(result);
      } else {
          const result = {
            type: 'payment_failed',
            merchantTransID: 'mock_' + Date.now(),
            sessionID: sessionId,
            code: 'MOCK_DECLINED',
            message: 'Mock payment declined (for demonstration)',
            timestamp: new Date().toISOString()
          };
          console.log('Mock payment failed:', result);
          onPaymentFailed?.(result);
        }
      
      setLoading(false);
    }, 2000);
  };

  const handleCancel = () => {
    const result = {
      type: 'payment_cancelled',
      sessionID: sessionId,
    };
    onPaymentCancelled?.(result);
  };

  return (
    <Card 
      title="Mock Drop-in Payment Component" 
      style={{ maxWidth: 500, margin: '0 auto' }}
      extra={
        <Alert 
          message="Mock Mode" 
          description={`Session ID: ${sessionId}`}
          type="info"
        />
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          amount: '100',
          paymentMethod: 'credit_card',
        }}
      >
        <Form.Item
          name="amount"
          label="Amount"
          rules={[{ required: true, message: 'Please enter payment amount' }]}
        >
          <Input
            prefix="$"
            placeholder="100"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="paymentMethod"
          label="Payment Method"
          rules={[{ required: true, message: 'Please select payment method' }]}
        >
          <Select size="large" placeholder="Select payment method">
            <Option value="credit_card">Credit Card</Option>
            <Option value="debit_card">Debit Card</Option>
            <Option value="paypal">PayPal</Option>
            <Option value="apple_pay">Apple Pay</Option>
            <Option value="google_pay">Google Pay</Option>
          </Select>
        </Form.Item>

        {form.getFieldValue('paymentMethod')?.includes('card') && (
          <>
            <Form.Item
              name="cardNumber"
              label="Card Number"
              rules={[{ required: true, message: 'Please enter card number' }]}
            >
              <Input
                placeholder="4895 3301 1111 1119"
                size="large"
                maxLength={19}
              />
            </Form.Item>

            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                name="expiryDate"
                label="Expiry Date"
                style={{ flex: 1 }}
                rules={[{ required: true, message: 'Please enter expiry date' }]}
              >
                <Input
                  placeholder="MM/YY"
                  size="large"
                  maxLength={5}
                />
              </Form.Item>

              <Form.Item
                name="cvv"
                label="CVV"
                style={{ flex: 1 }}
                rules={[{ required: true, message: 'Please enter CVV' }]}
              >
                <Input
                  placeholder="390"
                  size="large"
                  maxLength={4}
                />
              </Form.Item>
            </div>
          </>
        )}

        <Space style={{ width: '100%', justifyContent: 'center' }} size="middle">
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<CreditCardOutlined />}
            size="large"
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </Button>
          
          <Button 
            onClick={handleCancel} 
            disabled={loading}
            size="large"
          >
            Cancel Payment
          </Button>
        </Space>
      </Form>

      <div style={{ marginTop: 16, fontSize: 12, color: '#666', textAlign: 'center' }}>
        <div>Environment: {environment}</div>
        <div>This is a mock Drop-in component for demonstrating the payment flow</div>
      </div>
    </Card>
  );
};

export default MockDropInComponent;