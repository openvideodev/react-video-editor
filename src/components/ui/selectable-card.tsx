"use client";

import { cn } from "@/lib/utils";
import type React from "react";

interface SelectableCardProps {
  children: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export function SelectableCard({
  children,
  isSelected,
  onClick,
  className = "",
}: SelectableCardProps) {
  return (
    <div
      className={cn(
        "cursor-pointer transition-all duration-150 relative rounded-lg",
        isSelected && "border border-brand",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
