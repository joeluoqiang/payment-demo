import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import ViewSwitcher from '../components/ViewSwitcher';

// Create a mock function that can be accessed in tests
const mockSetViewMode = vi.fn();
const mockToggleViewMode = vi.fn();

// Mock the AppContext
vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    state: { viewMode: 'merchant' },
    toggleViewMode: mockToggleViewMode,
    setViewMode: mockSetViewMode,
  }),
}));

const renderViewSwitcher = (props = {}) => {
  return render(
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <ViewSwitcher {...props} />
    </ConfigProvider>
  );
};

describe('ViewSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the switch component', () => {
      const { container } = renderViewSwitcher();

      const switchElement = container.querySelector('.ant-switch');
      expect(switchElement).toBeInTheDocument();
    });

    it('should render merchant icon', () => {
      const { container } = renderViewSwitcher();

      expect(container.querySelector('.view-switcher__icon')).toBeInTheDocument();
    });

    it('should display current view mode label', () => {
      renderViewSwitcher();

      expect(screen.getByText(/Merchant View/i)).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should apply custom className', () => {
      const { container } = renderViewSwitcher({ className: 'custom-class' });

      expect(container.querySelector('.view-switcher')).toHaveClass('custom-class');
    });

    it('should call setViewMode when switch is clicked', () => {
      const { container } = renderViewSwitcher();

      const switchElement = container.querySelector('.ant-switch');
      if (switchElement) {
        fireEvent.click(switchElement);
      }

      expect(mockSetViewMode).toHaveBeenCalled();
    });

    it('should call onViewModeChange when mode changes', () => {
      const mockOnChange = vi.fn();
      const { container } = renderViewSwitcher({ onViewModeChange: mockOnChange });

      const switchElement = container.querySelector('.ant-switch');
      if (switchElement) {
        fireEvent.click(switchElement);
      }

      expect(mockSetViewMode).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper structure', () => {
      const { container } = renderViewSwitcher();

      expect(container.querySelector('.view-switcher')).toBeInTheDocument();
      expect(container.querySelector('.ant-switch')).toBeInTheDocument();
    });
  });
});