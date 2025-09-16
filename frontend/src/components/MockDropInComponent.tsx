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
          message: '模拟支付被拒绝（用于演示）',
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
      title="模拟 Drop-in 支付组件" 
      style={{ maxWidth: 500, margin: '0 auto' }}
      extra={
        <Alert 
          message="模拟模式" 
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
          label="支付金额"
          rules={[{ required: true, message: '请输入支付金额' }]}
        >
          <Input
            prefix="$"
            placeholder="100"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="paymentMethod"
          label="支付方式"
          rules={[{ required: true, message: '请选择支付方式' }]}
        >
          <Select size="large" placeholder="选择支付方式">
            <Option value="credit_card">信用卡</Option>
            <Option value="debit_card">借记卡</Option>
            <Option value="paypal">PayPal</Option>
            <Option value="apple_pay">Apple Pay</Option>
            <Option value="google_pay">Google Pay</Option>
          </Select>
        </Form.Item>

        {form.getFieldValue('paymentMethod')?.includes('card') && (
          <>
            <Form.Item
              name="cardNumber"
              label="卡号"
              rules={[{ required: true, message: '请输入卡号' }]}
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
                label="有效期"
                style={{ flex: 1 }}
                rules={[{ required: true, message: '请输入有效期' }]}
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
                rules={[{ required: true, message: '请输入CVV' }]}
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
            {loading ? '处理中...' : '立即支付'}
          </Button>
          
          <Button 
            onClick={handleCancel} 
            disabled={loading}
            size="large"
          >
            取消支付
          </Button>
        </Space>
      </Form>

      <div style={{ marginTop: 16, fontSize: 12, color: '#666', textAlign: 'center' }}>
        <div>环境: {environment}</div>
        <div>这是一个模拟的Drop-in组件，用于演示支付流程</div>
      </div>
    </Card>
  );
};

export default MockDropInComponent;