import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoleLabel from '../components/RoleLabel';

describe('RoleLabel', () => {
  describe('Component Rendering', () => {
    it('should render correctly for merchant role', () => {
      render(<RoleLabel role="merchant" />);

      expect(screen.getByText('Merchant Page')).toBeInTheDocument();
    });

    it('should render correctly for evonet role', () => {
      render(<RoleLabel role="evonet" />);

      expect(screen.getByText('Evonet')).toBeInTheDocument();
    });

    it('should render icon by default', () => {
      const { container } = render(<RoleLabel role="merchant" />);

      const iconElement = container.querySelector('.role-label__icon');
      expect(iconElement).toBeInTheDocument();
    });

    it('should not render icon when showIcon is false', () => {
      const { container } = render(<RoleLabel role="merchant" showIcon={false} />);

      const iconElement = container.querySelector('.role-label__icon');
      expect(iconElement).not.toBeInTheDocument();
    });

    it('should render text correctly', () => {
      render(<RoleLabel role="merchant" />);

      const textElement = screen.getByText('Merchant Page');
      expect(textElement).toHaveClass('role-label__text');
    });
  });

  describe('Props Handling', () => {
    it('should apply correct CSS class for merchant role', () => {
      const { container } = render(<RoleLabel role="merchant" />);

      const labelElement = container.querySelector('.role-label');
      expect(labelElement).toHaveClass('role-label--merchant');
    });

    it('should apply correct CSS class for evonet role', () => {
      const { container } = render(<RoleLabel role="evonet" />);

      const labelElement = container.querySelector('.role-label');
      expect(labelElement).toHaveClass('role-label--evonet');
    });

    it('should apply additional className prop', () => {
      const { container } = render(<RoleLabel role="merchant" className="custom-class" />);

      const labelElement = container.querySelector('.role-label');
      expect(labelElement).toHaveClass('custom-class');
    });

    it('should combine multiple CSS classes', () => {
      const { container } = render(
        <RoleLabel role="evonet" className="custom-class another-class" />
      );

      const labelElement = container.querySelector('.role-label');
      expect(labelElement).toHaveClass('role-label');
      expect(labelElement).toHaveClass('role-label--evonet');
      expect(labelElement).toHaveClass('custom-class');
      expect(labelElement).toHaveClass('another-class');
    });
  });

  describe('Role Configuration', () => {
    it('should display merchant emoji when icon is shown', () => {
      const { container } = render(<RoleLabel role="merchant" showIcon={true} />);

      const iconElement = container.querySelector('.role-label__icon');
      expect(iconElement).toHaveTextContent('🛒');
    });

    it('should display evonet emoji when icon is shown', () => {
      const { container } = render(<RoleLabel role="evonet" showIcon={true} />);

      const iconElement = container.querySelector('.role-label__icon');
      expect(iconElement).toHaveTextContent('💳');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty className prop', () => {
      const { container } = render(<RoleLabel role="merchant" className="" />);

      const labelElement = container.querySelector('.role-label');
      expect(labelElement).toBeInTheDocument();
    });

    it('should render correctly with all props default', () => {
      const { container } = render(<RoleLabel role="merchant" />);

      expect(screen.getByText('Merchant Page')).toBeInTheDocument();
      expect(container.querySelector('.role-label')).toBeInTheDocument();
    });

    it('should handle both roles with same component structure', () => {
      const merchantResult = render(<RoleLabel role="merchant" />);
      merchantResult.unmount();

      const evonetResult = render(<RoleLabel role="evonet" />);

      expect(evonetResult.container.querySelector('.role-label--evonet')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render as a div element', () => {
      const { container } = render(<RoleLabel role="merchant" />);

      expect(container.querySelector('div.role-label')).toBeInTheDocument();
    });

    it('should have semantic structure with icon and text spans', () => {
      const { container } = render(<RoleLabel role="merchant" showIcon={true} />);

      expect(container.querySelector('.role-label__icon')).toBeInTheDocument();
      expect(container.querySelector('.role-label__text')).toBeInTheDocument();
    });
  });
});