import React, { useState } from 'react';
import { Tabs, Card, Typography, Row, Col, Avatar, Divider } from 'antd';
import {
  CreditCardOutlined,
  WalletOutlined,
  BankOutlined,
  AppleOutlined,
  GoogleOutlined,
  AlipayOutlined,
  WechatOutlined,
} from '@ant-design/icons';
import './PaymentMethodTabs.css';

const { Text, Title } = Typography;

type PaymentMethodType = 'card' | 'wallet' | 'local';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description?: string;
  available: boolean;
}

const cardMethods: PaymentMethod[] = [
  {
    id: 'visa',
    name: 'Visa',
    icon: <CreditCardOutlined />,
    description: 'Credit/Debit Card',
    available: true,
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    icon: <CreditCardOutlined />,
    description: 'Credit/Debit Card',
    available: true,
  },
];

const walletMethods: PaymentMethod[] = [
  {
    id: 'applepay',
    name: 'Apple Pay',
    icon: <AppleOutlined />,
    description: 'Fast & Secure',
    available: true,
  },
  {
    id: 'googlepay',
    name: 'Google Pay',
    icon: <GoogleOutlined />,
    description: 'Quick Checkout',
    available: true,
  },
];

const localMethods: PaymentMethod[] = [
  {
    id: 'alipay',
    name: 'Alipay',
    icon: <AlipayOutlined />,
    description: '支付宝',
    available: true,
  },
  {
    id: 'wechat',
    name: 'WeChat Pay',
    icon: <WechatOutlined />,
    description: '微信支付',
    available: true,
  },
  {
    id: 'ideal',
    name: 'iDEAL',
    icon: <BankOutlined />,
    description: 'Netherlands',
    available: true,
  },
];

interface PaymentMethodTabsProps {
  onMethodSelect?: (methodId: string) => void;
  selectedMethod?: string;
}

const PaymentMethodTabs: React.FC<PaymentMethodTabsProps> = ({
  onMethodSelect,
  selectedMethod,
}) => {
  const [activeTab, setActiveTab] = useState<PaymentMethodType>('card');

  const renderPaymentMethods = (methods: PaymentMethod[]) => (
    <Row gutter={[12, 12]} className="payment-methods-grid">
      {methods.map((method) => (
        <Col span={12} key={method.id}>
          <Card
            hoverable
            className={`payment-method-card ${selectedMethod === method.id ? 'selected' : ''}`}
            onClick={() => onMethodSelect?.(method.id)}
          >
            <div className="method-content">
              <Avatar
                size={48}
                icon={method.icon}
                className="method-icon"
                style={{
                  backgroundColor: selectedMethod === method.id ? '#1890ff' : '#f0f0f0',
                  color: selectedMethod === method.id ? '#fff' : '#666',
                }}
              />
              <div className="method-info">
                <Text strong style={{ fontSize: '13px' }}>{method.name}</Text>
                {method.description && (
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {method.description}
                  </Text>
                )}
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const items = [
    {
      key: 'card',
      label: (
        <span>
          <CreditCardOutlined />
          银行卡
        </span>
      ),
      children: (
        <div className="tab-content">
          <div className="tab-description">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              使用信用卡或借记卡进行支付
            </Text>
          </div>
          <Divider style={{ margin: '12px 0' }} />
          {renderPaymentMethods(cardMethods)}
        </div>
      ),
    },
    {
      key: 'wallet',
      label: (
        <span>
          <WalletOutlined />
          数字钱包
        </span>
      ),
      children: (
        <div className="tab-content">
          <div className="tab-description">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              使用数字钱包快速支付
            </Text>
          </div>
          <Divider style={{ margin: '12px 0' }} />
          {renderPaymentMethods(walletMethods)}
        </div>
      ),
    },
    {
      key: 'local',
      label: (
        <span>
          <BankOutlined />
          本地支付
        </span>
      ),
      children: (
        <div className="tab-content">
          <div className="tab-description">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              使用本地支付方式
            </Text>
          </div>
          <Divider style={{ margin: '12px 0' }} />
          {renderPaymentMethods(localMethods)}
        </div>
      ),
    },
  ];

  return (
    <Card className="payment-method-tabs-card" bordered={false}>
      <Title level={5} style={{ marginBottom: '16px' }}>
        选择支付方式
      </Title>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as PaymentMethodType)}
        items={items}
        className="payment-method-tabs"
      />
    </Card>
  );
};

export default PaymentMethodTabs;