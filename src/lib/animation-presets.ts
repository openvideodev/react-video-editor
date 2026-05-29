import type { KeyframeData, AnimationOptions } from "@openvideo/engine-pixi";

export interface AnimationPresetConfig {
  label: string;
  type: "keyframes";
  defaultOptions: Omit<AnimationOptions, "duration" | "delay">;
  keyframes: KeyframeData;
}

export interface GsapPresetConfig {
  label: string;
  type: "stagger";
  defaultOptions: Omit<AnimationOptions, "duration" | "delay">;
  params: Record<string, any>;
}

export type PresetConfig = AnimationPresetConfig | GsapPresetConfig;

export const ANIMATION_PRESETS: Record<string, AnimationPresetConfig> = {
  fadeIn: {
    label: "Fade In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { opacity: 0, scale: 0.9 }, "100%": { opacity: 1, scale: 1 } },
  },
  fadeOut: {
    label: "Fade Out",
    type: "keyframes",
    defaultOptions: { easing: "easeInQuad", iterCount: 1 },
    keyframes: { "0%": { opacity: 1 }, "100%": { opacity: 0 } },
  },
  zoomIn: {
    label: "Zoom In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutBack", iterCount: 1 },
    keyframes: { "0%": { scale: 0, opacity: 0 }, "100%": { scale: 1, opacity: 1 } },
  },
  zoomOut: {
    label: "Zoom Out",
    type: "keyframes",
    defaultOptions: { easing: "easeInBack", iterCount: 1 },
    keyframes: { "0%": { scale: 1, opacity: 1 }, "100%": { scale: 0, opacity: 0 } },
  },
  slideIn: {
    label: "Slide In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutCubic", iterCount: 1 },
    keyframes: { "0%": { x: -300, opacity: 0 }, "100%": { x: 0, opacity: 1 } },
  },
  slideOut: {
    label: "Slide Out",
    type: "keyframes",
    defaultOptions: { easing: "easeInCubic", iterCount: 1 },
    keyframes: { "0%": { x: 0, opacity: 1 }, "100%": { x: -300, opacity: 0 } },
  },
  blurIn: {
    label: "Blur In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { blur: 20, opacity: 0 }, "100%": { blur: 0, opacity: 1 } },
  },
  blurOut: {
    label: "Blur Out",
    type: "keyframes",
    defaultOptions: { easing: "easeInQuad", iterCount: 1 },
    keyframes: { "0%": { blur: 0, opacity: 1 }, "100%": { blur: 20, opacity: 0 } },
  },
  pulse: {
    label: "Pulse",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 3 },
    keyframes: {
      "0%": { scale: 1 },
      "25%": { scale: 0.9 },
      "50%": { scale: 1 },
      "75%": { scale: 0.9 },
      "100%": { scale: 1 },
    },
  },
  motionBlurIn: {
    label: "Motion Blur In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { motionBlur: 40, opacity: 0 }, "100%": { motionBlur: 0, opacity: 1 } },
  },
  motionBlurOut: {
    label: "Motion Blur Out",
    type: "keyframes",
    defaultOptions: { easing: "easeInQuad", iterCount: 1 },
    keyframes: { "0%": { motionBlur: 0, opacity: 1 }, "100%": { motionBlur: 40, opacity: 0 } },
  },
  blurSlideRightIn: {
    label: "Blur Slide Right In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { blur: 20, x: 300, scale: 0.7 },
      "40%": { blur: 5, x: 20, scale: 1.05 },
      "100%": { blur: 0, x: 0, scale: 1 },
    },
  },
  blurSlideLeftIn: {
    label: "Blur Slide Left In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: -400, blur: 25, scale: 0.7 },
      "30%": { x: 0, blur: 0, scale: 1 },
      "100%": { x: 0, blur: 0, scale: 1 },
    },
  },
  blurSlideRightStrongIn: {
    label: "Blur Slide Right Strong In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: 600, blur: 40, scale: 0.8 },
      "25%": { x: -20, blur: 10, scale: 1 },
      "100%": { x: 0, blur: 0, scale: 1 },
    },
  },
  wobbleZoomIn: {
    label: "Wobble Zoom In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { scale: 1.3, angle: -8 },
      "15%": { scale: 0.95, angle: 4 },
      "30%": { scale: 1.05, angle: -2 },
      "100%": { scale: 1, angle: 0 },
    },
  },
  spinZoomIn: {
    label: "Spin Zoom In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { blur: 15, angle: 180, scale: 0.7 },
      "60%": { blur: 5, angle: -10, scale: 1.1 },
      "100%": { blur: 0, angle: 0, scale: 1 },
    },
  },
  cinematicZoomSlideIn: {
    label: "Cinematic Zoom Slide In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { scale: 1.5, blur: 20, x: 100 },
      "40%": { scale: 1.1, blur: 5, x: 0 },
      "100%": { scale: 1, blur: 0, x: 0 },
    },
  },
  elasticTwistIn: {
    label: "Elastic Twist In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { scale: 0.7, blur: 15, angle: 45 },
      "50%": { scale: 1.2, blur: 0, angle: -10 },
      "75%": { scale: 0.95, blur: 0, angle: 5 },
      "100%": { scale: 1, blur: 0, angle: 0 },
    },
  },
  spinFadeIn: {
    label: "Spin Fade In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { blur: 30, angle: 90, scale: 0.7 },
      "100%": { blur: 0, angle: 0, scale: 1 },
    },
  },
  flashZoomIn: {
    label: "Flash Zoom In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { scale: 1, brightness: 6 },
      "15%": { scale: 1.3, brightness: 4 },
      "30%": { scale: 1, brightness: 1 },
      "100%": { scale: 1, brightness: 1 },
    },
  },
  tiltSlideRightIn: {
    label: "Tilt Slide Right In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { angle: -12, x: -400, scale: 1.1 },
      "30%": { angle: 3, x: 10, scale: 1 },
      "100%": { angle: 0, x: 0, scale: 1 },
    },
  },
  tiltZoomIn: {
    label: "Tilt Zoom In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { angle: 15, scale: 0.7 }, "100%": { angle: 0, scale: 1 } },
  },
  glitchSlideIn: {
    label: "Glitch Slide In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: 600, angle: 25, scale: 0.7 },
      "20%": { x: 50, angle: -10, scale: 1.1 },
      "40%": { x: -30, angle: 5, scale: 1.05 },
      "100%": { x: 0, angle: 0, scale: 1 },
    },
  },
  dropBlurIn: {
    label: "Drop Blur In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { y: -500, blur: 30, scale: 0.9 },
      "100%": { y: 0, blur: 0, scale: 1 },
    },
  },
  fallZoomIn: {
    label: "Fall Zoom In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { y: -400, scale: 1.5 },
      "30%": { y: 20, scale: 1.05 },
      "100%": { y: 0, scale: 1 },
    },
  },
  zoomSpinIn: {
    label: "Zoom Spin In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { scale: 3, angle: -45, blur: 15 },
      "100%": { scale: 1, angle: 0, blur: 0 },
    },
  },
  dramaticSpinSlideIn: {
    label: "Dramatic Spin Slide In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: 800, angle: -60, blur: 40, scale: 0.7 },
      "30%": { x: -50, angle: 5, blur: 0, scale: 1 },
      "100%": { x: 0, angle: 0, blur: 0, scale: 1 },
    },
  },
  tiltSlideRightOut: {
    label: "Tilt Slide Right Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { angle: 0, x: 0, scale: 1 },
      "30%": { angle: -3, x: -10, scale: 1 },
      "100%": { angle: 12, x: 400, scale: 1.1 },
    },
  },
  tiltZoomOut: {
    label: "Tilt Zoom Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { angle: 0, scale: 1 }, "100%": { angle: -15, scale: 0.7 } },
  },
  glitchSlideOut: {
    label: "Glitch Slide Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: 0, angle: 0, scale: 1 },
      "20%": { x: -30, angle: 5, scale: 1.05 },
      "40%": { x: 50, angle: -10, scale: 1.1 },
      "100%": { x: -600, angle: -25, scale: 0.7 },
    },
  },
  dropBlurOut: {
    label: "Drop Blur Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { y: 0, blur: 0, scale: 1 },
      "100%": { y: 500, blur: 30, scale: 0.9 },
    },
  },
  fallZoomOut: {
    label: "Fall Zoom Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { y: 0, scale: 1 },
      "30%": { y: -20, scale: 1.05 },
      "100%": { y: 400, scale: 1.5 },
    },
  },
  zoomSpinOut: {
    label: "Zoom Spin Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { scale: 1, angle: 0, blur: 0 },
      "100%": { scale: 3, angle: 45, blur: 15 },
    },
  },
  dramaticSpinSlideOut: {
    label: "Dramatic Spin Slide Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: 0, angle: 0, blur: 0, scale: 1 },
      "30%": { x: 50, angle: -5, blur: 0, scale: 1 },
      "100%": { x: -800, angle: 60, blur: 40, scale: 0.7 },
    },
  },
  blurSlideRightOut: {
    label: "Blur Slide Right Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { blur: 0, x: 0, scale: 1 },
      "40%": { blur: 5, x: -20, scale: 1.05 },
      "100%": { blur: 20, x: 300, scale: 0.7 },
    },
  },
  wobbleZoomOut: {
    label: "Wobble Zoom Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { scale: 1, angle: 0 },
      "15%": { scale: 1.05, angle: -4 },
      "30%": { scale: 0.95, angle: 2 },
      "100%": { scale: 1.3, angle: 8 },
    },
  },
  spinZoomOut: {
    label: "Spin Zoom Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { blur: 0, angle: 0, scale: 1 },
      "60%": { blur: 5, angle: 10, scale: 1.1 },
      "100%": { blur: 15, angle: -180, scale: 0.7 },
    },
  },
  blurSlideLeftOut: {
    label: "Blur Slide Left Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: 0, blur: 0, scale: 1 },
      "30%": { x: 0, blur: 5, scale: 1 },
      "100%": { x: -400, blur: 25, scale: 0.7 },
    },
  },
  blurSlideRightStrongOut: {
    label: "Blur Slide Right Strong Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: 0, blur: 0, scale: 1 },
      "25%": { x: 20, blur: 10, scale: 1 },
      "100%": { x: 600, blur: 40, scale: 0.8 },
    },
  },
  cinematicZoomSlideOut: {
    label: "Cinematic Zoom Slide Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { scale: 1, blur: 0, x: 0 },
      "40%": { scale: 1.1, blur: 5, x: -50 },
      "100%": { scale: 1.5, blur: 20, x: -100 },
    },
  },
  elasticTwistOut: {
    label: "Elastic Twist Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { scale: 1, blur: 0, angle: 0 },
      "50%": { scale: 0.9, blur: 0, angle: 10 },
      "75%": { scale: 1.1, blur: 5, angle: -5 },
      "100%": { scale: 0.7, blur: 15, angle: -45 },
    },
  },
  spinFadeOut: {
    label: "Spin Fade Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { blur: 0, angle: 0, scale: 1 },
      "100%": { blur: 30, angle: -90, scale: 0.7 },
    },
  },
  flashZoomOut: {
    label: "Flash Zoom Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { scale: 1, brightness: 1 },
      "15%": { scale: 1.3, brightness: 3 },
      "30%": { scale: 1, brightness: 5 },
      "100%": { scale: 1, brightness: 6 },
    },
  },
  slideRotateIn: {
    label: "Slide Rotate In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: -200, angle: -15 }, "100%": { x: 0, angle: 0 } },
  },
  slideRotateOut: {
    label: "Slide Rotate Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: 0, angle: 0 }, "100%": { x: -200, angle: -15 } },
  },
  slideBlurIn: {
    label: "Slide Blur In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: 250, blur: 20 }, "100%": { x: 0, blur: 0 } },
  },
  slideBlurOut: {
    label: "Slide Blur Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: 0, blur: 0 }, "100%": { x: 250, blur: 20 } },
  },
  zoomRotateIn: {
    label: "Zoom Rotate In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { scale: 1.4, angle: 20 }, "100%": { scale: 1, angle: 0 } },
  },
  zoomRotateOut: {
    label: "Zoom Rotate Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { scale: 1, angle: 0 }, "100%": { scale: 1.4, angle: 20 } },
  },
  zoomBlurIn: {
    label: "Zoom Blur In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { scale: 1.6, blur: 30 }, "100%": { scale: 1, blur: 0 } },
  },
  zoomBlurOut: {
    label: "Zoom Blur Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { scale: 1, blur: 0 }, "100%": { scale: 1.6, blur: 30 } },
  },
  slideZoomIn: {
    label: "Slide Zoom In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: -300, scale: 0.7 }, "100%": { x: 0, scale: 1 } },
  },
  slideZoomOut: {
    label: "Slide Zoom Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: 0, scale: 1 }, "100%": { x: -300, scale: 0.7 } },
  },
  verticalBlurIn: {
    label: "Vertical Blur In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { y: 200, blur: 25 }, "100%": { y: 0, blur: 0 } },
  },
  verticalBlurOut: {
    label: "Vertical Blur Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { y: 0, blur: 0 }, "100%": { y: 200, blur: 25 } },
  },
  rotateBlurIn: {
    label: "Rotate Blur In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { angle: 45, blur: 20 }, "100%": { angle: 0, blur: 0 } },
  },
  rotateBlurOut: {
    label: "Rotate Blur Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { angle: 0, blur: 0 }, "100%": { angle: 45, blur: 20 } },
  },
  cinematicSlideZoomBlurIn: {
    label: "Cinematic Slide Zoom Blur In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: 300, scale: 0.7, blur: 40 }, "100%": { x: 0, scale: 1, blur: 0 } },
  },
  cinematicSlideZoomBlurOut: {
    label: "Cinematic Slide Zoom Blur Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: 0, scale: 1, blur: 0 }, "100%": { x: 300, scale: 0.7, blur: 40 } },
  },
  brightnessZoomIn: {
    label: "Brightness Zoom In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { scale: 1.3, brightness: 3 }, "100%": { scale: 1, brightness: 1 } },
  },
  brightnessZoomOut: {
    label: "Brightness Zoom Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { scale: 1, brightness: 1 }, "100%": { scale: 1.3, brightness: 3 } },
  },
  brightnessSlideIn: {
    label: "Brightness Slide In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: -200, brightness: 0.3 }, "100%": { x: 0, brightness: 1 } },
  },
  brightnessSlideOut: {
    label: "Brightness Slide Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: 0, brightness: 1 }, "100%": { x: -200, brightness: 0.3 } },
  },
  tiltZoomBlurIn: {
    label: "Tilt Zoom Blur In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { angle: -10, scale: 1.4, blur: 20 },
      "100%": { angle: 0, scale: 1, blur: 0 },
    },
  },
  tiltZoomBlurOut: {
    label: "Tilt Zoom Blur Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { angle: 0, scale: 1, blur: 0 },
      "100%": { angle: -10, scale: 1.4, blur: 20 },
    },
  },
  dropRotateIn: {
    label: "Drop Rotate In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { y: -250, angle: 15 }, "100%": { y: 0, angle: 0 } },
  },
  dropRotateOut: {
    label: "Drop Rotate Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { y: 0, angle: 0 }, "100%": { y: -250, angle: 15 } },
  },
  spiralIn: {
    label: "Spiral In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { scale: 0.7, angle: 90, blur: 30 },
      "100%": { scale: 1, angle: 0, blur: 0 },
    },
  },
  spiralOut: {
    label: "Spiral Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { scale: 1, angle: 0, blur: 0 },
      "100%": { scale: 0.7, angle: 90, blur: 30 },
    },
  },
  flashSlideIn: {
    label: "Flash Slide In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: 150, brightness: 4 }, "100%": { x: 0, brightness: 1 } },
  },
  flashSlideOut: {
    label: "Flash Slide Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: 0, brightness: 1 }, "100%": { x: 150, brightness: 4 } },
  },
  heavyCinematicIn: {
    label: "Heavy Cinematic In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: -300, scale: 0.7, angle: -20, blur: 50 },
      "100%": { x: 0, scale: 1, angle: 0, blur: 0 },
    },
  },
  heavyCinematicOut: {
    label: "Heavy Cinematic Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: 0, scale: 1, angle: 0, blur: 0 },
      "100%": { x: -300, scale: 0.7, angle: -20, blur: 50 },
    },
  },
  diagonalSlideRotateIn: {
    label: "Diagonal Slide Rotate In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: -200, y: 150, angle: -20 }, "100%": { x: 0, y: 0, angle: 0 } },
  },
  diagonalSlideRotateOut: {
    label: "Diagonal Slide Rotate Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: 0, y: 0, angle: 0 }, "100%": { x: -200, y: 150, angle: -20 } },
  },
  diagonalBlurZoomIn: {
    label: "Diagonal Blur Zoom In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: 150, y: -150, scale: 0.7, blur: 30 },
      "100%": { x: 0, y: 0, scale: 1, blur: 0 },
    },
  },
  diagonalBlurZoomOut: {
    label: "Diagonal Blur Zoom Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: 0, y: 0, scale: 1, blur: 0 },
      "100%": { x: 150, y: -150, scale: 0.7, blur: 30 },
    },
  },
  rotateBrightnessIn: {
    label: "Rotate Brightness In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { angle: 60, brightness: 0.2 }, "100%": { angle: 0, brightness: 1 } },
  },
  rotateBrightnessOut: {
    label: "Rotate Brightness Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { angle: 0, brightness: 1 }, "100%": { angle: 60, brightness: 0.2 } },
  },
  zoomBrightnessBlurIn: {
    label: "Zoom Brightness Blur In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { scale: 1.8, brightness: 3, blur: 25 },
      "100%": { scale: 1, brightness: 1, blur: 0 },
    },
  },
  zoomBrightnessBlurOut: {
    label: "Zoom Brightness Blur Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { scale: 1, brightness: 1, blur: 0 },
      "100%": { scale: 1.8, brightness: 3, blur: 25 },
    },
  },
  slideUpRotateZoomIn: {
    label: "Slide Up Rotate Zoom In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { y: 250, angle: -15, scale: 0.7 }, "100%": { y: 0, angle: 0, scale: 1 } },
  },
  slideUpRotateZoomOut: {
    label: "Slide Up Rotate Zoom Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { y: 0, angle: 0, scale: 1 }, "100%": { y: 250, angle: -15, scale: 0.7 } },
  },
  fallBlurRotateIn: {
    label: "Fall Blur Rotate In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { y: -300, blur: 40, angle: 25 }, "100%": { y: 0, blur: 0, angle: 0 } },
  },
  fallBlurRotateOut: {
    label: "Fall Blur Rotate Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { y: 0, blur: 0, angle: 0 }, "100%": { y: -300, blur: 40, angle: 25 } },
  },
  sideStretchZoomIn: {
    label: "Side Stretch Zoom In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: 300, scale: 1.6 }, "100%": { x: 0, scale: 1 } },
  },
  sideStretchZoomOut: {
    label: "Side Stretch Zoom Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: 0, scale: 1 }, "100%": { x: 300, scale: 1.6 } },
  },
  darkSlideBlurIn: {
    label: "Dark Slide Blur In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: -250, blur: 35, brightness: 0.3 },
      "100%": { x: 0, blur: 0, brightness: 1 },
    },
  },
  darkSlideBlurOut: {
    label: "Dark Slide Blur Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: 0, blur: 0, brightness: 1 },
      "100%": { x: -250, blur: 35, brightness: 0.3 },
    },
  },
  liftZoomRotateIn: {
    label: "Lift Zoom Rotate In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { y: 200, scale: 0.7, angle: 12 }, "100%": { y: 0, scale: 1, angle: 0 } },
  },
  liftZoomRotateOut: {
    label: "Lift Zoom Rotate Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { y: 0, scale: 1, angle: 0 }, "100%": { y: 200, scale: 0.7, angle: 12 } },
  },
  overexposedZoomIn: {
    label: "Overexposed Zoom In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { scale: 1.4, brightness: 4 }, "100%": { scale: 1, brightness: 1 } },
  },
  overexposedZoomOut: {
    label: "Overexposed Zoom Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { scale: 1, brightness: 1 }, "100%": { scale: 1.4, brightness: 4 } },
  },
  pushDownZoomBlurIn: {
    label: "Push Down Zoom Blur In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { y: -180, scale: 1.5, blur: 20 }, "100%": { y: 0, scale: 1, blur: 0 } },
  },
  pushDownZoomBlurOut: {
    label: "Push Down Zoom Blur Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { y: 0, scale: 1, blur: 0 }, "100%": { y: -180, scale: 1.5, blur: 20 } },
  },
  twistSlideBrightnessIn: {
    label: "Twist Slide Brightness In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: 200, angle: 25, brightness: 0.4 },
      "100%": { x: 0, angle: 0, brightness: 1 },
    },
  },
  twistSlideBrightnessOut: {
    label: "Twist Slide Brightness Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: 0, angle: 0, brightness: 1 },
      "100%": { x: 200, angle: 25, brightness: 0.4 },
    },
  },
  collapseRotateZoomIn: {
    label: "Collapse Rotate Zoom In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { scale: 0.7, angle: -45 }, "100%": { scale: 1, angle: 0 } },
  },
  collapseRotateZoomOut: {
    label: "Collapse Rotate Zoom Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { scale: 1, angle: 0 }, "100%": { scale: 0.7, angle: -45 } },
  },
  ultraCinematicIn: {
    label: "Ultra Cinematic In",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: 400, y: 200, scale: 0.7, blur: 60, angle: 30 },
      "100%": { x: 0, y: 0, scale: 1, blur: 0, angle: 0 },
    },
  },
  ultraCinematicOut: {
    label: "Ultra Cinematic Out",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { x: 0, y: 0, scale: 1, blur: 0, angle: 0 },
      "100%": { x: 400, y: 200, scale: 0.7, blur: 60, angle: 30 },
    },
  },
  popCaption: {
    label: "Pop",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { scale: 0.7 }, "50%": { scale: 1.1 }, "100%": { scale: 1 } },
  },
  bounceCaption: {
    label: "Bounce",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: {
      "0%": { y: 0, scaleY: 1, scaleX: 1 },
      "20%": { y: 30, scaleY: 0.8, scaleX: 1.2 },
      "40%": { y: 15, scaleY: 1, scaleX: 1 },
      "60%": { y: 20, scaleY: 0.9, scaleX: 1.1 },
      "80%": { y: 10, scaleY: 1, scaleX: 1 },
      "100%": { y: 0, scaleY: 1, scaleX: 1 },
    },
  },
  scaleCaption: {
    label: "Scale",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { scale: 0 }, "100%": { scale: 1 } },
  },
  slideLeftCaption: {
    label: "Slide Left",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: 50 }, "100%": { x: 0 } },
  },
  slideRightCaption: {
    label: "Slide Right",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { x: -50 }, "100%": { x: 0 } },
  },
  slideUpCaption: {
    label: "Slide Up",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { y: 50 }, "100%": { y: 0 } },
  },
  slideDownCaption: {
    label: "Slide Down",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { y: -50 }, "100%": { y: 0 } },
  },
  fadeCaption: {
    label: "Fade",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
  },
  scaleMidCaption: {
    label: "Scale Mid",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { scale: 0.8 }, "100%": { scale: 1 } },
  },
  scaleDownCaption: {
    label: "Scale Down",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: 1 },
    keyframes: { "0%": { scale: 1.2 }, "100%": { scale: 1 } },
  },
  upDownCaption: {
    label: "Up Down",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: Infinity },
    keyframes: { "0%": { y: 0 }, "50%": { y: -300 }, "100%": { y: 0 } },
  },
  upLeftCaption: {
    label: "Up Left",
    type: "keyframes",
    defaultOptions: { easing: "easeOutQuad", iterCount: Infinity },
    keyframes: { "0%": { x: 0, y: 0 }, "50%": { x: -50, y: -50 }, "100%": { x: 0, y: 0 } },
  },
  comboZoom1: {
    label: "Combo Zoom 1",
    type: "keyframes",
    defaultOptions: { easing: "linear", iterCount: 1 },
    keyframes: {
      "0%": { scale: 2.5, motionBlur: 8, angle: 0, mirror: 1 },
      "30%": { scale: 1.2, motionBlur: 0, angle: 0, mirror: 1 },
      "60%": { scale: 1, motionBlur: 0, angle: 0, mirror: 1 },
      "100%": { scale: 2.5, motionBlur: 8, angle: 0, mirror: 1 },
    },
  },
  comboZoom2: {
    label: "Combo Zoom 2",
    type: "keyframes",
    defaultOptions: { easing: "linear", iterCount: 1 },
    keyframes: {
      "0%": { scale: 0.7, motionBlur: 8, angle: 0, mirror: 1 },
      "30%": { scale: 1, motionBlur: 0, angle: 0, mirror: 1 },
      "60%": { scale: 1, motionBlur: 0, angle: 0, mirror: 1 },
      "100%": { scale: 0.7, motionBlur: 8, angle: 0, mirror: 1 },
    },
  },
  comboPendulum1: {
    label: "Combo Pendulum 1",
    type: "keyframes",
    defaultOptions: { easing: "linear", iterCount: 1 },
    keyframes: {
      "0%": { x: -250, blur: 7, angle: 5, mirror: 1 },
      "45%": { x: -40, blur: 1, angle: 2, mirror: 1 },
      "55%": { x: 0, blur: 0, angle: 0, mirror: 1 },
      "60%": { x: 0, blur: 0, angle: 0, mirror: 1 },
      "85%": { x: -40, blur: 0, angle: -2, mirror: 1 },
      "100%": { x: -250, blur: 0, angle: -5, mirror: 1 },
    },
  },
  comboPendulum2: {
    label: "Combo Pendulum 2",
    type: "keyframes",
    defaultOptions: { easing: "linear", iterCount: 1 },
    keyframes: {
      "0%": { x: 250, blur: 7, angle: -5, mirror: 1 },
      "45%": { x: 40, blur: 1, angle: -2, mirror: 1 },
      "55%": { x: 0, blur: 0, angle: 0, mirror: 1 },
      "60%": { x: 0, blur: 0, angle: 0, mirror: 1 },
      "85%": { x: 40, blur: 0, angle: 2, mirror: 1 },
      "100%": { x: 250, blur: 0, angle: 5, mirror: 1 },
    },
  },
  comboRightDistort: {
    label: "Combo Right Distort",
    type: "keyframes",
    defaultOptions: { easing: "linear", iterCount: 1 },
    keyframes: {
      "0%": { scale: 3, angle: -15, blur: 5, mirror: 1 },
      "40%": { blur: 1, angle: -6, scale: 1.5, mirror: 1 },
      "60%": { blur: 0, angle: 0, scale: 1, mirror: 1 },
      "70%": { blur: 0, angle: 0, scale: 1, mirror: 1 },
      "85%": { scale: 0.95, mirror: 1 },
      "100%": { scale: 0.8, mirror: 1 },
    },
  },
  comboLeftDistort: {
    label: "Combo Left Distort",
    type: "keyframes",
    defaultOptions: { easing: "linear", iterCount: 1 },
    keyframes: {
      "0%": { scale: 2.5, blur: 5, mirror: 1, angle: 0 },
      "45%": { blur: 0, scale: 1, mirror: 1, angle: 0 },
      "50%": { blur: 0, scale: 1, mirror: 1, angle: 0 },
      "60%": { blur: 0, angle: -3, scale: 1, mirror: 1 },
      "75%": { blur: 0, angle: -6, scale: 1, mirror: 1 },
      "100%": { scale: 0.7, angle: -6, blur: 0, mirror: 1 },
    },
  },
  comboWobble: {
    label: "Combo Wobble",
    type: "keyframes",
    defaultOptions: { easing: "linear", iterCount: 1 },
    keyframes: {
      "0%": { scale: 1.2, angle: 15, x: -400, blur: 5, mirror: 1 },
      "6%": { scale: 1, mirror: 1, angle: 0, blur: 0, x: 0 },
      "18%": { scale: 1, mirror: 1, angle: -10, x: -100 },
      "30%": { angle: -10, scale: 1, mirror: 1, x: 0 },
      "35%": { angle: 0, scale: 1, mirror: 1, x: 0 },
      "45%": { angle: 5, scale: 1, mirror: 1, x: 0 },
      "55%": { angle: 0, scale: 1, mirror: 1, x: 0 },
      "60%": { angle: 0, scale: 1, mirror: 1, blur: 0, x: 0 },
      "100%": { scale: 2.5, blur: 5, mirror: 1 },
    },
  },
  comboSpinningTop1: {
    label: "Combo Spinning Top 1",
    type: "keyframes",
    defaultOptions: { easing: "linear", iterCount: 1 },
    keyframes: {
      "0%": { scale: 3, blur: 5, mirror: 1 },
      "25%": { scale: 1, mirror: 1, blur: 0, angle: 0 },
      "55%": { scale: 0.7, mirror: 1, angle: 8 },
      "100%": { angle: 90, scale: 0.7, mirror: 1 },
    },
  },
  comboSwayOut: {
    label: "Combo Sway Out",
    type: "keyframes",
    defaultOptions: { easing: "linear", iterCount: 1 },
    keyframes: {
      "0%": { scale: 3, blur: 5, mirror: 1 },
      "50%": { scale: 1, mirror: 1, blur: 0, angle: 0 },
      "100%": { mirror: 1, angle: 45, scale: 3, blur: 5 },
    },
  },
  comboBounce1: {
    label: "Combo Bounce 1",
    type: "keyframes",
    defaultOptions: { easing: "linear", iterCount: 1 },
    keyframes: {
      "0%": { scale: 1.2, blur: 5, mirror: 1 },
      "18%": { scale: 1, mirror: 1, blur: 0, angle: 0 },
      "50%": { scale: 1.5, mirror: 1, blur: 0, angle: -5 },
      "55%": { scale: 1.5, mirror: 1, blur: 0, angle: -5 },
      "100%": { mirror: 1, angle: 0, scale: 0.9 },
    },
  },
  comboSwayIn: {
    label: "Combo Sway In",
    type: "keyframes",
    defaultOptions: { easing: "linear", iterCount: 1 },
    keyframes: {
      "0%": { scale: 3, blur: 5, angle: -45, mirror: 1 },
      "50%": { scale: 1, mirror: 1, blur: 0, angle: 0 },
      "100%": { mirror: 1, scale: 3, blur: 5 },
    },
  },
  comboSpinningTop2: {
    label: "Combo Spinning Top 2",
    type: "keyframes",
    defaultOptions: { easing: "linear", iterCount: 1 },
    keyframes: {
      "0%": { scale: 0.8, angle: -90, mirror: 1 },
      "40%": { scale: 0.8, mirror: 1, angle: -15 },
      "60%": { scale: 1, mirror: 1, angle: 0, blur: 0 },
      "100%": { scale: 3, blur: 5, mirror: 1 },
    },
  },
};

