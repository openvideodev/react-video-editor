"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SteppedSliderProps {
  values: number[]; // Array of values where stop marks should appear
  value: number;
  onChange: (value: number) => void;
  label?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function SteppedSlider({
  values,
  value,
  onChange,
  label,
  prefix,
  suffix,
  className,
}: SteppedSliderProps) {
  const sortedValues = [...values].sort((a, b) => a - b);
  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  // Ensure value is always one of the valid steps
  const ensureValidValue = React.useCallback(
    (val: number | null) => {
      if (val === null) return null;
      // Find the closest valid value
      const closest = sortedValues.reduce((prev, curr) => {
        return Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev;
      });
      return closest;
    },
    [sortedValues],
  );

  // Validate and correct the value prop on mount and when it changes
  React.useEffect(() => {
    const validValue = ensureValidValue(value);
    if (validValue !== null && validValue !== value) {
      onChange(validValue);
    }
  }, [value, ensureValidValue, onChange]);

  // Calculate percentage positions - evenly spaced regardless of actual values
  const getPercentage = React.useCallback(
    (val: number) => {
      const index = sortedValues.indexOf(val);
      if (index === -1) return 0;
      // Evenly space marks: first at 0%, last at 100%, others evenly distributed
      if (sortedValues.length === 1) return 50;
      return (index / (sortedValues.length - 1)) * 100;
    },
    [sortedValues],
  );

  // Find which value corresponds to a given percentage position
  const getValueFromPercentage = React.useCallback(
    (percentage: number) => {
      // Clamp percentage to valid range
      const clampedPercentage = Math.max(0, Math.min(100, percentage));

      if (sortedValues.length === 1) {
        return sortedValues[0];
      }

      const segmentSize = 100 / (sortedValues.length - 1);
      // Calculate which segment we're in
      let segmentIndex = Math.round(clampedPercentage / segmentSize);

      // Ensure we never go below 0 or above the last index
      segmentIndex = Math.max(0, Math.min(segmentIndex, sortedValues.length - 1));

      return sortedValues[segmentIndex];
    },
    [sortedValues],
  );

  // Get position from mouse/touch event
  const getPositionFromEvent = React.useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return null;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      return getValueFromPercentage(percentage);
    },
    [getValueFromPercentage],
  );

  // Handle mouse down
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const newValue = ensureValidValue(getPositionFromEvent(e.clientX));
      if (newValue !== null) {
        onChange(newValue);
      }
    },
    [getPositionFromEvent, ensureValidValue, onChange],
  );

  // Handle mouse move
  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const newValue = ensureValidValue(getPositionFromEvent(e.clientX));
      if (newValue !== null) {
        onChange(newValue);
      }
    },
    [isDragging, getPositionFromEvent, ensureValidValue, onChange],
  );

  // Handle mouse up
  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle touch start
  const handleTouchStart = React.useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const touch = e.touches[0];
      const newValue = ensureValidValue(getPositionFromEvent(touch.clientX));
      if (newValue !== null) {
        onChange(newValue);
      }
    },
    [getPositionFromEvent, ensureValidValue, onChange],
  );

  // Handle touch move
  const handleTouchMove = React.useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      const newValue = ensureValidValue(getPositionFromEvent(touch.clientX));
      if (newValue !== null) {
        onChange(newValue);
      }
    },
    [isDragging, getPositionFromEvent, ensureValidValue, onChange],
  );

  // Add/remove global event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Find which marks are active (up to current value)
  const activeMarks = sortedValues.filter((v) => v <= value);
  const inactiveMarks = sortedValues.filter((v) => v > value);

  return (
    <div className={cn("w-full space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="flex items-center gap-1">
            {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
            <span className="text-sm font-medium text-foreground">{value}</span>
            {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
          </div>
        </div>
      )}
      <div
        ref={sliderRef}
        className="relative w-full py-4 cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Background track */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-muted/60" />

        {/* Active line (filled) */}
        {activeMarks.length > 0 && (
          <div
            className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-all"
            style={{
              left: `${getPercentage(sortedValues[0])}%`,
              width: `${
                getPercentage(activeMarks[activeMarks.length - 1]) - getPercentage(sortedValues[0])
              }%`,
            }}
          />
        )}

        {/* Inactive line (lighter) */}
        {inactiveMarks.length > 0 && activeMarks.length > 0 && (
          <div
            className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-primary/30 transition-all"
            style={{
              left: `${getPercentage(activeMarks[activeMarks.length - 1])}%`,
              width: `${
                getPercentage(sortedValues[sortedValues.length - 1]) -
                getPercentage(activeMarks[activeMarks.length - 1])
              }%`,
            }}
          />
        )}

        {/* Stop marks */}
        {sortedValues.map((markValue) => {
          const isActive = markValue <= value;
          const isCurrent = markValue === value || Math.abs(markValue - value) < 1;
          const percentage = getPercentage(markValue);

          return (
            <button
              key={markValue}
              type="button"
              onClick={() => onChange(markValue)}
              className={cn(
                "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all cursor-pointer z-10",
                isCurrent
                  ? "h-4 w-4 bg-primary border-2 border-background shadow-lg"
                  : isActive
                    ? "h-3 w-3 bg-primary border-2 border-background hover:h-3.5 hover:w-3.5"
                    : "h-3 w-3 bg-muted-foreground/30 border-2 border-background hover:bg-muted-foreground/50",
              )}
              style={{ left: `${percentage}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
