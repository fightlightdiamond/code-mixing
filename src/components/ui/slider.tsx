"use client";

import React, { useCallback } from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value,
      onValueChange,
      max = 100,
      min = 0,
      step = 1,
      className,
      disabled = false,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        onValueChange([newValue]);
      },
      [onValueChange]
    );

    return (
      <div className={cn("relative flex items-center w-full", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0] || 0}
          onChange={handleChange}
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            // Custom slider thumb styling
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:h-4",
            "[&::-webkit-slider-thumb]:w-4",
            "[&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-blue-600",
            "[&::-webkit-slider-thumb]:cursor-pointer",
            "[&::-webkit-slider-thumb]:shadow-md",
            "[&::-webkit-slider-thumb]:hover:bg-blue-700",
            // Firefox styling
            "[&::-moz-range-thumb]:h-4",
            "[&::-moz-range-thumb]:w-4",
            "[&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:bg-blue-600",
            "[&::-moz-range-thumb]:cursor-pointer",
            "[&::-moz-range-thumb]:border-none",
            "[&::-moz-range-thumb]:shadow-md",
            // Track styling
            "[&::-webkit-slider-runnable-track]:bg-gray-200",
            "[&::-webkit-slider-runnable-track]:rounded-lg",
            "[&::-webkit-slider-runnable-track]:h-2",
            "[&::-moz-range-track]:bg-gray-200",
            "[&::-moz-range-track]:rounded-lg",
            "[&::-moz-range-track]:h-2",
            "[&::-moz-range-track]:border-none"
          )}
          {...props}
        />

        {/* Progress fill */}
        <div
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-2 bg-blue-600 rounded-lg pointer-events-none"
          style={{
            width: `${(((value[0] || 0) - min) / (max - min)) * 100}%`,
          }}
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";
