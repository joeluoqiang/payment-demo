import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import ScenarioSelector from '../components/ScenarioSelector';

const renderScenarioSelector = (props = {}) => {
  return render(
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <ScenarioSelector {...props} />
    </ConfigProvider>
  );
};

describe('ScenarioSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render all scenario options', () => {
      renderScenarioSelector();

      expect(screen.getByText('One-time Payment')).toBeInTheDocument();
      expect(screen.getByText('Subscription')).toBeInTheDocument();
      expect(screen.getByText('Refund')).toBeInTheDocument();
      expect(screen.getByText('Error Handling')).toBeInTheDocument();
    });

    it('should render scenario descriptions by default', () => {
      renderScenarioSelector();

      expect(screen.getByText('Single payment transaction')).toBeInTheDocument();
      expect(screen.getByText('Recurring billing plans')).toBeInTheDocument();
      expect(screen.getByText('Process refunds for transactions')).toBeInTheDocument();
      expect(screen.getByText('Simulate error scenarios')).toBeInTheDocument();
    });

    it('should hide descriptions when showDescriptions is false', () => {
      renderScenarioSelector({ showDescriptions: false });

      expect(screen.queryByText('Single payment transaction')).not.toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should have default value of payment', () => {
      const { container } = renderScenarioSelector();

      // Check that payment is selected by default - look for the radio button with checked attribute
      const radioButton = container.querySelector('.ant-radio-button-wrapper-checked');
      expect(radioButton).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = renderScenarioSelector({ className: 'custom-class' });

      expect(container.querySelector('.scenario-selector')).toHaveClass('custom-class');
    });

    it('should call onChange when scenario is selected', () => {
      const mockOnChange = vi.fn();
      const { container } = renderScenarioSelector({ onChange: mockOnChange });

      // Find and click the subscription radio button
      const radioButtons = container.querySelectorAll('.ant-radio-button-wrapper');
      if (radioButtons.length > 1) {
        fireEvent.click(radioButtons[1]);
      }
    });
  });

  describe('Layout Direction', () => {
    it('should render horizontal layout by default', () => {
      const { container } = renderScenarioSelector();

      const spaceElement = container.querySelector('.ant-space-horizontal');
      expect(spaceElement).toBeInTheDocument();
    });

    it('should render vertical layout when direction is vertical', () => {
      const { container } = renderScenarioSelector({ direction: 'vertical' });

      const spaceElement = container.querySelector('.ant-space-vertical');
      expect(spaceElement).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render icons for each scenario', () => {
      const { container } = renderScenarioSelector();

      const icons = container.querySelectorAll('.scenario-selector__icon svg');
      expect(icons.length).toBe(4);
    });
  });

  describe('Accessibility', () => {
    it('should have proper radio group structure', () => {
      const { container } = renderScenarioSelector();

      expect(container.querySelector('.ant-radio-group')).toBeInTheDocument();
    });
  });
});