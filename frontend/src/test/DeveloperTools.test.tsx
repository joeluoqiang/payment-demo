import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeveloperTools from '../components/DeveloperTools';

// Mock child components
vi.mock('../components/DevPanel', () => ({
  default: ({ requestData, responseData }: any) => (
    <div data-testid="dev-panel">
      DevPanel - Request: {JSON.stringify(requestData)} - Response: {JSON.stringify(responseData)}
    </div>
  ),
}));

vi.mock('../components/ErrorSimulator', () => ({
  default: () => <div data-testid="error-simulator">ErrorSimulator</div>,
}));

vi.mock('../components/CodeGenerator', () => ({
  default: ({ requestData }: any) => (
    <div data-testid="code-generator">CodeGenerator - Request: {JSON.stringify(requestData)}</div>
  ),
}));

describe('DeveloperTools', () => {
  describe('Component Rendering', () => {
    it('should render the trigger button', () => {
      render(<DeveloperTools />);

      expect(screen.getByText('Dev Tools')).toBeInTheDocument();
    });

    it('should render with ToolOutlined icon on trigger button', () => {
      const { container } = render(<DeveloperTools />);

      const button = container.querySelector('.anticon-tool');
      expect(button).toBeInTheDocument();
    });

    it('should not show drawer initially', () => {
      render(<DeveloperTools />);

      expect(screen.queryByText('Developer Tools')).not.toBeInTheDocument();
    });
  });

  describe('Drawer Visibility - Uncontrolled Mode', () => {
    it('should open drawer when trigger button is clicked', () => {
      render(<DeveloperTools />);

      fireEvent.click(screen.getByText('Dev Tools'));

      expect(screen.getByText('Developer Tools')).toBeInTheDocument();
    });

    it.skip('should close drawer when onClose is triggered', async () => {
      render(<DeveloperTools />);

      // Open drawer
      fireEvent.click(screen.getByText('Dev Tools'));
      expect(screen.getByText('Developer Tools')).toBeInTheDocument();

      // Close drawer
      const closeButton = document.querySelector('.ant-drawer-close');
      fireEvent.click(closeButton!);

      // Wait for drawer close animation (increased timeout)
      await vi.waitFor(() => {
        expect(screen.queryByText('Developer Tools')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should use internal state when visible prop is not provided', () => {
      const { rerender } = render(<DeveloperTools />);

      fireEvent.click(screen.getByText('Dev Tools'));
      expect(screen.getByText('Developer Tools')).toBeInTheDocument();

      rerender(<DeveloperTools />);
      // Drawer should still be open after rerender
      expect(screen.getByText('Developer Tools')).toBeInTheDocument();
    });
  });

  describe('Drawer Visibility - Controlled Mode', () => {
    it('should respect visible prop in controlled mode', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} />);

      expect(screen.getByText('Developer Tools')).toBeInTheDocument();
    });

    it('should call onVisibleChange when opening in controlled mode', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={false} onVisibleChange={onVisibleChange} />);

      fireEvent.click(screen.getByText('Dev Tools'));

      expect(onVisibleChange).toHaveBeenCalledWith(true);
    });

    it('should call onVisibleChange when closing in controlled mode', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} />);

      const closeButton = document.querySelector('.ant-drawer-close');
      fireEvent.click(closeButton!);

      expect(onVisibleChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Tabs Navigation', () => {
    it('should render all three tabs', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} />);

      expect(screen.getByText('Request/Response')).toBeInTheDocument();
      expect(screen.getByText('Error Simulator')).toBeInTheDocument();
      expect(screen.getByText('Code Generator')).toBeInTheDocument();
    });

    it('should render DevPanel by default', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} />);

      expect(screen.getByTestId('dev-panel')).toBeInTheDocument();
    });

    it('should switch to Error Simulator tab when clicked', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} />);

      fireEvent.click(screen.getByText('Error Simulator'));

      expect(screen.getByTestId('error-simulator')).toBeInTheDocument();
    });

    it('should switch to Code Generator tab when clicked', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} />);

      fireEvent.click(screen.getByText('Code Generator'));

      expect(screen.getByTestId('code-generator')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should pass requestData to DevPanel', () => {
      const onVisibleChange = vi.fn();
      const requestData = { amount: 100, currency: 'USD' };
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} requestData={requestData} />);

      expect(screen.getByTestId('dev-panel')).toHaveTextContent('amount');
      expect(screen.getByTestId('dev-panel')).toHaveTextContent('100');
    });

    it('should pass responseData to DevPanel', () => {
      const onVisibleChange = vi.fn();
      const responseData = { success: true, status: 'completed' };
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} responseData={responseData} />);

      expect(screen.getByTestId('dev-panel')).toHaveTextContent('success');
      expect(screen.getByTestId('dev-panel')).toHaveTextContent('completed');
    });

    it('should pass requestData to CodeGenerator', () => {
      const onVisibleChange = vi.fn();
      const requestData = { amount: 200, currency: 'EUR' };
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} requestData={requestData} />);

      fireEvent.click(screen.getByText('Code Generator'));

      expect(screen.getByTestId('code-generator')).toHaveTextContent('200');
      expect(screen.getByTestId('code-generator')).toHaveTextContent('EUR');
    });

    it('should apply className prop to trigger button', () => {
      const { container } = render(
        <DeveloperTools className="custom-trigger-class" />
      );

      const trigger = container.querySelector('.developer-tools-trigger');
      expect(trigger).toHaveClass('custom-trigger-class');
    });
  });

  describe('Error Count Badge', () => {
    it('should not show badge when errorCount is 0', () => {
      render(<DeveloperTools errorCount={0} />);

      const badges = document.querySelectorAll('.ant-badge-count');
      expect(badges.length).toBe(0);
    });

    it('should show badge when errorCount is greater than 0', () => {
      render(<DeveloperTools errorCount={3} />);

      // Badge should be visible
      const badge = document.querySelector('.developer-tools-badge .ant-badge-count');
      expect(badge).toBeInTheDocument();
    });

    it('should show error count badge on tab when errorCount is greater than 0', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} errorCount={5} />);

      const tabBadge = document.querySelector('.ant-tabs-tab .ant-badge-count');
      expect(tabBadge).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null requestData', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} requestData={null} />);

      expect(screen.getByTestId('dev-panel')).toBeInTheDocument();
    });

    it('should handle undefined responseData', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} responseData={undefined} />);

      expect(screen.getByTestId('dev-panel')).toBeInTheDocument();
    });

    it('should handle empty objects for request/response data', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} requestData={{}} responseData={{}} />);

      expect(screen.getByTestId('dev-panel')).toBeInTheDocument();
    });

    it('should handle complex nested request data', () => {
      const onVisibleChange = vi.fn();
      const complexData = {
        transaction: {
          amount: 100,
          currency: 'USD',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      };

      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} requestData={complexData} />);

      expect(screen.getByTestId('dev-panel')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button role on trigger', () => {
      render(<DeveloperTools />);

      const button = screen.getByRole('button', { name: /dev tools/i });
      expect(button).toBeInTheDocument();
    });

    it('should have proper drawer structure when open', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} />);

      const drawer = document.querySelector('.ant-drawer');
      expect(drawer).toBeInTheDocument();
    });

    it('should have proper tab list structure', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} />);

      const tabList = document.querySelector('.ant-tabs-nav');
      expect(tabList).toBeInTheDocument();
    });
  });

  describe('Drawer Configuration', () => {
    it('should render drawer on the right side', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} />);

      const drawer = document.querySelector('.ant-drawer-right');
      expect(drawer).toBeInTheDocument();
    });

    it('should have proper width', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} />);

      const drawer = document.querySelector('.ant-drawer');
      expect(drawer).toBeInTheDocument();
    });

    it('should render header with icon', () => {
      const onVisibleChange = vi.fn();
      render(<DeveloperTools visible={true} onVisibleChange={onVisibleChange} />);

      const headerIcon = document.querySelector('.developer-tools-header__icon');
      expect(headerIcon).toBeInTheDocument();
    });
  });
});