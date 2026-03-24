import React, { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  Input,
  message,
  Tag,
  Divider,
  Alert,
  Tooltip,
  Modal,
} from 'antd';
import {
  VideoCameraOutlined,
  StopOutlined,
  ShareAltOutlined,
  CopyOutlined,
  CheckOutlined,
  LinkOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import './DemoRecorder.css';

const { Text, Paragraph, Title } = Typography;

interface RecordingStep {
  timestamp: number;
  action: string;
  data?: any;
}

interface DemoRecorderProps {
  /** Callback when recording starts */
  onRecordingStart?: () => void;
  /** Callback when recording stops */
  onRecordingStop?: (recording: RecordingStep[]) => void;
  /** Additional CSS class name */
  className?: string;
}

const DemoRecorder: React.FC<DemoRecorderProps> = ({
  onRecordingStart,
  onRecordingStop,
  className = '',
}) => {
  const [recording, setRecording] = useState(false);
  const [steps, setSteps] = useState<RecordingStep[]>([]);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);

  const handleStartRecording = useCallback(() => {
    setRecording(true);
    setSteps([]);
    setRecordingStartTime(Date.now());
    onRecordingStart?.();
    message.success('Recording started');
  }, [onRecordingStart]);

  const handleStopRecording = useCallback(() => {
    setRecording(false);
    onRecordingStop?.(steps);
    message.success(`Recording stopped. ${steps.length} steps recorded.`);
  }, [onRecordingStop, steps]);

  const handleShare = useCallback(async () => {
    if (steps.length === 0) {
      message.warning('No recording to share');
      return;
    }

    // Generate a shareable link (in a real implementation, this would save to a server)
    const recordingData = {
      steps,
      startTime: recordingStartTime,
      duration: recordingStartTime ? Date.now() - recordingStartTime : 0,
    };

    // Create a base64 encoded string of the recording
    const encodedData = btoa(JSON.stringify(recordingData));
    const url = `${window.location.origin}/demo?recording=${encodedData}`;

    setShareUrl(url);
    setShareModalVisible(true);
  }, [steps, recordingStartTime]);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      message.success('URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error('Failed to copy URL');
    }
  }, [shareUrl]);

  const formatDuration = () => {
    if (!recordingStartTime) return '00:00';
    const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`demo-recorder ${className}`}>
      <Card className="demo-recorder__card" size="small">
        <div className="demo-recorder__header">
          <VideoCameraOutlined className="demo-recorder__icon" />
          <Title level={5} style={{ margin: 0 }}>Demo Recorder</Title>
          {recording && (
            <Tag color="red" icon={<ClockCircleOutlined />}>
              {formatDuration()}
            </Tag>
          )}
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div className="demo-recorder__controls">
            {!recording ? (
              <Button
                type="primary"
                icon={<VideoCameraOutlined />}
                onClick={handleStartRecording}
                block
              >
                Start Recording
              </Button>
            ) : (
              <Button
                danger
                icon={<StopOutlined />}
                onClick={handleStopRecording}
                block
              >
                Stop Recording
              </Button>
            )}
          </div>

          {steps.length > 0 && !recording && (
            <Button
              type="default"
              icon={<ShareAltOutlined />}
              onClick={handleShare}
              block
            >
              Share Recording ({steps.length} steps)
            </Button>
          )}

          {recording && (
            <Alert
              message="Recording in progress"
              description="Interact with the payment demo to record your steps."
              type="info"
              showIcon
            />
          )}

          {steps.length > 0 && (
            <div className="demo-recorder__steps">
              <Text type="secondary">Recorded Steps:</Text>
              <ul className="demo-recorder__steps-list">
                {steps.slice(-5).map((step, index) => (
                  <li key={index} className="demo-recorder__step-item">
                    <Tag color="blue">{step.action}</Tag>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </Text>
                  </li>
                ))}
                {steps.length > 5 && (
                  <li className="demo-recorder__step-more">
                    <Text type="secondary">+{steps.length - 5} more steps</Text>
                  </li>
                )}
              </ul>
            </div>
          )}
        </Space>
      </Card>

      {/* Share Modal */}
      <Modal
        title={
          <Space>
            <LinkOutlined />
            Share Recording
          </Space>
        }
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setShareModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <Paragraph type="secondary">
          Share this link to let others view your recorded demo.
        </Paragraph>

        <Input.Group compact>
          <Input
            style={{ width: 'calc(100% - 80px)' }}
            value={shareUrl}
            readOnly
          />
          <Tooltip title={copied ? 'Copied!' : 'Copy URL'}>
            <Button
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopyUrl}
              type={copied ? 'primary' : 'default'}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </Tooltip>
        </Input.Group>

        <Divider />

        <div className="demo-recorder__share-info">
          <Text strong>Recording Summary:</Text>
          <ul>
            <li>Total steps: {steps.length}</li>
            <li>Duration: {recordingStartTime ? formatDuration() : 'N/A'}</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
};

export default DemoRecorder;
export type { RecordingStep, DemoRecorderProps };