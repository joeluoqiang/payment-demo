import React, { useState, useCallback } from 'react';
import {
  Button,
  Tooltip,
  Dropdown,
  Space,
  Typography,
} from 'antd';
import {
  MobileOutlined,
  TabletOutlined,
  DesktopOutlined,
  ExpandOutlined,
  CompressOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import './MobilePreview.css';

const { Text } = Typography;

type DeviceType = 'mobile' | 'tablet' | 'desktop';
type Orientation = 'portrait' | 'landscape';

interface DeviceConfig {
  type: DeviceType;
  label: string;
  icon: React.ReactNode;
  width: number;
  height: number;
}

const DEVICES: DeviceConfig[] = [
  { type: 'mobile', label: 'iPhone 14 Pro', icon: <MobileOutlined />, width: 393, height: 852 },
  { type: 'mobile', label: 'iPhone SE', icon: <MobileOutlined />, width: 375, height: 667 },
  { type: 'mobile', label: 'Pixel 7', icon: <MobileOutlined />, width: 412, height: 915 },
  { type: 'tablet', label: 'iPad Pro 12.9"', icon: <TabletOutlined />, width: 1024, height: 1366 },
  { type: 'tablet', label: 'iPad Air', icon: <TabletOutlined />, width: 820, height: 1180 },
  { type: 'desktop', label: 'Desktop HD', icon: <DesktopOutlined />, width: 1920, height: 1080 },
  { type: 'desktop', label: 'Desktop', icon: <DesktopOutlined />, width: 1366, height: 768 },
];

interface MobilePreviewProps {
  /** Children to render inside the preview frame */
  children?: React.ReactNode;
  /** Callback when device changes */
  onDeviceChange?: (device: DeviceConfig) => void;
  /** Callback when orientation changes */
  onOrientationChange?: (orientation: Orientation) => void;
  /** Initial device type */
  defaultDevice?: DeviceType;
  /** Whether to show the frame border */
  showFrame?: boolean;
  /** Additional CSS class name */
  className?: string;
}

const MobilePreview: React.FC<MobilePreviewProps> = ({
  children,
  onDeviceChange,
  onOrientationChange,
  defaultDevice = 'mobile',
  showFrame = true,
  className = '',
}) => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceConfig>(
    DEVICES.find((d) => d.type === defaultDevice) || DEVICES[0]
  );
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDeviceSelect = useCallback((device: DeviceConfig) => {
    setSelectedDevice(device);
    onDeviceChange?.(device);
  }, [onDeviceChange]);

  const handleOrientationToggle = useCallback(() => {
    const newOrientation = orientation === 'portrait' ? 'landscape' : 'portrait';
    setOrientation(newOrientation);
    onOrientationChange?.(newOrientation);
  }, [orientation, onOrientationChange]);

  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const getPreviewDimensions = () => {
    const isPortrait = orientation === 'portrait';
    return {
      width: isPortrait ? selectedDevice.width : selectedDevice.height,
      height: isPortrait ? selectedDevice.height : selectedDevice.width,
    };
  };

  const deviceMenuItems: MenuProps['items'] = [
    {
      key: 'mobile-group',
      label: 'Mobile Devices',
      type: 'group',
      children: DEVICES.filter((d) => d.type === 'mobile').map((device) => ({
        key: device.label,
        label: (
          <Space>
            {device.icon}
            {device.label}
          </Space>
        ),
        onClick: () => handleDeviceSelect(device),
      })),
    },
    {
      key: 'tablet-group',
      label: 'Tablets',
      type: 'group',
      children: DEVICES.filter((d) => d.type === 'tablet').map((device) => ({
        key: device.label,
        label: (
          <Space>
            {device.icon}
            {device.label}
          </Space>
        ),
        onClick: () => handleDeviceSelect(device),
      })),
    },
    {
      key: 'desktop-group',
      label: 'Desktop',
      type: 'group',
      children: DEVICES.filter((d) => d.type === 'desktop').map((device) => ({
        key: device.label,
        label: (
          <Space>
            {device.icon}
            {device.label}
          </Space>
        ),
        onClick: () => handleDeviceSelect(device),
      })),
    },
  ];

  const dimensions = getPreviewDimensions();

  return (
    <div className={`mobile-preview ${className} ${isFullscreen ? 'mobile-preview--fullscreen' : ''}`}>
      {/* Controls */}
      <div className="mobile-preview__controls">
        <Dropdown menu={{ items: deviceMenuItems }} trigger={['click']}>
          <Button icon={selectedDevice.icon}>
            {selectedDevice.label}
          </Button>
        </Dropdown>

        <Tooltip title={`Switch to ${orientation === 'portrait' ? 'landscape' : 'portrait'}`}>
          <Button
            icon={orientation === 'portrait' ? <MobileOutlined rotate={0} /> : <MobileOutlined rotate={90} />}
            onClick={handleOrientationToggle}
          >
            {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
          </Button>
        </Tooltip>

        <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
          <Button
            icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
            onClick={handleFullscreenToggle}
          >
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
        </Tooltip>
      </div>

      {/* Preview Frame */}
      <div className="mobile-preview__container">
        <div
          className={`mobile-preview__frame ${showFrame ? 'mobile-preview__frame--bordered' : ''}`}
          style={{
            width: Math.min(dimensions.width, window.innerWidth - 40),
            height: isFullscreen ? '100%' : Math.min(dimensions.height, window.innerHeight - 150),
            maxWidth: '100%',
          }}
        >
          {/* Device bezel effect */}
          {showFrame && (
            <div className="mobile-preview__bezel">
              <div className="mobile-preview__notch" />
            </div>
          )}

          {/* Content */}
          <div className="mobile-preview__content">
            {children || (
              <div className="mobile-preview__placeholder">
                <MobileOutlined style={{ fontSize: 48, color: '#ccc' }} />
                <Text type="secondary">Preview content will appear here</Text>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="mobile-preview__info">
        <Text type="secondary">
          {selectedDevice.label} • {dimensions.width}×{dimensions.height}
        </Text>
      </div>
    </div>
  );
};

export default MobilePreview;
export type { DeviceConfig, DeviceType, Orientation, MobilePreviewProps };