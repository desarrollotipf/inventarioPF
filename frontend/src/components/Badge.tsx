import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'cyan';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const styles = {
    default: 'bg-neutral-900 text-neutral-300 border-neutral-700',
    success: 'bg-white text-black border-white font-bold',
    warning: 'bg-neutral-800 text-neutral-200 border-neutral-600 font-semibold',
    danger: 'bg-neutral-950 text-white border-neutral-400 font-bold',
    info: 'bg-neutral-900 text-neutral-300 border-neutral-700',
    purple: 'bg-neutral-900 text-neutral-200 border-neutral-600',
    cyan: 'bg-neutral-800 text-white border-neutral-600',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};
