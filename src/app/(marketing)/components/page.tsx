import React from "react";
import { Sparkles, Zap, GitBranch, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const ComponentCard = ({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  href: string;
}) => {
  return (
    <Link
      href={href}
      className="flex items-center justify-center flex-col gap-4 p-4 hover:bg-primary/5 transition-colors duration-200 rounded-xl"
    >
      <div className="icon">{icon}</div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
};

const ComponentsPage = () => {
  const categories = [
    {
      title: "Animations",
      description:
        "Smooth entrance and exit animations for images and clips with customizable easing.",
      icon: <Sparkles size={18} />,
      href: "/components/animations",
    },
    {
      title: "Effects",
      description: "GPU-accelerated visual effects via custom GLSL shaders and cinematic filters.",
      icon: <Zap size={18} />,
      href: "/components/effects",
    },
    {
      title: "Transitions",
      description:
        "Seamlessly blend clips with professional-grade transitions and custom shader support.",
      icon: <GitBranch size={18} />,
      href: "/components/transitions",
    },
    {
      title: "Captions",
      description:
        "Stylized caption presets with word-level animations to make your videos stand out.",
      icon: <Type size={18} />,
      href: "/components/captions",
    },
  ];

  return (
    <section className="flex flex-col items-center justify-center gap-16 py-28 p-8 text-center px-4 w-full">
      <div className="flex items-center justify-center gap-6 flex-col">
        <Badge variant="secondary" className="px-4 py-2">
          Components
        </Badge>{" "}
        <h2 className="text-4xl font-medium tracking-tight">Open-source Video Components</h2>
        <p className="max-w-2xl mx-auto max-sm:text-sm text-muted-foreground text-lg">
          Browse and preview the full library of animations, effects, transitions and caption
          presets available in OpenVideo.
        </p>
      </div>{" "}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat, index) => (
          <div key={index} className="p-8 relative">
            <ComponentCard
              title={cat.title}
              description={cat.description}
              icon={cat.icon}
              href={cat.href}
            />
            {/* Faded bottom border */}
            {index < categories.length - 1 && (
              <div className="absolute bottom-0 left-4 right-4 h-[1.5px] bg-linear-to-r from-transparent via-border to-transparent sm:hidden" />
            )}
            {index < categories.length - 2 && (
              <div className="absolute bottom-0 left-4 right-4 h-[1.5px] bg-linear-to-r from-transparent via-border to-transparent hidden sm:block lg:hidden" />
            )}
            {/* Faded right border */}
            {index % 2 === 0 && index < categories.length - 1 && (
              <div className="absolute right-0 top-4 bottom-4 w-[1.5px] bg-linear-to-b from-transparent via-border to-transparent hidden sm:block lg:hidden" />
            )}
            {index % 4 !== 3 && (
              <div className="absolute right-0 top-4 bottom-4 w-[1.5px] bg-linear-to-b from-transparent via-border to-transparent hidden lg:block" />
            )}{" "}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ComponentsPage;
