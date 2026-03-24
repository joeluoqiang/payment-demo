import React, { useState, useCallback } from 'react';
import {
  Select,
  Typography,
  Space,
  Tag,
} from 'antd';
import {
  GlobalOutlined,
} from '@ant-design/icons';
import type { SelectProps } from 'antd';
import './RegionSelector.css';

const { Text } = Typography;

export interface Region {
  code: string;
  name: string;
  currency: string;
  language: string;
  flag?: string;
  paymentMethods?: string[];
}

const REGIONS: Region[] = [
  {
    code: 'GLOBAL',
    name: 'Global',
    currency: 'USD',
    language: 'en',
    paymentMethods: ['card', 'paypal'],
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    currency: 'HKD',
    language: 'zh-HK',
    flag: '🇭🇰',
    paymentMethods: ['card', 'fps', 'payme'],
  },
  {
    code: 'KR',
    name: 'South Korea',
    currency: 'KRW',
    language: 'ko',
    flag: '🇰🇷',
    paymentMethods: ['card', 'kakaoPay', 'naverPay'],
  },
  {
    code: 'JP',
    name: 'Japan',
    currency: 'JPY',
    language: 'ja',
    flag: '🇯🇵',
    paymentMethods: ['card', 'linePay', 'payPay'],
  },
  {
    code: 'MY',
    name: 'Malaysia',
    currency: 'MYR',
    language: 'ms',
    flag: '🇲🇾',
    paymentMethods: ['card', 'tngEwallet', 'grabPay'],
  },
  {
    code: 'ID',
    name: 'Indonesia',
    currency: 'IDR',
    language: 'id',
    flag: '🇮🇩',
    paymentMethods: ['card', 'ovo', 'gopay'],
  },
  {
    code: 'TH',
    name: 'Thailand',
    currency: 'THB',
    language: 'th',
    flag: '🇹🇭',
    paymentMethods: ['card', 'promptPay', 'trueMoney'],
  },
  {
    code: 'SG',
    name: 'Singapore',
    currency: 'SGD',
    language: 'en',
    flag: '🇸🇬',
    paymentMethods: ['card', 'payNow', 'grabPay'],
  },
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    language: 'en',
    flag: '🇺🇸',
    paymentMethods: ['card', 'applePay', 'googlePay'],
  },
  {
    code: 'EU',
    name: 'Europe',
    currency: 'EUR',
    language: 'en',
    flag: '🇪🇺',
    paymentMethods: ['card', 'applePay', 'sepa'],
  },
];

interface RegionSelectorProps {
  /** Currently selected region code */
  value?: string;
  /** Callback when region changes */
  onChange?: (region: Region) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Size of the selector */
  size?: 'small' | 'middle' | 'large';
  /** Whether to show payment methods */
  showPaymentMethods?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Style variant */
  variant?: 'default' | 'compact' | 'dropdown';
}

const RegionSelector: React.FC<RegionSelectorProps> = ({
  value = 'GLOBAL',
  onChange,
  placeholder = 'Select a region',
  disabled = false,
  size = 'middle',
  showPaymentMethods = false,
  className = '',
  variant = 'default',
}) => {
  const [selectedRegion, setSelectedRegion] = useState<Region | undefined>(
    REGIONS.find((r) => r.code === value)
  );

  const handleChange = useCallback(
    (regionCode: string) => {
      const region = REGIONS.find((r) => r.code === regionCode);
      if (region) {
        setSelectedRegion(region);
        onChange?.(region);
      }
    },
    [onChange]
  );

  const renderRegionOption: SelectProps['optionRender'] = (option) => {
    const region = REGIONS.find((r) => r.code === option.value);
    if (!region) return null;

    return (
      <div className="region-selector__option">
        <Space>
          {region.flag && <span className="region-selector__flag">{region.flag}</span>}
          <div className="region-selector__option-content">
            <Text strong>{region.name}</Text>
            <Space size={4}>
              <Tag color="blue">{region.currency}</Tag>
              {variant !== 'compact' && (
                <Tag color="green">{region.language.toUpperCase()}</Tag>
              )}
            </Space>
          </div>
        </Space>
        {showPaymentMethods && region.paymentMethods && (
          <div className="region-selector__payment-methods">
            {region.paymentMethods.slice(0, 3).map((method) => (
              <Tag key={method} color="default" style={{ fontSize: 10 }}>
                {method}
              </Tag>
            ))}
            {region.paymentMethods.length > 3 && (
              <Text type="secondary" style={{ fontSize: 10 }}>
                +{region.paymentMethods.length - 3} more
              </Text>
            )}
          </div>
        )}
      </div>
    );
  };

  const selectOptions = REGIONS.map((region) => ({
    value: region.code,
    label: (
      <Space>
        {region.flag && <span>{region.flag}</span>}
        <span>{region.name}</span>
        <Tag color="blue" style={{ marginLeft: 4 }}>
          {region.currency}
        </Tag>
      </Space>
    ),
  }));

  return (
    <div className={`region-selector region-selector--${variant} ${className}`}>
      {variant === 'compact' ? (
        <Select
          value={value}
          onChange={handleChange}
          disabled={disabled}
          size={size}
          options={selectOptions}
          optionRender={renderRegionOption}
          placeholder={placeholder}
          className="region-selector__select"
          suffixIcon={<GlobalOutlined />}
          bordered={false}
        />
      ) : (
        <Select
          value={value}
          onChange={handleChange}
          disabled={disabled}
          size={size}
          options={selectOptions}
          optionRender={renderRegionOption}
          placeholder={placeholder}
          className="region-selector__select"
          suffixIcon={<GlobalOutlined />}
          showSearch
          optionFilterProp="label"
        />
      )}

      {variant === 'default' && selectedRegion && (
        <div className="region-selector__info">
          <Text type="secondary">
            Currency: <Tag color="blue">{selectedRegion.currency}</Tag>
            Language: <Tag color="green">{selectedRegion.language.toUpperCase()}</Tag>
          </Text>
        </div>
      )}
    </div>
  );
};

export default RegionSelector;
export { REGIONS };
export type { RegionSelectorProps };