import React from 'react';
import { Switch, Space, Typography } from 'antd';
import { ShopOutlined, CodeOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import type { ViewMode } from '../types';
import './ViewSwitcher.css';

const { Text } = Typography;

interface ViewSwitcherProps {
  /** Additional CSS class name */
  className?: string;
  /** Callback when view mode changes */
  onViewModeChange?: (mode: ViewMode) => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  className = '',
  onViewModeChange,
}) => {
  const { state, setViewMode } = useApp();
  const isDeveloper = state.viewMode === 'developer';

  const handleChange = (checked: boolean) => {
    const newMode: ViewMode = checked ? 'developer' : 'merchant';
    setViewMode(newMode);
    onViewModeChange?.(newMode);
  };

  return (
    <div className={`view-switcher ${className}`}>
      <Space size="small">
        <ShopOutlined className={`view-switcher__icon ${!isDeveloper ? 'view-switcher__icon--active' : ''}`} />
        <Switch
          checked={isDeveloper}
          onChange={handleChange}
          checkedChildren={<CodeOutlined />}
          unCheckedChildren={<ShopOutlined />}
          className="view-switcher__switch"
        />
        <CodeOutlined className={`view-switcher__icon ${isDeveloper ? 'view-switcher__icon--active' : ''}`} />
      </Space>
      <Text className="view-switcher__label">
        {isDeveloper ? 'Developer View' : 'Merchant View'}
      </Text>
    </div>
  );
};

export default ViewSwitcher;