import React from 'react';
import { Card, Button, Tag, Space, Alert, Typography, Empty } from 'antd';
import {
  CodeOutlined,
  ClearOutlined,
  RightOutlined,
  SendOutlined,
  ArrowRightOutlined,
  CopyOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { useDeveloperMode } from '../context/DeveloperModeContext';
import { apiService } from '../services/api';
import type { ApiLogEntry } from '../types';

const { Text, Paragraph } = Typography;

const ApiLogCard: React.FC<{ log: ApiLogEntry }> = ({ log }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const text = JSON.stringify(log.body || log, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'default';
    if (status >= 200 && status < 300) return 'success';
    if (status >= 400) return 'error';
    return 'warning';
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'blue';
      case 'POST': return 'green';
      case 'PUT': return 'orange';
      case 'DELETE': return 'red';
      default: return 'default';
    }
  };

  return (
    <div className="api-log-item" style={{ marginBottom: 12, border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
      <div
        style={{
          padding: '10px 16px',
          background: log.type === 'request' ? '#e6f7ff' : '#f6ffed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Space>
          <Tag color={log.type === 'request' ? 'blue' : 'green'}>
            {log.type === 'request' ? <SendOutlined /> : <RightOutlined />} {log.type.toUpperCase()}
          </Tag>
          <Tag color={getMethodColor(log.method)}>{log.method}</Tag>
          <Text strong style={{ fontSize: 13 }}>{log.apiName}</Text>
        </Space>
        <Space>
          {log.status && (
            <Tag color={getStatusColor(log.status)}>{log.status}</Tag>
          )}
          <Text type="secondary" style={{ fontSize: 12 }}>
            {new Date(log.timestamp).toLocaleTimeString()}
          </Text>
          {log.duration && (
            <Text type="secondary" style={{ fontSize: 12 }}>{log.duration}ms</Text>
          )}
        </Space>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>URL: </Text>
          <Text code style={{ fontSize: 12, wordBreak: 'break-all' }}>{log.url}</Text>
        </div>
        {log.headers && Object.keys(log.headers).length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Headers:</Text>
            <pre style={{
              background: '#fafafa',
              padding: 10,
              borderRadius: 4,
              fontSize: 12,
              maxHeight: 120,
              overflow: 'auto',
              margin: '6px 0',
              border: '1px solid #f0f0f0'
            }}>
              {JSON.stringify(log.headers, null, 2)}
            </pre>
          </div>
        )}
        {log.body && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Body:</Text>
              <Button
                size="small"
                type="text"
                icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={handleCopy}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <pre style={{
              background: '#fafafa',
              padding: 10,
              borderRadius: 4,
              fontSize: 12,
              maxHeight: 350,
              overflow: 'auto',
              margin: 0,
              border: '1px solid #f0f0f0'
            }}>
              {JSON.stringify(log.body, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const DeveloperPanel: React.FC = () => {
  const { enabled, logs, sessionId, pendingRedirect, executeRedirect, fetchLogs } = useDeveloperMode();
  const [clearing, setClearing] = React.useState(false);

  if (!enabled) return null;

  const handleClearLogs = async () => {
    if (!sessionId) return;
    setClearing(true);
    await apiService.clearApiLogs(sessionId);
    await fetchLogs();
    setClearing(false);
  };

  return (
    <Card
      className="developer-panel"
      title={
        <Space>
          <CodeOutlined />
          <span>Developer Mode - Evonet API Logs</span>
          <Tag color="blue">{logs.length} logs</Tag>
          {sessionId && <Tag color="green">Session: {sessionId.substring(0, 15)}...</Tag>}
        </Space>
      }
      extra={
        <Space>
          <Button size="small" onClick={fetchLogs}>
            Refresh
          </Button>
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={handleClearLogs}
            loading={clearing}
          >
            Clear
          </Button>
        </Space>
      }
      style={{ marginTop: 24 }}
      bodyStyle={{ maxHeight: 500, overflow: 'auto' }}
    >
      {/* Pending redirect alert */}
      {pendingRedirect && (
        <Alert
          type="warning"
          message="Redirect Pending"
          description={
            <div>
              <Paragraph style={{ marginBottom: 8, fontSize: 13 }}>
                The payment requires a redirect to complete. Click below to proceed.
              </Paragraph>
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={executeRedirect}
              >
                {pendingRedirect.label}
              </Button>
            </div>
          }
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* API Logs */}
      {logs.length === 0 ? (
        <Empty
          description="No API logs yet. Make a payment request to see Evonet API interactions."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: 20, marginBottom: 20 }}
        />
      ) : (
        <div className="api-logs-container">
          {logs.map((log) => (
            <ApiLogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </Card>
  );
};

export default DeveloperPanel;