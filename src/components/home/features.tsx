"use client";
import React from "react";
import { Sparkles, Wand2, ArrowRightLeft, Move } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/shared/icons";
import { IconSparkles2 } from "@tabler/icons-react";

const FeatureCard = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
}) => {
  return (
    <div className="flex items-center justify-center flex-col gap-4 p-4">
      <div className="icon">{icon}</div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

const Features = () => {
  const features = [
    {
      title: "AI Editor Copilot",
      description:
        "Write commands to edit video, generate transitions or analyze your media in real time.",
      icon: <IconSparkles2 size={18} />,
    },
    {
      title: "Zero Latency Renderer",
      description:
        "Fast, client-side rendering using WebCodecs and PixiJS for a smooth editing experience.",
      icon: <Icons.video size={18} />,
    },
    {
      title: "Chroma Key",
      description: "Professional background removal for any video with just one click.",
      icon: <Sparkles size={18} />,
    },
    {
      title: "Pro Effects",
      description: "Apply cinematic filters and custom GLSL effects to your creative projects.",
      icon: <Wand2 size={18} />,
    },
    {
      title: "Smooth Transitions",
      description: "Seamlessly blend clips with a variety of professional-grade transitions.",
      icon: <ArrowRightLeft size={18} />,
    },
    {
      title: "Fluid Animations",
      description: "Bring elements to life with customizable keyframe-based motion and transforms.",
      icon: <Move size={18} />,
    },
  ];

  return (
    <>
      {" "}
      <section className="flex flex-col items-center justify-center gap-16 py-28 p-8 text-center px-4 w-full border-t">
        <div className="flex items-center justify-center gap-6 flex-col">
          <Badge variant="secondary" className="px-4 py-2">
            Features
          </Badge>{" "}
          <h2 className="text-4xl font-medium tracking-tight">
            Everything you need to edit at phase
          </h2>
          <p className="max-w-2xl mx-auto max-sm:text-sm text-muted-foreground text-lg">
            Powerful AI-assisted tools, real-time rendering and professional video workflows — all
            running directly in your browser.
          </p>
        </div>{" "}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className="p-8 relative">
              <FeatureCard
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
              />
              {/* Faded bottom border */}
              {index < features.length - 1 && (
                <div className="absolute bottom-0 left-4 right-4 h-[1.5px] bg-linear-to-r from-transparent via-border to-transparent sm:hidden" />
              )}
              {index < features.length - 2 && (
                <div className="absolute bottom-0 left-4 right-4 h-[1.5px] bg-linear-to-r from-transparent via-border to-transparent hidden sm:block lg:hidden" />
              )}
              {index < 3 && (
                <div className="absolute bottom-0 left-4 right-4 h-[1.5px] bg-linear-to-r from-transparent via-border to-transparent hidden lg:block" />
              )}
              {index >= 3 && index < 6 && (
                <div className="absolute bottom-0 left-4 right-4 h-[1.5px] bg-linear-to-r from-transparent via-border to-transparent hidden lg:block" />
              )}
              {/* Faded right border */}
              {index % 2 === 0 && index < features.length - 1 && (
                <div className="absolute right-0 top-4 bottom-4 w-[1.5px] bg-linear-to-b from-transparent via-border to-transparent hidden sm:block lg:hidden" />
              )}
              {index % 3 !== 2 && (
                <div className="absolute right-0 top-4 bottom-4 w-[1.5px] bg-linear-to-b from-transparent via-border to-transparent hidden lg:block" />
              )}{" "}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Start creating professional content with our powerful editing tools.
        </p>
      </section>
    </>
  );
};

export default Features;
