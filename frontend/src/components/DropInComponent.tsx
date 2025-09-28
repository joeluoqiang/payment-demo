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
  const currentSdkInstance = useRef<any>(null); // 保存当前SDK实例的引用

  // 完全销毁SDK实例的函数
  const destroySdkInstance = React.useCallback(() => {
    console.log('销毁SDK实例，确保完全清理');
    
    // 1. 销毁当前SDK实例
    if (currentSdkInstance.current) {
      try {
        // 尝试调用SDK的销毁方法（如果存在）
        if (typeof currentSdkInstance.current.destroy === 'function') {
          currentSdkInstance.current.destroy();
        }
        if (typeof currentSdkInstance.current.cleanup === 'function') {
          currentSdkInstance.current.cleanup();
        }
      } catch (err) {
        console.warn('销毁SDK实例时出现警告:', err);
      }
      currentSdkInstance.current = null;
    }
    
    // 2. 清理DOM容器
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      // 移除所有可能的事件监听器
      containerRef.current.removeAttribute('id');
    }
    
    // 3. 重置状态
    setIsInitializing(false);
    setError(null);
  }, []);
  
  // 组件卸载时确保清理
  useEffect(() => {
    return () => {
      console.log('DropInComponent组件卸载，执行清理');
      destroySdkInstance();
    };
  }, [destroySdkInstance]);

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
      // 使用本地JS文件
      script.src = '/index.min.js';
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
        // 先销毁之前的SDK实例，确保完全清理
        destroySdkInstance();
        
        // 检查不同的SDK名称
        const DropInSDK = (window as any).DropInSDK || (window as any).DropinSDK;
        
        if (!DropInSDK) {
          throw new Error('DropInSDK is not available');
        }

        // 创建一个唯一的容器ID，确保每次都是全新的
        const containerId = 'dropin-container-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
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
        
        // 创建新的SDK实例并保存引用
        const sdk = new DropInSDK(config);
        currentSdkInstance.current = sdk;
        
        console.log('Drop-in SDK initialized successfully:', sdk);
        
      } catch (err: any) {
        console.error('Error initializing Drop-in SDK:', err);
        setError(`Failed to initialize Drop-in component: ${err.message}`);
        setIsInitializing(false);
      }
    }
  }, [sdkLoaded, sessionId, isInitializing, destroySdkInstance]);

  // 当sessionId变化时，完全重置到“第一次初始化”状态
  useEffect(() => {
    console.log('SessionId changed, completely resetting to first-time state:', sessionId);
    
    // 完全销毁之前的SDK实例
    destroySdkInstance();
    
    // 等待一个微任务周期，确保清理完成
    setTimeout(() => {
      setIsInitializing(false);
      setError(null);
    }, 10);
  }, [sessionId, destroySdkInstance]);

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
                SDK URL: /index.min.js
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
                  const existingScripts = document.querySelectorAll('script[src*="index.min.js"]');
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
                  window.open('/index.min.js', '_blank');
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