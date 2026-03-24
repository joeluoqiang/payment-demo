import React from 'react';
import { Radio, Space, Typography, Card } from 'antd';
import {
  CreditCardOutlined,
  SyncOutlined,
  RollbackOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ScenarioType } from '../types';
import './ScenarioSelector.css';

const { Text } = Typography;

interface ScenarioOption {
  value: ScenarioType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const scenarioOptions: ScenarioOption[] = [
  {
    value: 'payment',
    label: 'One-time Payment',
    description: 'Single payment transaction',
    icon: <CreditCardOutlined />,
  },
  {
    value: 'subscription',
    label: 'Subscription',
    description: 'Recurring billing plans',
    icon: <SyncOutlined />,
  },
  {
    value: 'refund',
    label: 'Refund',
    description: 'Process refunds for transactions',
    icon: <RollbackOutlined />,
  },
  {
    value: 'error',
    label: 'Error Handling',
    description: 'Simulate error scenarios',
    icon: <WarningOutlined />,
  },
];

interface ScenarioSelectorProps {
  /** Currently selected scenario */
  value?: ScenarioType;
  /** Callback when scenario changes */
  onChange?: (value: ScenarioType) => void;
  /** Additional CSS class name */
  className?: string;
  /** Whether to show descriptions */
  showDescriptions?: boolean;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
}

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  value = 'payment',
  onChange,
  className = '',
  showDescriptions = true,
  direction = 'horizontal',
}) => {
  return (
    <Card className={`scenario-selector ${className}`} size="small">
      <Radio.Group
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="scenario-selector__group"
      >
        <Space direction={direction === 'vertical' ? 'vertical' : 'horizontal'} wrap>
          {scenarioOptions.map((option) => (
            <Radio.Button
              key={option.value}
              value={option.value}
              className={`scenario-selector__option ${value === option.value ? 'scenario-selector__option--active' : ''}`}
            >
              <Space size="small">
                <span className="scenario-selector__icon">{option.icon}</span>
                <span className="scenario-selector__label">{option.label}</span>
              </Space>
              {showDescriptions && (
                <Text className="scenario-selector__description" type="secondary">
                  {option.description}
                </Text>
              )}
            </Radio.Button>
          ))}
        </Space>
      </Radio.Group>
    </Card>
  );
};

export default ScenarioSelector;
export type { ScenarioType };