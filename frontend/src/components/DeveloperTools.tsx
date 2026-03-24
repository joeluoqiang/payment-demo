import React, { useState } from 'react';
import {
  Drawer,
  Button,
  Badge,
  Tabs,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  CodeOutlined,
  BugOutlined,
  ApiOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import DevPanel from './DevPanel';
import ErrorSimulator from './ErrorSimulator';
import CodeGenerator from './CodeGenerator';
import './DeveloperTools.css';

interface DeveloperToolsProps {
  /** Whether the drawer is visible */
  visible?: boolean;
  /** Callback when visibility changes */
  onVisibleChange?: (visible: boolean) => void;
  /** Current request data for DevPanel */
  requestData?: any;
  /** Current response data for DevPanel */
  responseData?: any;
  /** Error count badge */
  errorCount?: number;
  /** Additional CSS class name */
  className?: string;
}

const DeveloperTools: React.FC<DeveloperToolsProps> = ({
  visible = false,
  onVisibleChange,
  requestData,
  responseData,
  errorCount = 0,
  className = '',
}) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('devpanel');

  const isControlled = visible !== undefined && onVisibleChange !== undefined;
  const drawerVisible = isControlled ? visible : internalVisible;

  const handleOpen = () => {
    if (isControlled) {
      onVisibleChange(true);
    } else {
      setInternalVisible(true);
    }
  };

  const handleClose = () => {
    if (isControlled) {
      onVisibleChange(false);
    } else {
      setInternalVisible(false);
    }
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'devpanel',
      label: (
        <span>
          <ApiOutlined />
          Request/Response
        </span>
      ),
      children: (
        <DevPanel
          requestData={requestData}
          responseData={responseData}
        />
      ),
    },
    {
      key: 'errorSimulator',
      label: (
        <Badge count={errorCount} size="small" offset={[10, 0]}>
          <span>
            <BugOutlined />
            Error Simulator
          </span>
        </Badge>
      ),
      children: <ErrorSimulator />,
    },
    {
      key: 'codeGenerator',
      label: (
        <span>
          <CodeOutlined />
          Code Generator
        </span>
      ),
      children: <CodeGenerator requestData={requestData} />,
    },
  ];

  return (
    <>
      {/* Trigger Button */}
      <Button
        type="primary"
        icon={<ToolOutlined />}
        onClick={handleOpen}
        className={`developer-tools-trigger ${className}`}
      >
        Dev Tools
        {errorCount > 0 && (
          <Badge
            count={errorCount}
            size="small"
            className="developer-tools-badge"
          />
        )}
      </Button>

      {/* Drawer */}
      <Drawer
        title={
          <div className="developer-tools-header">
            <ToolOutlined className="developer-tools-header__icon" />
            <span>Developer Tools</span>
          </div>
        }
        placement="right"
        width={600}
        onClose={handleClose}
        open={drawerVisible}
        className="developer-tools-drawer"
        styles={{
          body: { padding: 0 },
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="developer-tools-tabs"
          tabPosition="top"
          size="small"
        />
      </Drawer>
    </>
  );
};

export default DeveloperTools;