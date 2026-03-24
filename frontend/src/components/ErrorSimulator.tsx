import React, { useState } from 'react';
import {
  Card,
  Select,
  Button,
  Typography,
  Space,
  Alert,
  Divider,
} from 'antd';
import {
  BugOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import './ErrorSimulator.css';

const { Text, Paragraph } = Typography;
const { Option } = Select;

interface ErrorScenario {
  key: string;
  label: string;
  description: string;
  errorCode: string;
  errorMessage: string;
  suggestedAction: string;
}

const ERROR_SCENARIOS: ErrorScenario[] = [
  {
    key: 'UNSUPPORTED_CURRENCY',
    label: 'Unsupported Currency (KPW)',
    description: 'Transaction with unsupported currency code',
    errorCode: 'CURRENCY_NOT_SUPPORTED',
    errorMessage:
      'The currency "KPW" (North Korean Won) is not supported for this transaction.',
    suggestedAction:
      'Please use a supported currency such as USD, EUR, or GBP.',
  },
  {
    key: 'INSUFFICIENT_BALANCE',
    label: 'Insufficient Balance',
    description: 'Card has insufficient funds for the transaction',
    errorCode: 'INSUFFICIENT_FUNDS',
    errorMessage:
      'The transaction was declined due to insufficient funds in the account.',
    suggestedAction:
      'Please try a different payment method or ensure sufficient balance.',
  },
  {
    key: 'CARD_DECLINED',
    label: 'Card Declined',
    description: 'Card is declined by the issuing bank',
    errorCode: 'CARD_DECLINED',
    errorMessage:
      'Your card was declined. Please contact your card issuer for more information.',
    suggestedAction:
      'Try using a different card or contact your bank to resolve this issue.',
  },
  {
    key: '3DS_FAILED',
    label: '3D Secure Failed',
    description: '3D Secure authentication failed',
    errorCode: '3DS_AUTHENTICATION_FAILED',
    errorMessage:
      '3D Secure authentication was not completed successfully. The transaction cannot proceed.',
    suggestedAction:
      'Please retry the payment and complete the 3D Secure verification.',
  },
];

interface ErrorSimulatorProps {
  /** Callback when an error is triggered */
  onErrorTrigger?: (error: ErrorScenario) => void;
}

const ErrorSimulator: React.FC<ErrorSimulatorProps> = ({
  onErrorTrigger,
}) => {
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [triggeredError, setTriggeredError] = useState<ErrorScenario | null>(
    null
  );

  const handleSelectChange = (value: string) => {
    setSelectedError(value);
    setTriggeredError(null);
  };

  const handleTriggerError = () => {
    if (!selectedError) return;

    const error = ERROR_SCENARIOS.find((e) => e.key === selectedError);
    if (error) {
      setTriggeredError(error);
      onErrorTrigger?.(error);
    }
  };

  const handleClear = () => {
    setSelectedError(null);
    setTriggeredError(null);
  };

  const selectedScenario = ERROR_SCENARIOS.find((e) => e.key === selectedError);

  return (
    <div className="error-simulator">
      <Card className="error-simulator__card" size="small">
        <div className="error-simulator__header">
          <BugOutlined className="error-simulator__header-icon" />
          <Text strong>Error Scenario Simulator</Text>
        </div>
        <Paragraph type="secondary" className="error-simulator__description">
          Select an error scenario to simulate different payment failure
          conditions. This helps test error handling in your integration.
        </Paragraph>

        <Divider style={{ margin: '16px 0' }} />

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div className="error-simulator__select-wrapper">
            <Text className="error-simulator__label">Error Type:</Text>
            <Select
              placeholder="Select an error scenario"
              value={selectedError}
              onChange={handleSelectChange}
              style={{ width: '100%' }}
              size="large"
            >
              {ERROR_SCENARIOS.map((scenario) => (
                <Option key={scenario.key} value={scenario.key}>
                  <Space>
                    <WarningOutlined style={{ color: '#faad14' }} />
                    {scenario.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </div>

          {selectedScenario && (
            <Alert
              type="info"
              icon={<InfoCircleOutlined />}
              message={selectedScenario.description}
              showIcon
              className="error-simulator__info"
            />
          )}

          <div className="error-simulator__actions">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleTriggerError}
              disabled={!selectedError}
              danger
            >
              Trigger Error
            </Button>
            <Button onClick={handleClear} disabled={!selectedError}>
              Clear
            </Button>
          </div>
        </Space>
      </Card>

      {triggeredError && (
        <Card className="error-simulator__result" size="small">
          <Alert
            type="error"
            message={`Error: ${triggeredError.errorCode}`}
            description={
              <div className="error-simulator__error-details">
                <Paragraph>
                  <Text strong>Message:</Text>
                  <br />
                  {triggeredError.errorMessage}
                </Paragraph>
                <Paragraph style={{ marginBottom: 0 }}>
                  <Text strong>Suggested Action:</Text>
                  <br />
                  {triggeredError.suggestedAction}
                </Paragraph>
              </div>
            }
            showIcon
          />
        </Card>
      )}
    </div>
  );
};

export default ErrorSimulator;
export { ERROR_SCENARIOS };
export type { ErrorScenario };