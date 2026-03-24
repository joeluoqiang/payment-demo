import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Alert,
  Divider,
  Tag,
  Select,
  InputNumber,
  Result,
  Descriptions,
  Steps,
} from 'antd';
import {
  ArrowLeftOutlined,
  RollbackOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { RefundResponse } from '../types';
import { apiService } from '../services/api';
import RoleLabel from '../components/RoleLabel';
import FlowIndicator from '../components/FlowIndicator';
import DeveloperTools from '../components/DeveloperTools';
import './RefundPage.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const RefundPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [refundResult, setRefundResult] = useState<RefundResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<any>(null);
  const [responseData, setResponseData] = useState<any>(null);

  // Flow steps for FlowIndicator
  const flowSteps = [
    { id: 'input', label: 'Enter Details', role: 'merchant' as const, description: 'Provide transaction info' },
    { id: 'process', label: 'Process Refund', role: 'evonet' as const, description: 'Submit to payment gateway' },
    { id: 'result', label: 'Confirmation', role: 'merchant' as const, description: 'View refund status' },
  ];

  const generateRefundTransId = () => {
    const timestamp = Math.floor(Date.now() / 1000).toString().slice(-8);
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `ref${timestamp}${random}`;
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError(null);
    setCurrentStep(1);

    try {
      const refundTransId = generateRefundTransId();

      const request = {
        amount: values.amount,
        currency: values.currency,
        merchantTransId: values.merchantTransId,
        refundTransId,
        reason: values.reason,
      };

      setRequestData(request);

      const response = await apiService.createRefund(request);
      setResponseData(response);
      setRefundResult(response);
      setCurrentStep(2);

    } catch (err: any) {
      console.error('Refund error:', err);
      setError(err.response?.data?.message || 'Refund failed. Please try again.');
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setCurrentStep(0);
    setRefundResult(null);
    setError(null);
    setRequestData(null);
    setResponseData(null);
  };

  const renderStatusTag = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return <Tag color="success" icon={<CheckCircleOutlined />}>Success</Tag>;
      case 'pending':
      case 'processing':
        return <Tag color="processing" icon={<ClockCircleOutlined />}>Processing</Tag>;
      case 'failed':
      case 'rejected':
        return <Tag color="error" icon={<CloseCircleOutlined />}>Failed</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const renderForm = () => (
    <Card className="refund-form-card">
      <RoleLabel role="merchant" className="section-role-label" />

      <Title level={4}>
        <RollbackOutlined style={{ marginRight: 8 }} />
        Initiate Refund
      </Title>
      <Paragraph type="secondary">
        Enter the original transaction details to process a refund.
      </Paragraph>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          currency: 'USD',
          reason: 'Customer request',
        }}
      >
        <Form.Item
          name="merchantTransId"
          label="Original Transaction ID"
          rules={[{ required: true, message: 'Please enter the original transaction ID' }]}
        >
          <Input
            size="large"
            placeholder="Enter original transaction ID"
            prefix={<DollarOutlined />}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="amount"
              label="Refund Amount"
              rules={[{ required: true, message: 'Please enter the refund amount' }]}
            >
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                placeholder="0.00"
                min={0.01}
                step={0.01}
                precision={2}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="currency"
              label="Currency"
              rules={[{ required: true, message: 'Please select currency' }]}
            >
              <Select
                size="large"
                options={[
                  { value: 'USD', label: 'USD - US Dollar' },
                  { value: 'EUR', label: 'EUR - Euro' },
                  { value: 'GBP', label: 'GBP - British Pound' },
                  { value: 'JPY', label: 'JPY - Japanese Yen' },
                  { value: 'CNY', label: 'CNY - Chinese Yuan' },
                  { value: 'KRW', label: 'KRW - Korean Won' },
                  { value: 'SGD', label: 'SGD - Singapore Dollar' },
                  { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="reason"
          label="Refund Reason"
          rules={[{ required: true, message: 'Please enter a reason for the refund' }]}
        >
          <Input.TextArea
            size="large"
            placeholder="Enter reason for refund"
            rows={3}
          />
        </Form.Item>

        {error && (
          <Alert
            message="Refund Failed"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              icon={<RollbackOutlined />}
            >
              {loading ? 'Processing Refund...' : 'Submit Refund'}
            </Button>
            <Button
              size="large"
              onClick={handleReset}
            >
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );

  const renderResult = () => (
    <Card className="refund-result-card">
      <RoleLabel role="merchant" className="section-role-label" />

      {refundResult?.success ? (
        <Result
          status="success"
          title="Refund Submitted Successfully"
          subTitle={`Your refund request has been submitted. Transaction ID: ${refundResult.refundTransId}`}
          extra={[
            <Button type="primary" key="new" onClick={handleReset}>
              New Refund
            </Button>,
            <Button key="home" onClick={() => navigate('/')}>
              Back to Home
            </Button>,
          ]}
        >
          <div className="refund-details">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Refund Transaction ID">
                <Text copyable>{refundResult.refundTransId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Original Transaction ID">
                {refundResult.merchantTransId}
              </Descriptions.Item>
              <Descriptions.Item label="Amount">
                {refundResult.currency} {refundResult.amount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {renderStatusTag(refundResult.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Message">
                {refundResult.message}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </Result>
      ) : (
        <Result
          status="error"
          title="Refund Failed"
          subTitle={refundResult?.message || 'Unable to process the refund request.'}
          extra={[
            <Button type="primary" key="retry" onClick={handleReset}>
              Try Again
            </Button>,
            <Button key="home" onClick={() => navigate('/')}>
              Back to Home
            </Button>,
          ]}
        />
      )}
    </Card>
  );

  return (
    <div className="refund-page">
      <div className="refund-container">
        {/* Header */}
        <div className="page-header">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            size="large"
            className="back-button"
          >
            Back
          </Button>

          <div className="page-title">
            <Title level={2} style={{ margin: 0, color: 'white' }}>
              Refund Management
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              Process refunds for completed transactions
            </Text>
          </div>

          <DeveloperTools
            requestData={requestData}
            responseData={responseData}
          />
        </div>

        {/* Steps */}
        <Card className="steps-card">
          <Steps current={currentStep} size="small">
            <Step title="Enter Details" icon={<DollarOutlined />} />
            <Step title="Process Refund" icon={<RollbackOutlined />} />
            <Step title="Confirmation" icon={<CheckCircleOutlined />} />
          </Steps>
        </Card>

        {/* Flow Indicator */}
        <Card className="flow-card">
          <FlowIndicator
            steps={flowSteps}
            currentStep={currentStep === 0 ? 'input' : currentStep === 1 ? 'process' : 'result'}
          />
        </Card>

        {/* Main Content */}
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} lg={16}>
            {currentStep < 2 ? renderForm() : renderResult()}
          </Col>

          {currentStep === 0 && (
            <Col xs={24} lg={8}>
              <Card className="info-card">
                <Title level={5}>Refund Information</Title>
                <Divider />
                <Paragraph>
                  <Text strong>How to process a refund:</Text>
                </Paragraph>
                <ul className="info-list">
                  <li>Enter the original transaction ID from the payment</li>
                  <li>Specify the refund amount (can be partial or full)</li>
                  <li>Select the currency of the original transaction</li>
                  <li>Provide a reason for the refund</li>
                </ul>

                <Divider />

                <Paragraph>
                  <Text strong>Important Notes:</Text>
                </Paragraph>
                <ul className="info-list">
                  <li>Refunds typically take 5-10 business days to appear on the customer's statement</li>
                  <li>Partial refunds are supported</li>
                  <li>A new refund transaction ID will be generated for tracking</li>
                </ul>
              </Card>
            </Col>
          )}
        </Row>
      </div>
    </div>
  );
};

export default RefundPage;