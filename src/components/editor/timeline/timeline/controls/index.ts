import { Control, controlsUtils } from "fabric";
import { drawVerticalLine } from "./render";
import { changeWidth } from "./resize-action";
import { changeTrim } from "./trim-action";
// import { changeWidth } from "../resize/common";
// import { drawVerticalLine } from "./draw";
// import { resizeAudio } from "../resize/audio";
// import { resizeMedia } from "../resize/media";
// import { resizeTransitionWidth } from "../resize/transition";

const { scaleSkewCursorStyleHandler } = controlsUtils;

export const createResizeControls = () => ({
  mr: new Control({
    x: 0.5,
    y: 0,
    actionHandler: changeWidth,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
    render: drawVerticalLine,
    offsetX: -8,
  }),
  ml: new Control({
    x: -0.5,
    y: 0,
    actionHandler: changeWidth,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
    render: drawVerticalLine,
    offsetX: 8,
  }),
});

export const createAudioControls = () => ({
  mr: new Control({
    x: 0.5,
    y: 0,
    // render: drawVerticalLine,
    // actionHandler: resizeAudio,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
  }),
  ml: new Control({
    x: -0.5,
    y: 0,
    // render: drawVerticalLine,
    // actionHandler: resizeAudio,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
  }),
});

export const createTrimControls = () => ({
  mr: new Control({
    x: 0.5,
    y: 0,
    render: drawVerticalLine,
    actionHandler: changeTrim,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
    offsetX: -8,
  }),
  ml: new Control({
    x: -0.5,
    y: 0,
    render: drawVerticalLine,
    actionHandler: changeTrim,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
    offsetX: 8,
  }),
});

export const createTransitionControls = () => ({
  mr: new Control({
    x: 0.5,
    y: 0,
    // actionHandler: resizeTransitionWidth,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
    // render: drawVerticalLine,
  }),
  ml: new Control({
    x: -0.5,
    y: 0,
    // actionHandler: resizeTransitionWidth,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: "resizing",
    // render: drawVerticalLine,
  }),
});
