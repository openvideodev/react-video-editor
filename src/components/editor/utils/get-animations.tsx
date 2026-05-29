import { IClip } from "@openvideo/timeline";
import { easings } from "@openvideo/engine-pixi";

export interface ICompositionAnimation {
  property: string;
  from: any;
  to: any;
  durationInFrames: number;
  easing: string;
}

export interface IBasicAnimation {
  name: string;
  composition: ICompositionAnimation[];
}

export interface Animation {
  property: string;
  from: any;
  to: any;
  durationInFrames: number;
  ease: (t: number) => number;
}

export const getAnimations = (
  animation: {
    in?: IBasicAnimation;
    out?: IBasicAnimation;
    loop?: IBasicAnimation;
    timed?: IBasicAnimation;
  },
  item: IClip,
  _frame?: number,
  _fps?: number,
): {
  animationIn: Animation | Animation[] | null;
  animationOut: Animation | Animation[] | null;
  animationLoop?: Animation | Animation[] | null;
  animationTimed?: Animation | Animation[] | null;
} => {
  let animationIn: Animation[] | null = null;
  let animationOut: Animation[] | null = null;
  const animationLoop = null;
  const animationTimed = null;

  const animIn = animation?.in;
  if (animIn) {
    animationIn = [];
    animIn.composition.forEach((comp) => {
      if (animIn.name.includes("slide")) {
        const slideAnim = getSlideAnimation(animIn.name, comp, item);
        if (slideAnim) animationIn!.push(slideAnim);
      } else {
        animationIn!.push({
          property: comp.property,
          from: comp.from,
          to: comp.to,
          durationInFrames: comp.durationInFrames,
          ease: easings[comp.easing] || easings.linear,
        });
      }
    });
  }

  const animOut = animation?.out;
  if (animOut) {
    animationOut = [];
    animOut.composition.forEach((comp) => {
      if (animOut.name.includes("slide")) {
        const slideAnim = getSlideAnimation(animOut.name, comp, item);
        if (slideAnim) animationOut!.push(slideAnim);
      } else {
        animationOut!.push({
          property: comp.property,
          from: comp.from,
          to: comp.to,
          durationInFrames: comp.durationInFrames,
          ease: easings[comp.easing] || easings.linear,
        });
      }
    });
  }

  return {
    animationIn,
    animationOut,
    animationLoop,
    animationTimed,
  };
};

const getSlideAnimation = (
  type: string,
  anim: ICompositionAnimation,
  item: IClip,
): Animation | null => {
  const transformString = (item as any).transform || "";
  const scaleMatch = /scale\(([^,]+), ([^)]+)\)/.exec(transformString);
  const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

  let from = anim.from;
  let to = anim.to;

  if (type === "slideInRight" || type === "slideOutLeft") {
    const commonValue = -parseFloat((item as any).left) - (item as any).width / scale;
    from = type.includes("In") ? commonValue : anim.from;
    to = type.includes("In") ? anim.to : commonValue;
  } else if (type === "slideInLeft" || type === "slideOutRight") {
    const commonValue = parseFloat((item as any).left) + (item as any).width / scale;
    from = type.includes("In") ? commonValue : anim.from;
    to = type.includes("In") ? anim.to : commonValue;
  } else if (type === "slideInBottom" || type === "slideOutTop") {
    const commonValue = -parseFloat((item as any).top) - (item as any).height / scale;
    from = type.includes("In") ? commonValue : anim.from;
    to = type.includes("In") ? anim.to : commonValue;
  } else if (type === "slideInTop" || type === "slideOutBottom") {
    const commonValue = parseFloat((item as any).top) + (item as any).height / scale;
    from = type.includes("In") ? commonValue : anim.from;
    to = type.includes("In") ? anim.to : commonValue;
  } else {
    return null;
  }

  return {
    property: anim.property,
    from,
    to,
    durationInFrames: anim.durationInFrames,
    ease: easings[anim.easing] || easings.linear,
  };
};
