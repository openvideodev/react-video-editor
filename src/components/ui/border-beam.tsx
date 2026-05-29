import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
  radius?: number;
}

export function BorderBeam({
  className,
  size = 140,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  radius = 8,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn("absolute inset-0 rounded-[inherit] pointer-events-none", className)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        className="absolute inset-0 rounded-[inherit]"
        style={{ borderRadius: "inherit" }}
      >
        <rect
          x={borderWidth}
          y={borderWidth}
          width={`calc(100% - ${borderWidth * 2}px)`}
          height={`calc(100% - ${borderWidth * 2}px)`}
          rx={radius}
          ry={radius}
          fill="none"
          stroke="transparent"
          strokeWidth={borderWidth}
        />
        <motion.rect
          x={borderWidth}
          y={borderWidth}
          width={`calc(100% - ${borderWidth * 2}px)`}
          height={`calc(100% - ${borderWidth * 2}px)`}
          rx={radius}
          ry={radius}
          fill="none"
          stroke={`url(#border-beam-gradient-${colorFrom}-${colorTo})`}
          strokeWidth={borderWidth}
          strokeLinecap="round"
          // Set pathLength to 1 to normalize the path for the dasharray
          pathLength={1}
          // Dasharray: [beam length, gap length]
          // normalized: beam (size/1000), gap (1 - beam) to sum to 1
          strokeDasharray={`${size / 1000} ${1 - size / 1000}`}
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: -1 }}
          transition={{
            repeat: Infinity,
            repeatType: "loop",
            duration: duration,
            ease: "linear",
            delay: delay,
          }}
          className="rounded-[inherit]"
        />
        <defs>
          <linearGradient
            id={`border-beam-gradient-${colorFrom}-${colorTo}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={colorFrom} stopOpacity="1" />
            <stop offset="100%" stopColor={colorTo} stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
