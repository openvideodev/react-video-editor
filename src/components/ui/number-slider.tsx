import React, { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";

interface NumberSliderProps extends Omit<
  React.ComponentProps<typeof Slider>,
  "value" | "onValueChange" | "onChange"
> {
  value: number;
  onChange: (value: number) => void;
}

/**
 * Optimized slider that maintains local state while interacting.
 * Prevents unnecessary re-renders from external prop updates during dragging.
 *
 * @example
 * <NumberSlider
 *   value={clip.opacity * 100}
 *   onChange={(val) => clip.update({ opacity: val / 100 })}
 *   max={100}
 *   step={1}
 * />
 */
export const NumberSlider = ({ value, onChange, className, ...props }: NumberSliderProps) => {
  const [localValue, setLocalValue] = useState<number>(value);
  const [isInteracting, setIsInteracting] = useState(false);

  // Sync with external value only when not interacting
  useEffect(() => {
    if (!isInteracting) {
      setLocalValue(value);
    }
  }, [value, isInteracting]);

  const handleValueChange = (newValue: number[]) => {
    setLocalValue(newValue[0]);
    onChange(newValue[0]);
  };

  return (
    <Slider
      {...props}
      value={[localValue]}
      onValueChange={handleValueChange}
      onPointerDown={() => setIsInteracting(true)}
      onPointerUp={() => setIsInteracting(false)}
      className={className}
    />
  );
};
