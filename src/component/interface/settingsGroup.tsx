'use client';

import type { ReactNode } from 'react';

interface SettingsGroupProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  extra?: ReactNode;
}

export const SettingsGroup: React.FC<SettingsGroupProps> = ({
  title,
  children,
  defaultOpen = false,
  className = '',
  extra,
}) => {
  return (
    <details
      className={`border border-gray-300 shadow rounded-lg py-1 px-2 mb-4 ${className}`}
      open={defaultOpen}
    >
      <summary className="flex items-center justify-between cursor-pointer py-1">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          <div className="flex items-center">{extra}</div>
        </div>
      </summary>
      <div className="pl-3 pt-2">{children}</div>
    </details>
  );
};
