import React, { useState, useMemo } from 'react';
import {
  Card,
  Select,
  Button,
  Typography,
  Space,
  Tooltip,
  message,
} from 'antd';
import {
  CodeOutlined,
  CopyOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import './CodeGenerator.css';

const { Text, Paragraph } = Typography;
const { Option } = Select;

type TechStack = 'react' | 'vue' | 'nodejs' | 'php';

interface CodeGeneratorProps {
  /** Request data to generate code from */
  requestData?: any;
  /** Initial tech stack selection */
  defaultTechStack?: TechStack;
}

interface CodeTemplate {
  label: string;
  icon: React.ReactNode;
  code: string;
  language: string;
}

const CODE_TEMPLATES: Record<TechStack, CodeTemplate> = {
  react: {
    label: 'React',
    icon: <span style={{ fontSize: 14 }}>R</span>,
    language: 'jsx',
    code: `import React, { useState } from 'react';
import { Button, Card, Form, Input, message } from 'antd';

const PaymentForm = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handlePayment = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY',
        },
        body: JSON.stringify({
          amount: 1000,
          currency: 'USD',
          card: {
            number: values.cardNumber,
            expMonth: values.expiry.split('/')[0],
            expYear: values.expiry.split('/')[1],
            cvv: values.cvv,
          },
          merchantId: 'YOUR_MERCHANT_ID',
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('Payment successful!');
      } else {
        message.error(data.error?.message || 'Payment failed');
      }
    } catch (error) {
      message.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Payment Form">
      <Form form={form} onFinish={handlePayment} layout="vertical">
        <Form.Item name="cardNumber" label="Card Number" required>
          <Input placeholder="4242 4242 4242 4242" />
        </Form.Item>
        <Form.Item name="expiry" label="Expiry" required>
          <Input placeholder="MM/YY" />
        </Form.Item>
        <Form.Item name="cvv" label="CVV" required>
          <Input placeholder="123" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Pay Now
        </Button>
      </Form>
    </Card>
  );
};

export default PaymentForm;`,
  },
  vue: {
    label: 'Vue.js',
    icon: <span style={{ fontSize: 14 }}>V</span>,
    language: 'vue',
    code: `<template>
  <div class="payment-form">
    <form @submit.prevent="handlePayment">
      <div class="form-group">
        <label>Card Number</label>
        <input
          v-model="form.cardNumber"
          placeholder="4242 4242 4242 4242"
          required
        />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Expiry</label>
          <input v-model="form.expiry" placeholder="MM/YY" required />
        </div>
        <div class="form-group">
          <label>CVV</label>
          <input v-model="form.cvv" placeholder="123" required />
        </div>
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Processing...' : 'Pay Now' }}
      </button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'PaymentForm',
  data() {
    return {
      loading: false,
      form: {
        cardNumber: '',
        expiry: '',
        cvv: '',
      },
    };
  },
  methods: {
    async handlePayment() {
      this.loading = true;
      try {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_API_KEY',
          },
          body: JSON.stringify({
            amount: 1000,
            currency: 'USD',
            card: {
              number: this.form.cardNumber,
              expMonth: this.form.expiry.split('/')[0],
              expYear: this.form.expiry.split('/')[1],
              cvv: this.form.cvv,
            },
            merchantId: 'YOUR_MERCHANT_ID',
          }),
        });

        const data = await response.json();

        if (data.success) {
          this.$message.success('Payment successful!');
        } else {
          this.$message.error(data.error?.message || 'Payment failed');
        }
      } catch (error) {
        this.$message.error('Network error occurred');
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>`,
  },
  nodejs: {
    label: 'Node.js',
    icon: <span style={{ fontSize: 14 }}>N</span>,
    language: 'javascript',
    code: `const axios = require('axios');

// Initialize payment
async function createPayment(paymentData) {
  try {
    const response = await axios.post(
      'https://api.evonet.com/v1/payments',
      {
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        card: {
          number: paymentData.cardNumber,
          expMonth: paymentData.expMonth,
          expYear: paymentData.expYear,
          cvv: paymentData.cvv,
        },
        merchantId: process.env.EVONET_MERCHANT_ID,
        description: paymentData.description || 'Payment',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${process.env.EVONET_API_KEY}\`,
        },
      }
    );

    console.log('Payment successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Payment failed:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
const payment = await createPayment({
  amount: 1000,
  currency: 'USD',
  cardNumber: '4242424242424242',
  expMonth: '12',
  expYear: '2025',
  cvv: '123',
  description: 'Test payment',
});

// Express.js endpoint example
app.post('/api/payments', async (req, res) => {
  try {
    const result = await createPayment(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});`,
  },
  php: {
    label: 'PHP',
    icon: <span style={{ fontSize: 14 }}>P</span>,
    language: 'php',
    code: `<?php

class EvonetPayment {
    private $apiKey;
    private $merchantId;
    private $apiUrl = 'https://api.evonet.com/v1';

    public function __construct($apiKey, $merchantId) {
        $this->apiKey = $apiKey;
        $this->merchantId = $merchantId;
    }

    public function createPayment($amount, $currency, $cardData) {
        $payload = [
            'amount' => $amount,
            'currency' => $currency,
            'card' => [
                'number' => $cardData['number'],
                'expMonth' => $cardData['expMonth'],
                'expYear' => $cardData['expYear'],
                'cvv' => $cardData['cvv'],
            ],
            'merchantId' => $this->merchantId,
        ];

        $ch = curl_init($this->apiUrl . '/payments');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey,
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return json_decode($response, true);
    }
}

// Usage example
$payment = new EvonetPayment(
    'YOUR_API_KEY',
    'YOUR_MERCHANT_ID'
);

$result = $payment->createPayment(1000, 'USD', [
    'number' => '4242424242424242',
    'expMonth' => '12',
    'expYear' => '2025',
    'cvv' => '123',
]);

if ($result['success']) {
    echo "Payment successful: " . $result['id'];
} else {
    echo "Payment failed: " . $result['error']['message'];
}
?>`,
  },
};

const CodeGenerator: React.FC<CodeGeneratorProps> = ({
  requestData: _requestData,
  defaultTechStack = 'react',
}) => {
  const [selectedStack, setSelectedStack] = useState<TechStack>(defaultTechStack);
  const [copied, setCopied] = useState(false);

  const currentTemplate = useMemo(() => {
    return CODE_TEMPLATES[selectedStack];
  }, [selectedStack]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentTemplate.code);
      setCopied(true);
      message.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error('Failed to copy code');
    }
  };

  return (
    <div className="code-generator">
      <Card className="code-generator__card" size="small">
        <div className="code-generator__header">
          <CodeOutlined className="code-generator__header-icon" />
          <Text strong>Integration Code Generator</Text>
        </div>
        <Paragraph type="secondary" className="code-generator__description">
          Select your technology stack to get started with the integration code.
          Copy and adapt the code for your application.
        </Paragraph>

        <div className="code-generator__select-wrapper">
          <Text className="code-generator__label">Technology Stack:</Text>
          <Select
            value={selectedStack}
            onChange={setSelectedStack}
            style={{ width: '100%' }}
            size="large"
          >
            {Object.entries(CODE_TEMPLATES).map(([key, template]) => (
              <Option key={key} value={key}>
                <Space>
                  {template.icon}
                  {template.label}
                </Space>
              </Option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="code-generator__code-card" size="small">
        <div className="code-generator__code-header">
          <div className="code-generator__code-title">
            <Text strong>{currentTemplate.label}</Text>
            <Text type="secondary" className="code-generator__language">
              {currentTemplate.language.toUpperCase()}
            </Text>
          </div>
          <Tooltip title="Copy code">
            <Button
              type="text"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
              className="code-generator__copy-btn"
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </Tooltip>
        </div>
        <div className="code-generator__code-content">
          <pre className="code-generator__code">
            <code>{currentTemplate.code}</code>
          </pre>
        </div>
      </Card>

      <div className="code-generator__tips">
        <Text type="secondary" className="code-generator__tips-title">
          Integration Tips:
        </Text>
        <ul className="code-generator__tips-list">
          <li>Replace YOUR_API_KEY with your actual API key</li>
          <li>Replace YOUR_MERCHANT_ID with your merchant ID</li>
          <li>Use environment variables for sensitive credentials</li>
          <li>Implement proper error handling for production</li>
        </ul>
      </div>
    </div>
  );
};

export default CodeGenerator;