import React, { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Tooltip,
  message,
  Empty,
  Typography,
  Collapse,
} from 'antd';
import {
  CopyOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import './DevPanel.css';

const { Text } = Typography;

interface DevPanelProps {
  /** Request data to display */
  requestData?: any;
  /** Response data to display */
  responseData?: any;
  /** Request timestamp */
  requestTime?: Date;
  /** Response timestamp */
  responseTime?: Date;
}

const DevPanel: React.FC<DevPanelProps> = ({
  requestData,
  responseData,
  requestTime,
  responseTime,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const formatJSON = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return 'Invalid JSON';
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      message.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      message.error('Failed to copy');
    }
  };

  const calculateDuration = useMemo(() => {
    if (requestTime && responseTime) {
      const duration = responseTime.getTime() - requestTime.getTime();
      return `${duration}ms`;
    }
    return null;
  }, [requestTime, responseTime]);

  const formatTime = (time?: Date) => {
    if (!time) return null;
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const renderJSONBlock = (
    data: any,
    title: string,
    icon: React.ReactNode,
    time?: Date,
    field: string = 'data'
  ) => {
    const jsonString = formatJSON(data);
    const isEmpty = !data || Object.keys(data).length === 0;

    return (
      <div className="dev-panel-block">
        <div className="dev-panel-block__header">
          <div className="dev-panel-block__title">
            {icon}
            <span>{title}</span>
          </div>
          <div className="dev-panel-block__actions">
            {time && (
              <Tooltip title="Request time">
                <Text type="secondary" className="dev-panel-block__time">
                  <ClockCircleOutlined />
                  {formatTime(time)}
                </Text>
              </Tooltip>
            )}
            {!isEmpty && (
              <Tooltip title="Copy JSON">
                <Button
                  type="text"
                  size="small"
                  icon={
                    copiedField === field ? <CheckOutlined /> : <CopyOutlined />
                  }
                  onClick={() => handleCopy(jsonString, field)}
                  className="dev-panel-block__copy-btn"
                />
              </Tooltip>
            )}
          </div>
        </div>
        <div className="dev-panel-block__content">
          {isEmpty ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No data available"
            />
          ) : (
            <pre className="dev-panel-block__code">
              <code>{jsonString}</code>
            </pre>
          )}
        </div>
      </div>
    );
  };

  const hasData = requestData || responseData;

  return (
    <div className="dev-panel">
      {!hasData ? (
        <Card className="dev-panel-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="dev-panel-empty__content">
                <ApiOutlined className="dev-panel-empty__icon" />
                <Text>No API requests yet</Text>
                <Text type="secondary">
                  Make a payment request to see the data here
                </Text>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          {calculateDuration && (
            <div className="dev-panel-duration">
              <ClockCircleOutlined />
              <span>Duration: {calculateDuration}</span>
            </div>
          )}

          <Collapse
            defaultActiveKey={['request', 'response']}
            ghost
            className="dev-panel-collapse"
            items={[
              {
                key: 'request',
                label: (
                  <span className="dev-panel-collapse__label">
                    <CodeOutlined />
                    Request
                  </span>
                ),
                children: renderJSONBlock(
                  requestData,
                  'Request Payload',
                  <CodeOutlined />,
                  requestTime,
                  'request'
                ),
              },
              {
                key: 'response',
                label: (
                  <span className="dev-panel-collapse__label">
                    <ApiOutlined />
                    Response
                  </span>
                ),
                children: renderJSONBlock(
                  responseData,
                  'Response Data',
                  <ApiOutlined />,
                  responseTime,
                  'response'
                ),
              },
            ]}
          />
        </>
      )}
    </div>
  );
};

export default DevPanel;