import React, { useEffect, useRef } from 'react';
import { Alert, Button } from 'antd';
import MockDropInComponent from './MockDropInComponent';

interface DropInComponentProps {
  sessionId: string;
  environment: string;
  onPaymentCompleted?: (result: any) => void;
  onPaymentFailed?: (result: any) => void;
  onPaymentCancelled?: (result: any) => void;
}

const DropInComponent: React.FC<DropInComponentProps> = ({
  sessionId,
  environment,
  onPaymentCompleted,
  onPaymentFailed,
  onPaymentCancelled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkLoaded, setSdkLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [useMockComponent, setUseMockComponent] = React.useState(false);

  useEffect(() => {
    const loadDropInSDK = () => {
      // 检查SDK是否已经加载
      if ((window as any).DropInSDK) {
        console.log('Drop-in SDK already loaded');
        setSdkLoaded(true);
        return;
      }

      console.log('Loading Drop-in SDK...');
      const script = document.createElement('script');
      // 使用你提供的正确CDN链接
      script.src = 'https://cdn.jsdelivr.net/npm/cil-dropin-components@latest/dist/index.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        console.log('Drop-in SDK loaded successfully');
        // 等待一小段时间确保SDK完全初始化
        setTimeout(() => {
          if ((window as any).DropInSDK || (window as any).DropinSDK) {
            console.log('DropInSDK is available');
            setSdkLoaded(true);
          } else {
            console.error('DropInSDK not found after script load');
            console.log('Available window objects:', Object.keys(window).filter(key => key.toLowerCase().includes('drop')));
            setUseMockComponent(true);
          }
        }, 1000);
      };
      script.onerror = (err) => {
        console.error('Failed to load Drop-in SDK:', err);
        console.log('SDK loading failed, switching to mock component');
        setUseMockComponent(true);
      };
      
      document.head.appendChild(script);
    };

    loadDropInSDK();
  }, []);

  useEffect(() => {
    if (sdkLoaded && sessionId && containerRef.current && !isInitializing) {
      setIsInitializing(true);
      
      console.log('Initializing Drop-in component with:', {
        sessionId,
        environment,
        container: containerRef.current
      });

      try {
        // 检查不同的SDK名称
        const DropInSDK = (window as any).DropInSDK || (window as any).DropinSDK;
        
        if (!DropInSDK) {
          throw new Error('DropInSDK is not available');
        }

        // 清理容器
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // 创建一个唯一的容器ID
        const containerId = 'dropin-container-' + Date.now();
        if (containerRef.current) {
          containerRef.current.id = containerId;
        }

        const config = {
          id: '#' + containerId,  // 使用CSS选择器格式
          type: 'payment',
          sessionID: sessionId,
          locale: 'en-US',
          mode: 'embedded',
          environment: environment === 'UAT' || environment === 'sandbox' ? 'UAT' : 'HKG_prod',
          appearance: {
            colorBackground: '#ffffff',
            colorPrimary: '#1890ff'
          },
          payment_completed: (params: any) => {
            console.log('Payment completed:', params);
            onPaymentCompleted?.(params);
          },
          payment_failed: (params: any) => {
            console.log('Payment failed:', params);
            onPaymentFailed?.(params);
          },
          payment_not_preformed: (params: any) => {
            console.log('Payment not performed:', params);
            onPaymentFailed?.(params);
          },
          payment_cancelled: (params: any) => {
            console.log('Payment cancelled:', params);
            onPaymentCancelled?.(params);
          },
        };
        
        console.log('Drop-in SDK config:', config);
        
        const sdk = new DropInSDK(config);
        
        console.log('Drop-in SDK initialized successfully:', sdk);
        
      } catch (err: any) {
        console.error('Error initializing Drop-in SDK:', err);
        setError(`Failed to initialize Drop-in component: ${err.message}`);
        setIsInitializing(false);
      }
    }
  }, [sdkLoaded, sessionId, isInitializing]);

  // 如果需要使用模拟组件
  if (useMockComponent) {
    return (
      <div>
        <Alert
          message="使用模拟组件"
          description={
            <div>
              <div>无法加载官方Drop-in SDK，正在使用模拟组件进行演示</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                SDK URL: https://cdn.jsdelivr.net/npm/cil-dropin-components@latest/dist/index.min.js
              </div>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <div>
              <Button
                size="small"
                onClick={() => {
                  setUseMockComponent(false);
                  setError(null);
                  setSdkLoaded(false);
                  // 清除之前的脚本
                  const existingScripts = document.querySelectorAll('script[src*="cil-dropin-components"]');
                  existingScripts.forEach(script => script.remove());
                }}
                style={{ marginRight: 8 }}
              >
                重试加载SDK
              </Button>
              <Button
                size="small"
                type="link"
                onClick={() => {
                  window.open('https://cdn.jsdelivr.net/npm/cil-dropin-components@latest/dist/index.min.js', '_blank');
                }}
              >
                检查SDK链接
              </Button>
            </div>
          }
        />
        <MockDropInComponent
          sessionId={sessionId}
          environment={environment}
          onPaymentCompleted={onPaymentCompleted}
          onPaymentFailed={onPaymentFailed}
          onPaymentCancelled={onPaymentCancelled}
        />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Drop-in 组件错误"
        description={
          <div>
            <div>{error}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
              SessionID: {sessionId}<br/>
              Environment: {environment}<br/>
              SDK Loaded: {sdkLoaded ? 'Yes' : 'No'}
            </div>
          </div>
        }
        type="error"
        showIcon
      />
    );
  }

  if (!sdkLoaded) {
    return (
      <Alert
        message="加载中..."
        description="正在加载 Drop-in 组件 SDK"
        type="info"
        showIcon
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: 400,
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        padding: 16,
        backgroundColor: '#ffffff'
      }}
    />
  );
};

export default DropInComponent;