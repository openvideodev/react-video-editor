"use client";

import { cn } from "@/lib/utils";
import { type Tab, tabs, useMediaPanelStore } from "./store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useRef, useState } from "react";

export function TabBar() {
  const { activeTab, setActiveTab } = useMediaPanelStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const checkScrollPosition = () => {
    const element = scrollRef.current;
    if (!element) return;

    const { scrollLeft, scrollWidth, clientWidth } = element;
    setShowLeftFade(scrollLeft > 0);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    checkScrollPosition();
    element.addEventListener("scroll", checkScrollPosition);

    const resizeObserver = new ResizeObserver(checkScrollPosition);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener("scroll", checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative flex items-center py-2 px-2 bg-primary/7">
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-linear-to-r from-card to-transparent z-10 pointer-events-none" />
      )}
      <div ref={scrollRef} className="overflow-x-auto scrollbar-hidden w-full">
        <div className="flex items-center gap-2 w-fit mx-auto px-4">
          {(Object.keys(tabs) as Tab[]).map((tabKey) => {
            const tab = tabs[tabKey];
            const isActive = activeTab === tabKey;
            return (
              <div
                className={cn(
                  "flex items-center justify-center flex-none h-7.5 w-7.5 cursor-pointer rounded-sm transition-all duration-200",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white",
                )}
                onClick={() => setActiveTab(tabKey)}
                key={tabKey}
              >
                <Tooltip delayDuration={10}>
                  <TooltipTrigger asChild>
                    <tab.icon className="size-5" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="center" sideOffset={8}>
                    {tab.label}
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </div>
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-card to-transparent z-10 pointer-events-none" />
      )}
    </div>
  );
}
