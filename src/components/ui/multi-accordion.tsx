"use client";
import React, { ReactNode, ReactElement, isValidElement } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "./separator";

type AccordionContextType = {
  isActive: boolean;
  value: string;
  onChangeIndex: (value: string) => void;
};

const AccordionContext = React.createContext<AccordionContextType>({
  isActive: false,
  value: "",
  onChangeIndex: () => {},
});

const useAccordion = () => React.useContext(AccordionContext);

export function AccordionContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("grid grid-cols-2 gap-1", className)}>{children}</div>;
}

export function AccordionWrapper({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function Accordion({
  children,
  multiple,
  defaultValue,
}: {
  children: ReactNode;
  multiple?: boolean;
  defaultValue?: string | string[];
}) {
  const [activeIndex, setActiveIndex] = React.useState<string[]>(
    multiple
      ? defaultValue
        ? Array.isArray(defaultValue)
          ? defaultValue
          : [defaultValue]
        : []
      : defaultValue
        ? Array.isArray(defaultValue)
          ? [defaultValue[0]]
          : [defaultValue]
        : [],
  );

  function onChangeIndex(value: string) {
    setActiveIndex((currentActiveIndex) => {
      if (!multiple) {
        return value === currentActiveIndex[0] ? [] : [value];
      }

      if (currentActiveIndex.includes(value)) {
        return currentActiveIndex.filter((i) => i !== value);
      }

      return [...currentActiveIndex, value];
    });
  }

  return React.Children.map(children, (child) => {
    if (!isValidElement<{ value?: string }>(child)) return null;

    const value = child.props.value ?? "";
    const isActive = multiple ? activeIndex.includes(value) : activeIndex[0] === value;

    return (
      <AccordionContext.Provider value={{ isActive, value, onChangeIndex }}>
        {React.cloneElement(child)}
      </AccordionContext.Provider>
    );
  });
}

export function AccordionItem({ children, value }: { children: ReactNode; value: string }) {
  const { isActive } = useAccordion();

  return (
    <div
      data-active={isActive || undefined}
      style={{
        boxShadow: isActive ? "0px 0px 20px 1px rgba(25,92,150,1)" : "0px 0px 0px 2px transparent",
      }}
      className={`rounded-lg overflow-hidden mb-3 ${
        isActive
          ? "active border-2 border-black bg-black"
          : "bg-white/4 border-2 hover:border-white/15"
      }
    `}
      data-value={value}
    >
      {children}
    </div>
  );
}

export function AccordionHeader({
  children,
  customIcon,
  className,
}: {
  children: ReactNode;
  customIcon?: boolean;
  className?: string;
}) {
  const { isActive, value, onChangeIndex } = useAccordion();

  return (
    <motion.div
      data-active={isActive || undefined}
      className={cn(
        "group p-4 cursor-pointer text-sm transition-all font-semibold flex justify-between items-center",
        isActive ? "text-white" : "text-white/90",
        className,
      )}
      onClick={() => onChangeIndex(value)}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          isActive ? "[&_svg]:text-white" : "[&_svg]:text-white/50",
          "[&_svg]:transition-colors [&_svg]:duration-200",
        )}
      >
        {children}
      </div>
      {!customIcon && (
        <ChevronDown
          className={cn("transition-transform size-4 ", isActive ? "rotate-180" : "rotate-0")}
        />
      )}
    </motion.div>
  );
}

export function AccordionPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { isActive } = useAccordion();

  return (
    <AnimatePresence initial={true}>
      {isActive && (
        <motion.div
          data-active={isActive || undefined}
          initial={{ height: 0, overflow: "hidden" }}
          animate={{ height: "auto", overflow: "hidden" }}
          exit={{ height: 0 }}
          transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          className={cn("group", className)}
        >
          <Separator />

          <motion.article
            initial={{ clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }}
            animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)" }}
            exit={{
              clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)",
            }}
            transition={{
              type: "spring",
              duration: 0.4,
              bounce: 0,
            }}
            className={`p-3 `}
          >
            {children}
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