export const GSAP_PRESETS: Record<string, GsapPresetConfig> = {
  charFadeIn: {
    label: "Char Fade In",
    type: "stagger",
    defaultOptions: { easing: "back.out", iterCount: 1 },
    params: {
      type: "character",
      from: { alpha: 0, scale: 0.5 },
      to: { alpha: 1, scale: 1 },
      stagger: 0.05,
    },
  },
  charSlideUp: {
    label: "Char Slide Up",
    type: "stagger",
    defaultOptions: { easing: "power2.out", iterCount: 1 },
    params: {
      type: "character",
      from: { alpha: 0, y: "+=50" },
      to: { alpha: 1, y: "-=50" },
      stagger: 0.05,
    },
  },
  charTypewriter: {
    label: "Char Typewriter",
    type: "stagger",
    defaultOptions: { easing: "none", iterCount: 1 },
    params: {
      type: "character",
      from: { alpha: 0 },
      to: { alpha: 1, duration: 0.001 },
      stagger: 0.05,
    },
  },
  fadeByWord: {
    label: "Fade By Word",
    type: "stagger",
    defaultOptions: { easing: "none", iterCount: 1 },
    params: { type: "word", from: { alpha: 0 }, to: { alpha: 1 }, stagger: 0.05 },
  },
  slideFadeByWord: {
    label: "Slide Fade By Word",
    type: "stagger",
    defaultOptions: { easing: "none", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, x: "+=50" },
      to: { alpha: 1, x: "-=50" },
      stagger: 0.05,
    },
  },
  popByWord: {
    label: "Pop By Word",
    type: "stagger",
    defaultOptions: { easing: "none", iterCount: 1 },
    params: {
      type: "word",
      from: { scale: 0, immediateRender: true },
      to: {
        keyframes: { "0%": { scale: 0 }, "50%": { scale: 1.2 }, "100%": { scale: 1 } },
        ease: "none",
      },
      stagger: 0.05,
    },
  },
  scaleFadeByWord: {
    label: "Scale Fade By Word",
    type: "stagger",
    defaultOptions: { easing: "back.out(1.5)", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, scale: 0.7 },
      to: { alpha: 1, scale: 1 },
      stagger: 0.08,
    },
  },
  bounceByWord: {
    label: "Bounce By Word",
    type: "stagger",
    defaultOptions: { easing: "bounce.out", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, y: "-=30", scale: 0.8 },
      to: { alpha: 1, y: "+=30", scale: 1 },
      stagger: 0.1,
    },
  },
  rotateInByWord: {
    label: "Rotate In By Word",
    type: "stagger",
    defaultOptions: { easing: "power2.out", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, rotation: -10 },
      to: { alpha: 1, rotation: 0 },
      stagger: 0.08,
    },
  },
  slideRightByWord: {
    label: "Slide Right By Word",
    type: "stagger",
    defaultOptions: { easing: "power2.out", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, x: "-=50" },
      to: { alpha: 1, x: "+=50" },
      stagger: 0.1,
    },
  },
  slideLeftByWord: {
    label: "Slide Left By Word",
    type: "stagger",
    defaultOptions: { easing: "power2.out", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, x: "+=50" },
      to: { alpha: 1, x: "-=50" },
      stagger: 0.1,
    },
  },
  fadeRotateByWord: {
    label: "Fade Rotate By Word",
    type: "stagger",
    defaultOptions: { easing: "power2.out", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, rotation: 90 },
      to: { alpha: 1, rotation: 0 },
      stagger: 0.1,
    },
  },
  skewByWord: {
    label: "Skew By Word",
    type: "stagger",
    defaultOptions: { easing: "power3.out", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, skewX: 45 },
      to: { alpha: 1, skewX: 0 },
      stagger: 0.08,
    },
  },
  waveByWord: {
    label: "Wave By Word",
    type: "stagger",
    defaultOptions: { easing: "sine.inOut", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, y: "+=20" },
      to: { alpha: 1, y: "-=20", repeat: 1, yoyo: true },
      stagger: 0.12,
    },
  },
  blurInByWord: {
    label: "Blur In By Word",
    type: "stagger",
    defaultOptions: { easing: "power2.out", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, blur: 10 },
      to: { alpha: 1, blur: 0 },
      stagger: 0.08,
    },
  },
  dropSoftByWord: {
    label: "Drop Soft By Word",
    type: "stagger",
    defaultOptions: { easing: "power3.out", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, y: "-=60", scaleY: 2 },
      to: { alpha: 1, y: "+=60", scaleY: 1 },
      stagger: 0.09,
    },
  },
  elasticPopByWord: {
    label: "Elastic Pop By Word",
    type: "stagger",
    defaultOptions: { easing: "elastic.out(1, 0.5)", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, scale: 0 },
      to: { alpha: 1, scale: 1 },
      stagger: 0.07,
    },
  },
  flipUpByWord: {
    label: "Flip Up By Word",
    type: "stagger",
    defaultOptions: { easing: "power2.out", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, skewX: -20 },
      to: { alpha: 1, skewX: 0 },
      stagger: 0.1,
    },
  },
  spinInByWord: {
    label: "Spin In By Word",
    type: "stagger",
    defaultOptions: { easing: "power3.out", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, rotation: -180, scale: 0.5 },
      to: { alpha: 1, rotation: 0, scale: 1 },
      stagger: 0.09,
    },
  },
  stretchInByWord: {
    label: "Stretch In By Word",
    type: "stagger",
    defaultOptions: { easing: "power2.out", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, scaleX: 1.5, scaleY: 0.5 },
      to: { alpha: 1, scaleX: 1, scaleY: 1 },
      stagger: 0.08,
    },
  },
  revealZoomByWord: {
    label: "Reveal Zoom By Word",
    type: "stagger",
    defaultOptions: { easing: "power4.out", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, scale: 1.4 },
      to: { alpha: 1, scale: 1 },
      stagger: 0.1,
    },
  },
  floatWaveByWord: {
    label: "Float Wave By Word",
    type: "stagger",
    defaultOptions: { easing: "sine.out", iterCount: 1 },
    params: {
      type: "word",
      from: { alpha: 0, y: "+=25" },
      to: { alpha: 1, y: "-=25" },
      stagger: 0.15,
    },
  },
};

export function getPresetKeyframes(key: string): KeyframeData {
  const preset = ANIMATION_PRESETS[key];
  return preset ? structuredClone(preset.keyframes) : { "0%": {}, "100%": {} };
}

export const SPECIAL_ANIMATIONS_CAPTIONS = [
  "charTypewriter",
  "upDownCaption",
  "upLeftCaption",
  "fadeByWord",
];
