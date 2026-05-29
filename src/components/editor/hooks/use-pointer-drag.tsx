import React, { useState, useEffect, useCallback, useRef } from "react";

/**
 * Event object to be applied on the target element.
 * <div {...events} />
 */
export interface IPointerDragEvents {
  onPointerDown(e: React.PointerEvent): void;
}

export interface IPointerDragReturnBase {
  /**
   * True if constraints were met and the dragging is happening.
   */
  isDragging: boolean;
}

export interface IPointerDragReturnWithState<T> extends IPointerDragReturnBase {
  /**
   * Function to be manually called when dragging begins.
   */
  startDragging(state: T): void;

  /**
   * Returns props to apply on the target React node.
   */
  dragProps(state: T): IPointerDragEvents;

  /**
   * Current drag state. Undefined if not moving.
   */
  dragState?: T;
}

export interface IPointerDragReturnWithoutState extends IPointerDragReturnBase {
  /**
   * Function to be manually called when dragging begins.
   */
  startDragging(): void;

  /**
   * Returns props to apply on the target React node.
   */
  dragProps(): IPointerDragEvents;
}

export interface IPointerDragData<T> {
  /**
   * Current pointer horizontal position (clientX).
   */
  x: number;

  /**
   * Current pointer vertical position (clientY).
   */
  y: number;

  /**
   * Difference between current horizontal position and start horizontal position. (clientX - startX)
   */
  deltaX: number;

  /**
   * Difference between current vertical position and start horizontal position. (clientY - startY)
   */
  deltaY: number;

  /**
   * Starting pointer horizontal position (clientX).
   */
  startX: number;

  /**
   * Starting pointer vertical position (clientY).
   */
  startY: number;

  /**
   * Distance between starting position and current position.
   */
  distance: number;

  /**
   * Timestamp (UNIX; milliseconds) when pointerDown occured.
   */
  startedAt: number;

  /**
   * Current dragState.
   */
  state: T;

  /**
   * Update dragState.
   */
  setState: React.Dispatch<React.SetStateAction<T | undefined>>;

  /**
   * PointerEvent object from pointerDown.
   */
  initialEvent?: PointerEvent;

  /**
   * PointerEvent object from current event.
   */
  event?: PointerEvent;
}

export interface IPointerDragOptions<T> {
  /**
   * If set to true, stopPropagation will be called.
   * Does not apply to pointerDown.
   * Default: true.
   */
  stopPropagation?: boolean;

  /**
   * If set to true, preventDefault will be called.
   * Does not apply to pointerDown.
   * Default: true.
   */
  preventDefault?: boolean;

  /**
   * If set to true, stopPropagation will be called.
   * Applies only to pointerDown.
   * Default: false.
   */
  pointerDownStopPropagation?: boolean;

  /**
   * If set to true, preventDefault will be called.
   * Applies only to pointerDown.
   * Default: false.
   */
  pointerDownPreventDefault?: boolean;

  /**
   * Called on pointerDown.
   */
  onBeforeStart?(state: IPointerDragData<T>): void;

  /**
   * Called if no dragging occurs (either due to constraints or the user not moving the pointer).
   */
  onClick?(state: IPointerDragData<T>): void;

  /**
   * Called when dragging begins (constraints were met or user moved the pointer).
   */
  onStart?(state: IPointerDragData<T>): void;

  /**
   * Called when dragging continues.
   */
  onMove?(state: IPointerDragData<T>): void;

  /**
   * Called when dragging ends.
   */
  onEnd?(state: IPointerDragData<T>): void;

  /**
   * Drag predicate function that is called during pointerMove and returns true to begin dragging.
   */
  dragPredicate?(state: IPointerDragData<T>): boolean;
}

export function usePointerDrag<T>(
  options: IPointerDragOptions<T>,
): unknown extends T ? IPointerDragReturnWithoutState : IPointerDragReturnWithState<T>;
export function usePointerDrag<T>(
  options: IPointerDragOptions<T>,
): IPointerDragReturnWithoutState | IPointerDragReturnWithState<T> {
  const [dragState, setDragState] = useState<T | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const infoRef = useRef<{
    x: number;
    y: number;
    startedAt: number;
    dragging: boolean;
    initialEvent?: PointerEvent;
  }>({ x: 0, y: 0, startedAt: 0, dragging: false });
  const optionsRef = useRef(options);
  const dragStateRef = useRef(dragState);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    if (!isStarted) {
      return;
    }

    const {
      stopPropagation = true,
      preventDefault = true,
      onClick,
      onStart,
      onMove,
      onEnd,
      dragPredicate,
    } = optionsRef.current;

    const getData = (e: PointerEvent): IPointerDragData<T> => {
      const { x: startX, y: startY, startedAt, initialEvent } = infoRef.current;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      return {
        x: e.clientX,
        y: e.clientY,
        state: dragStateRef.current!,
        setState: setDragState,
        deltaX,
        deltaY,
        startX,
        startY,
        startedAt,
        initialEvent,
        distance: Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2)),
        event: e,
      };
    };

    const handleEvent = (e: PointerEvent) => {
      if (preventDefault) e.preventDefault();
      if (stopPropagation) e.stopPropagation();
    };

    const handleMove = (e: PointerEvent) => {
      const data = getData(e);

      if (!infoRef.current.dragging) {
        if (!dragPredicate || dragPredicate(data)) {
          handleEvent(e);
          infoRef.current.dragging = true;
          onStart?.(data);
        }
      } else {
        handleEvent(e);
        onMove?.(data);
      }
    };

    const handleUp = (e: PointerEvent) => {
      const data = getData(e);
      if (infoRef.current.dragging) {
        handleEvent(e);
        onEnd?.(data);
      } else {
        onClick?.(data);
      }

      infoRef.current.dragging = false;
      setDragState(undefined);
      setIsDragging(false);
      setIsStarted(false);
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);

    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
    };
  }, [isStarted]);

  const startDragging = useCallback(
    (state?: T) => {
      setDragState(state);
      setIsStarted(true);
      setIsDragging(true);
      infoRef.current.dragging = true;
    },
    [setDragState, setIsStarted, setIsDragging],
  );

  const dragProps = useCallback(
    (state?: T) => {
      return {
        onPointerDown: (e: React.PointerEvent) => {
          setDragState(state);
          setIsStarted(true);
          setIsDragging(true);
          const now = Date.now();
          infoRef.current = {
            x: e.clientX,
            y: e.clientY,
            startedAt: now,
            dragging: false,
            initialEvent: e.nativeEvent,
          };

          if (optionsRef.current.pointerDownPreventDefault) {
            e.preventDefault();
          }

          if (optionsRef.current.pointerDownStopPropagation) {
            e.stopPropagation();
          }

          optionsRef.current.onBeforeStart?.({
            x: e.clientX,
            y: e.clientY,
            state: state!,
            setState: setDragState,
            deltaX: 0,
            deltaY: 0,
            startX: e.clientX,
            startY: e.clientY,
            startedAt: now,
            initialEvent: e.nativeEvent,
            distance: 0,
            event: e.nativeEvent,
          });
        },
      };
    },
    [setDragState, setIsStarted],
  );

  return {
    startDragging,
    dragState,
    isDragging,
    dragProps,
  } as IPointerDragReturnWithState<T> | IPointerDragReturnWithoutState;
}
