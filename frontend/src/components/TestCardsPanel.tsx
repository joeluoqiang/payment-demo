import React, { useState } from 'react';
import { Button, Space, Typography, Tooltip, message, Badge } from 'antd';
import {
  CopyOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ExpandOutlined,
  CompressOutlined,
} from '@ant-design/icons';
import './TestCardsPanel.css';

const { Text } = Typography;

interface TestCard {
  number: string;
  scenario: 'success' | '3ds' | 'failure';
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const testCards: TestCard[] = [
  {
    number: '4242 4242 4242 4242',
    scenario: 'success',
    label: '支付成功',
    description: '标准成功流程',
    icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    color: '#52c41a',
  },
  {
    number: '4000 0027 6000 3184',
    scenario: '3ds',
    label: '3DS 验证',
    description: '需要3D Secure验证',
    icon: <WarningOutlined style={{ color: '#faad14' }} />,
    color: '#faad14',
  },
  {
    number: '4000 0000 0000 9995',
    scenario: 'failure',
    label: '支付失败',
    description: '余额不足/被拒绝',
    icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
    color: '#ff4d4f',
  },
];

interface TestCardsPanelProps {
  onFillCard?: (cardNumber: string) => void;
  visible?: boolean;
}

const TestCardsPanel: React.FC<TestCardsPanelProps> = ({ onFillCard, visible = true }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [copiedCard, setCopiedCard] = useState<string | null>(null);

  // 仅在 Demo 环境显示
  const isDemo = import.meta.env.MODE !== 'production' || import.meta.env.VITE_SHOW_TEST_PANEL === 'true';

  if (!visible || !isDemo) {
    return null;
  }

  const handleCopy = async (cardNumber: string) => {
    try {
      await navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''));
      setCopiedCard(cardNumber);
      message.success('卡号已复制');
      setTimeout(() => setCopiedCard(null), 2000);
    } catch (err) {
      message.error('复制失败');
    }
  };

  const handleFill = (cardNumber: string) => {
    if (onFillCard) {
      onFillCard(cardNumber);
      message.success('卡号已填入表单');
    }
  };

  return (
    <div className={`test-cards-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="panel-header" onClick={() => setCollapsed(!collapsed)}>
        <Space>
          <CreditCardOutlined className="panel-icon" />
          <Text strong className="panel-title">测试卡号</Text>
          <Badge count={testCards.length} style={{ backgroundColor: '#1890ff' }} />
        </Space>
        <Button
          type="text"
          size="small"
          icon={collapsed ? <ExpandOutlined /> : <CompressOutlined />}
          className="collapse-btn"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
        />
      </div>

      {!collapsed && (
        <div className="panel-content">
          {testCards.map((card, index) => (
            <div key={index} className="test-card-item">
              <div className="card-header">
                <Space>
                  {card.icon}
                  <Text strong style={{ fontSize: '13px' }}>{card.label}</Text>
                </Space>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {card.description}
                </Text>
              </div>
              
              <div className="card-number-row">
                <div className="card-number" style={{ borderLeft: `3px solid ${card.color}` }}>
                  <Text copyable={{ text: card.number.replace(/\s/g, '') }}>
                    {card.number}
                  </Text>
                </div>
                
                <Space size="small" className="card-actions">
                  <Tooltip title="复制卡号">
                    <Button
                      size="small"
                      type={copiedCard === card.number ? 'primary' : 'default'}
                      icon={copiedCard === card.number ? <CheckCircleOutlined /> : <CopyOutlined />}
                      onClick={() => handleCopy(card.number)}
                    />
                  </Tooltip>
                  
                  {onFillCard && (
                    <Tooltip title="填入表单">
                      <Button
                        size="small"
                        type="primary"
                        ghost
                        onClick={() => handleFill(card.number)}
                      >
                        填充
                      </Button>
                    </Tooltip>
                  )}
                </Space>
              </div>
            </div>
          ))}
          
          <div className="panel-footer">
            <Text type="secondary" style={{ fontSize: '11px' }}>
              💡 点击"填充"自动填入表单
            </Text>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCardsPanel;