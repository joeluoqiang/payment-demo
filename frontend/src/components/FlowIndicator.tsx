import React from 'react';
import { CheckOutlined } from '@ant-design/icons';
import RoleLabel from './RoleLabel';
import type { RoleType } from './RoleLabel';
import './FlowIndicator.css';

export interface FlowStep {
  /** Unique identifier for the step */
  id: string;
  /** Display label for the step */
  label: string;
  /** Role associated with this step */
  role: RoleType;
  /** Optional description */
  description?: string;
}

interface FlowIndicatorProps {
  /** Array of steps to display */
  steps: FlowStep[];
  /** Current active step ID */
  currentStep: string;
  /** Optional callback when a step is clicked */
  onStepClick?: (stepId: string) => void;
  /** Additional CSS class name */
  className?: string;
}

const FlowIndicator: React.FC<FlowIndicatorProps> = ({
  steps,
  currentStep,
  onStepClick,
  className = '',
}) => {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  const getStepStatus = (index: number): 'completed' | 'active' | 'pending' => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className={`flow-indicator ${className}`}>
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div
              className={`flow-step flow-step--${status}`}
              onClick={() => onStepClick?.(step.id)}
              role={onStepClick ? 'button' : undefined}
              tabIndex={onStepClick ? 0 : undefined}
            >
              <div className="flow-step__indicator">
                {status === 'completed' ? (
                  <CheckOutlined className="flow-step__check-icon" />
                ) : (
                  <span className="flow-step__number">{index + 1}</span>
                )}
              </div>
              <div className="flow-step__content">
                <span className="flow-step__label">{step.label}</span>
                <RoleLabel role={step.role} showIcon={false} className="flow-step__role" />
              </div>
              {step.description && (
                <span className="flow-step__description">{step.description}</span>
              )}
            </div>
            {!isLast && (
              <div className={`flow-connector flow-connector--${status}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default FlowIndicator;