import { useIsMobile } from "../../../hooks/use-mobile";
import { TIMELINE_OFFSET_X_SMALL, TIMELINE_OFFSET_X_LARGE } from "../constants/constants";

export function useTimelineOffsetX(): number {
  const isMobile = useIsMobile();
  return isMobile ? TIMELINE_OFFSET_X_SMALL : TIMELINE_OFFSET_X_LARGE;
}
