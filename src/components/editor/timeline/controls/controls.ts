import { controlsUtils, Control, resize } from "@openvideo/timeline";
import { drawVerticalLeftIcon, drawVerticalLine, drawVerticalRightIcon } from "./draw";

const { scaleSkewCursorStyleHandler } = controlsUtils;

export const createResizeControls = () => ({
  mr: new Control({
    x: 0.5,
    y: 0,
    render: drawVerticalRightIcon,
    actionHandler: resize.common,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
    sizeX: 16,
    sizeY: 32,
    offsetX: -6,
  }),
  ml: new Control({
    x: -0.5,
    y: 0,
    actionHandler: resize.common,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
    render: drawVerticalLeftIcon,
    sizeX: 16,
    sizeY: 32,
    offsetX: 6,
  }),
});

export const createAudioControls = () => ({
  mr: new Control({
    x: 0.5,
    y: 0,
    render: drawVerticalRightIcon,
    actionHandler: resize.trimmable,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
    sizeX: 16,
    sizeY: 32,
    offsetX: -6,
  }),
  ml: new Control({
    x: -0.5,
    y: 0,
    render: drawVerticalLeftIcon,
    actionHandler: resize.trimmable,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
    sizeX: 16,
    sizeY: 32,
    offsetX: 6,
  }),
});

export const createMediaControls = () => ({
  mr: new Control({
    x: 0.5,
    y: 0,
    actionHandler: resize.trimmable,
    render: drawVerticalRightIcon,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
    sizeX: 16,
    sizeY: 32,
    offsetX: -6,
  }),
  ml: new Control({
    x: -0.5,
    y: 0,
    render: drawVerticalLeftIcon,

    actionHandler: resize.trimmable,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
    sizeX: 16,
    sizeY: 32,
    offsetX: 6,
  }),
});

export const createTransitionControls = () => ({
  mr: new Control({
    x: 0.5,
    y: 0,
    actionHandler: resize.transition,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
    render: drawVerticalLine,
  }),
  ml: new Control({
    x: -0.5,
    y: 0,
    actionHandler: resize.transition,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
    render: drawVerticalLine,
  }),
});
