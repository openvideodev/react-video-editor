"use client";
import { Icons } from "@/components/shared/icons";
import { LogoIcons } from "@/components/shared/logos";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  Wand2,
  ArrowRightLeft,
  Move,
} from "lucide-react";
import { motion } from "motion/react";

const FEATURES = [
  {
    title: "AI Editor Copilot",
    description:
      "Write commands to edit video, generate transitions or analyze your media in real time.",
    icon: Icons.ai,
    color: "bg-purple-100/50",
    iconColor: "text-purple-600",
  },
  {
    title: "Zero Latency Renderer",
    description:
      "Fast, client-side rendering using WebCodecs and PixiJS for a smooth editing experience.",
    icon: Icons.video,
    color: "bg-blue-100/50",
    iconColor: "text-blue-600",
  },
  {
    title: "Chroma Key",
    description:
      "Professional background removal for any video with just one click.",
    icon: Sparkles,
    color: "bg-amber-100/50",
    iconColor: "text-amber-600",
  },
  {
    title: "Pro Effects",
    description:
      "Apply cinematic filters and custom GLSL effects to your creative projects.",
    icon: Wand2,
    color: "bg-rose-100/50",
    iconColor: "text-rose-600",
  },
  {
    title: "Smooth Transitions",
    description:
      "Seamlessly blend clips with a variety of professional-grade transitions.",
    icon: ArrowRightLeft,
    color: "bg-indigo-100/50",
    iconColor: "text-indigo-600",
  },
  {
    title: "Fluid Animations",
    description:
      "Bring elements to life with customizable keyframe-based motion and transforms.",
    icon: Move,
    color: "bg-cyan-100/50",
    iconColor: "text-cyan-600",
  },
  {
    title: "Advanced Timeline",
    description:
      "Multi-track editing with precise timing and intuitive drag & drop controls.",
    icon: Icons.crop,
    color: "bg-emerald-100/50",
    iconColor: "text-emerald-600",
  },
];

const FeatureCard = ({ feature }: { feature: (typeof FEATURES)[0] }) => {
  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-col p-6 rounded-3xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-border transition-colors duration-300 cursor-pointer shadow-sm hover:shadow-md"
    >
      <div
        className={`w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors`}
      >
        <motion.div
          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
          transition={{ duration: 0.4 }}
        >
          <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
        </motion.div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {feature.title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        {feature.description}
      </p>
    </motion.div>
  );
};

const Page = () => {
  return (
    <div className="pt-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4">
          <LogoIcons.scenify width={64} />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            OpenVideo
          </h1>
        </div>
        <div className="mt-4 max-w-4xl">
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl">
            OpenVideo is a playful, zero‑latency video editor with an AI
            copilot. Create, upload and edit at the speed of thought.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button className="px-5 py-2 text-sm font-semibold rounded-md">
              Get Started
              <ArrowRight />
            </Button>
          </div>
        </div>
        <div className="py-10">
          <img
            src="https://cdn.scenify.io/openvideo-editor.png"
            alt="OpenVideo Editor"
          />
        </div>
        <div className="mt-20 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Everything you need to edit at the speed of thought
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Powerful AI-assisted tools, real-time rendering and professional
            video workflows — all running directly in your browser.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
