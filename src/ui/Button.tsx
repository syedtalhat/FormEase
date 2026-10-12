/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'md' | 'lg' | 'sm';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-body font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'h-9 px-3 text-sm min-h-[36px]',
    md: 'h-11 px-4 text-base min-h-[44px]',
    lg: 'h-[52px] px-6 text-base min-h-[52px]',
  }[size];

  const variantStyles = {
    primary:
      'bg-primary-container text-white hover:bg-primary-pressed focus:ring-primary-container active:scale-[0.99] shadow-xs',
    secondary:
      'bg-transparent border-[1.5px] border-border-strong text-text-primary hover:bg-surface-page focus:ring-primary-container active:scale-[0.99]',
    danger:
      'bg-danger text-white hover:bg-[#931D16] focus:ring-danger active:scale-[0.99] shadow-xs',
    ghost:
      'bg-transparent text-text-primary hover:bg-surface-muted focus:ring-primary-container',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
