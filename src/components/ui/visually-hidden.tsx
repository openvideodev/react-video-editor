"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function VisuallyHidden({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]",
        className,
      )}
      {...props}
    />
  );
}
