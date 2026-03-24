import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FlowIndicator, { type FlowStep } from '../components/FlowIndicator';

describe('FlowIndicator', () => {
  const defaultSteps: FlowStep[] = [
    { id: 'step1', label: 'Step One', role: 'merchant' },
    { id: 'step2', label: 'Step Two', role: 'evonet' },
    { id: 'step3', label: 'Step Three', role: 'merchant' },
  ];

  describe('Component Rendering', () => {
    it('should render all steps', () => {
      render(<FlowIndicator steps={defaultSteps} currentStep="step1" />);

      expect(screen.getByText('Step One')).toBeInTheDocument();
      expect(screen.getByText('Step Two')).toBeInTheDocument();
      expect(screen.getByText('Step Three')).toBeInTheDocument();
    });

    it('should render step numbers for pending and active steps', () => {
      const { container } = render(
        <FlowIndicator steps={defaultSteps} currentStep="step1" />
      );

      const stepNumbers = container.querySelectorAll('.flow-step__number');
      expect(stepNumbers.length).toBeGreaterThan(0);
    });

    it('should render role labels for each step', () => {
      render(<FlowIndicator steps={defaultSteps} currentStep="step1" />);

      const merchantLabels = screen.getAllByText('Merchant Page');
      const evonetLabels = screen.getAllByText('Evonet');

      expect(merchantLabels.length).toBe(2); // step1 and step3
      expect(evonetLabels.length).toBe(1); // step2
    });

    it('should render step descriptions when provided', () => {
      const stepsWithDescriptions: FlowStep[] = [
        { id: 'step1', label: 'Step One', role: 'merchant', description: 'First step desc' },
        { id: 'step2', label: 'Step Two', role: 'evonet', description: 'Second step desc' },
      ];

      render(<FlowIndicator steps={stepsWithDescriptions} currentStep="step1" />);

      expect(screen.getByText('First step desc')).toBeInTheDocument();
      expect(screen.getByText('Second step desc')).toBeInTheDocument();
    });

    it('should not render descriptions when not provided', () => {
      const { container } = render(
        <FlowIndicator steps={defaultSteps} currentStep="step1" />
      );

      const descriptions = container.querySelectorAll('.flow-step__description');
      expect(descriptions.length).toBe(0);
    });
  });

  describe('Step Status', () => {
    it('should mark first step as active when currentStep is first', () => {
      const { container } = render(
        <FlowIndicator steps={defaultSteps} currentStep="step1" />
      );

      const stepElements = container.querySelectorAll('.flow-step');
      expect(stepElements[0]).toHaveClass('flow-step--active');
      expect(stepElements[1]).toHaveClass('flow-step--pending');
      expect(stepElements[2]).toHaveClass('flow-step--pending');
    });

    it('should mark previous steps as completed', () => {
      const { container } = render(
        <FlowIndicator steps={defaultSteps} currentStep="step2" />
      );

      const stepElements = container.querySelectorAll('.flow-step');
      expect(stepElements[0]).toHaveClass('flow-step--completed');
      expect(stepElements[1]).toHaveClass('flow-step--active');
      expect(stepElements[2]).toHaveClass('flow-step--pending');
    });

    it('should mark all previous steps as completed when on last step', () => {
      const { container } = render(
        <FlowIndicator steps={defaultSteps} currentStep="step3" />
      );

      const stepElements = container.querySelectorAll('.flow-step');
      expect(stepElements[0]).toHaveClass('flow-step--completed');
      expect(stepElements[1]).toHaveClass('flow-step--completed');
      expect(stepElements[2]).toHaveClass('flow-step--active');
    });

    it('should show check icon for completed steps', () => {
      const { container } = render(
        <FlowIndicator steps={defaultSteps} currentStep="step3" />
      );

      const checkIcons = container.querySelectorAll('.flow-step__check-icon');
      expect(checkIcons.length).toBe(2); // step1 and step2 are completed
    });

    it('should show number for active and pending steps', () => {
      const { container } = render(
        <FlowIndicator steps={defaultSteps} currentStep="step2" />
      );

      const stepNumbers = container.querySelectorAll('.flow-step__number');
      expect(stepNumbers.length).toBe(2); // step2 (active) and step3 (pending) show numbers
    });
  });

  describe('Connector Lines', () => {
    it('should render connectors between steps', () => {
      const { container } = render(
        <FlowIndicator steps={defaultSteps} currentStep="step1" />
      );

      const connectors = container.querySelectorAll('.flow-connector');
      expect(connectors.length).toBe(2); // 3 steps = 2 connectors
    });

    it('should not render connector after last step', () => {
      const { container } = render(
        <FlowIndicator steps={defaultSteps} currentStep="step1" />
      );

      const connectors = container.querySelectorAll('.flow-connector');
      // 3 steps should have 2 connectors, so last step has no connector after it
      expect(connectors.length).toBe(2);
    });

    it('should apply completed class to connectors before current step', () => {
      const { container } = render(
        <FlowIndicator steps={defaultSteps} currentStep="step2" />
      );

      const connectors = container.querySelectorAll('.flow-connector');
      expect(connectors[0]).toHaveClass('flow-connector--completed');
    });
  });

  describe('User Interaction', () => {
    it('should call onStepClick when step is clicked', () => {
      const handleClick = vi.fn();
      render(
        <FlowIndicator
          steps={defaultSteps}
          currentStep="step1"
          onStepClick={handleClick}
        />
      );

      const stepTwo = screen.getByText('Step Two').closest('.flow-step');
      fireEvent.click(stepTwo!);

      expect(handleClick).toHaveBeenCalledWith('step2');
    });

    it('should not make steps clickable when onStepClick is not provided', () => {
      const { container } = render(
        <FlowIndicator steps={defaultSteps} currentStep="step1" />
      );

      const steps = container.querySelectorAll('.flow-step');
      steps.forEach((step) => {
        expect(step).not.toHaveAttribute('role', 'button');
        expect(step).not.toHaveAttribute('tabIndex');
      });
    });

    it('should make steps focusable when onStepClick is provided', () => {
      const { container } = render(
        <FlowIndicator
          steps={defaultSteps}
          currentStep="step1"
          onStepClick={vi.fn()}
        />
      );

      const steps = container.querySelectorAll('.flow-step');
      steps.forEach((step) => {
        expect(step).toHaveAttribute('role', 'button');
        expect(step).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Props Handling', () => {
    it('should apply additional className prop', () => {
      const { container } = render(
        <FlowIndicator
          steps={defaultSteps}
          currentStep="step1"
          className="custom-class"
        />
      );

      const indicator = container.querySelector('.flow-indicator');
      expect(indicator).toHaveClass('custom-class');
    });

    it('should handle empty steps array', () => {
      const { container } = render(
        <FlowIndicator steps={[]} currentStep="" />
      );

      const steps = container.querySelectorAll('.flow-step');
      expect(steps.length).toBe(0);
    });

    it('should handle single step', () => {
      const singleStep: FlowStep[] = [{ id: 'only', label: 'Only Step', role: 'merchant' }];
      const { container } = render(
        <FlowIndicator steps={singleStep} currentStep="only" />
      );

      const steps = container.querySelectorAll('.flow-step');
      expect(steps.length).toBe(1);

      const connectors = container.querySelectorAll('.flow-connector');
      expect(connectors.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle currentStep not found in steps', () => {
      const { container } = render(
        <FlowIndicator steps={defaultSteps} currentStep="nonexistent" />
      );

      const stepElements = container.querySelectorAll('.flow-step');
      stepElements.forEach((step) => {
        expect(step).toHaveClass('flow-step--pending');
      });
    });

    it('should handle steps with same role', () => {
      const sameRoleSteps: FlowStep[] = [
        { id: 's1', label: 'Step 1', role: 'merchant' },
        { id: 's2', label: 'Step 2', role: 'merchant' },
      ];

      render(<FlowIndicator steps={sameRoleSteps} currentStep="s1" />);

      const merchantLabels = screen.getAllByText('Merchant Page');
      expect(merchantLabels.length).toBe(2);
    });

    it('should handle very long step labels', () => {
      const longLabelSteps: FlowStep[] = [
        {
          id: 'long',
          label: 'This is a very long step label that might overflow the container',
          role: 'merchant',
        },
      ];

      render(<FlowIndicator steps={longLabelSteps} currentStep="long" />);

      expect(
        screen.getByText('This is a very long step label that might overflow the container')
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper structure with step indicators', () => {
      const { container } = render(
        <FlowIndicator steps={defaultSteps} currentStep="step1" />
      );

      const indicators = container.querySelectorAll('.flow-step__indicator');
      expect(indicators.length).toBe(3);
    });

    it('should have proper structure with step content', () => {
      const { container } = render(
        <FlowIndicator steps={defaultSteps} currentStep="step1" />
      );

      const contents = container.querySelectorAll('.flow-step__content');
      expect(contents.length).toBe(3);
    });

    it('should render keyboard-focusable steps when clickable', () => {
      const { container } = render(
        <FlowIndicator
          steps={defaultSteps}
          currentStep="step1"
          onStepClick={vi.fn()}
        />
      );

      const clickableSteps = container.querySelectorAll('.flow-step[tabindex="0"]');
      expect(clickableSteps.length).toBe(3);
    });
  });
});