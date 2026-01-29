'use client';

import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { Tooltip } from 'react-tooltip';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface NumberInputProps {
  label: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  tooltipId?: string;
  tooltipContent?: string;
  registration: UseFormRegisterReturn;
  className?: string;
  defaultValue?: number | string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  label,
  description,
  min = 0,
  max = 100,
  step = 1,
  tooltipId,
  tooltipContent,
  registration,
  className,
  defaultValue,
}) => {
  const rangeRef = useRef<HTMLInputElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);

  // Initialize with defaultValue if provided, otherwise use min
  const initialValue = defaultValue !== undefined ? String(defaultValue) : String(min);
  const [value, setValue] = useState<string>(initialValue);

  // Update value when defaultValue changes externally
  useEffect(() => {
    if (defaultValue !== undefined) {
      setValue(String(defaultValue));
    }
  }, [defaultValue]);

  // Handle changes from either input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <div className={`mb-3 ${className || ''}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {tooltipId && (
          <span data-tooltip-id={tooltipId} className="ml-1 text-gray-400 cursor-help">
            ⓘ
          </span>
        )}
      </label>
      {description && <div className="text-xs text-gray-500 mb-2">{description}</div>}
      <div className="flex items-center space-x-2 relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          className="w-full"
          name={registration.name}
          onChange={e => {
            handleChange(e);
            void registration.onChange(e);
          }}
          onBlur={registration.onBlur}
          ref={rangeRef}
          value={value}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center"
          name={registration.name}
          onChange={e => {
            handleChange(e);
            void registration.onChange(e);
          }}
          onBlur={registration.onBlur}
          ref={e => {
            numberRef.current = e;
            if (typeof registration.ref === 'function') {
              registration.ref(e);
            }
          }}
          value={value}
        />
      </div>
      {tooltipId && tooltipContent && (
        <Tooltip id={tooltipId}>
          <span>{tooltipContent}</span>
        </Tooltip>
      )}
    </div>
  );
};
