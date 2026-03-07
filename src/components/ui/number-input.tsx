import React, { useEffect, useState, useRef } from "react";
import { InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

interface NumberInputProps extends Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "type"
> {
  value: number;
  onChange: (value: number) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Default value when input is empty (default: 0) */
  defaultValue?: number;
}

/**
 * Optimized number input that maintains local state while focused.
 * Uses text input for better UX - allows empty values and applies changes on Enter/Blur.
 *
 * @example
 * <NumberInput
 *   value={clip.left}
 *   onChange={(val) => clip.update({ left: val })}
 * />
 */
export const NumberInput = ({
  value,
  onChange,
  className,
  min,
  max,
  defaultValue = 0,
  ...props
}: NumberInputProps) => {
  const [localValue, setLocalValue] = useState<string>(value?.toString() || "0");
  const [isFocused, setIsFocused] = useState(false);
  const previousValueRef = useRef<number>(value);

  // Sync with external value only when not focused
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value?.toString() || "0");
      previousValueRef.current = value;
    }
  }, [value, isFocused]);

  const applyValue = (inputValue: string) => {
    // If empty, use default value
    if (inputValue.trim() === "") {
      onChange(defaultValue);
      setLocalValue(defaultValue.toString());
      return;
    }

    // Parse and validate
    let parsed = parseFloat(inputValue);

    if (isNaN(parsed)) {
      // Invalid input - revert to previous value
      setLocalValue(previousValueRef.current.toString());
      return;
    }

    // Apply min/max constraints
    if (min !== undefined && parsed < min) {
      parsed = min;
    }
    if (max !== undefined && parsed > max) {
      parsed = max;
    }

    // Update if value changed
    if (parsed !== previousValueRef.current) {
      onChange(parsed);
      previousValueRef.current = parsed;
    }

    setLocalValue(parsed.toString());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Allow empty, numbers, negative sign, and decimal point
    if (newValue === "" || newValue === "-" || /^-?\d*\.?\d*$/.test(newValue)) {
      setLocalValue(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyValue(localValue);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      // Revert to previous value
      setLocalValue(previousValueRef.current.toString());
      (e.target as HTMLInputElement).blur();
    }

    props.onKeyDown?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    applyValue(localValue);
    props.onBlur?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Select all text on focus for easy editing
    e.target.select();
    props.onFocus?.(e);
  };

  return (
    <InputGroupInput
      {...props}
      type="text"
      inputMode="decimal"
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn("text-sm", className)}
    />
  );
};
