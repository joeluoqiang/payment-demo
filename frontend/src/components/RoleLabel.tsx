import React from 'react';
import './RoleLabel.css';

export type RoleType = 'merchant' | 'evonet';

interface RoleLabelProps {
  /** Role type: merchant or evonet */
  role: RoleType;
  /** Whether to show the icon, default is true */
  showIcon?: boolean;
  /** Additional CSS class name */
  className?: string;
}

const RoleLabel: React.FC<RoleLabelProps> = ({
  role,
  showIcon = true,
  className = '',
}) => {
  const roleConfig = {
    merchant: {
      icon: 'shopping-cart',
      label: 'Merchant Page',
      emoji: '🛒',
    },
    evonet: {
      icon: 'credit-card',
      label: 'Evonet',
      emoji: '💳',
    },
  };

  const config = roleConfig[role];

  return (
    <div className={`role-label role-label--${role} ${className}`}>
      {showIcon && (
        <span className="role-label__icon">
          {config.emoji}
        </span>
      )}
      <span className="role-label__text">{config.label}</span>
    </div>
  );
};

export default RoleLabel;