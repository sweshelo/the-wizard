'use client';

import type { UseFormRegisterReturn } from 'react-hook-form';
import { useState } from 'react';

interface ToggleProps {
  label: string;
  description?: string;
  tooltipId?: string;
  registration: UseFormRegisterReturn;
  className?: string;
  defaultChecked?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  description,
  tooltipId,
  registration,
  className,
  defaultChecked,
}) => {
  const [isChecked, setIsChecked] = useState(defaultChecked || false);

  // 元のonChangeハンドラを保存
  const originalOnChange = registration.onChange;

  // 新しいregistrationオブジェクトを作成
  const modifiedRegistration = {
    ...registration,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsChecked(e.target.checked);
      // 元のonChangeも呼び出す
      if (originalOnChange) {
        void originalOnChange(e);
      }
    },
  };
  return (
    <div className={`mb-3 ${className || ''}`}>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {description && (
          <span
            className="text-xs text-gray-500 mb-2"
            {...(tooltipId ? { 'data-tooltip-id': tooltipId } : {})}
          >
            {description}
          </span>
        )}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-indigo-600"
            defaultChecked={defaultChecked}
            {...modifiedRegistration}
          />
          <span className="ml-2 text-sm text-gray-500">{isChecked ? '有効' : '無効'}</span>
        </label>
      </div>
    </div>
  );
};
