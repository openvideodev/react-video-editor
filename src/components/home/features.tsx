import React from "react";
import { Brush, Star, Code, Wand, Rocket, Zap, Layers, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      title: "Zero Infrastructure",
      description: "Shift complex video rendering to the client. Modern WebCodecs remove the need for massive server-side rendering farms.",
      icon: <Zap size={18} />,
    },
    {
      title: "Seamless Cloud Sync",
      description:
        "Serialized JSON project states allow for infinite portability. Sync between local editors and headless cloud workflows instantly.",
      icon: <Code size={18} />,
    },
    {
      title: "Infinite Customization",
      description: "Extensible plugin-based architecture. Build custom effects, transitions, and export handlers to fit your unique needs.",
      icon: <Layers size={18} />,
    },
    {
      title: "Platform Agnostic",
      description: "Built for every stack. Embed OpenVideo into React, Vue, Svelte, or vanilla JS applications with minimal effort.",
      icon: <Sparkles size={18} />,
    },
    {
      title: "Lag-Free Previews",
      description: "Engineered for real-time feedback. Hardware-accelerated previews ensure a smooth editing experience regardless of project complexity.",
      icon: <Rocket size={18} />,
    },
    {
      title: "Open Architecture",
      description:
        "Fully transparent and community-driven. Built by developers, for developers, with a focus on modularity and extensibility.",
      icon: <Star size={18} />,
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
          <h2 className="text-4xl font-medium">Why use OpenVideo?</h2>
          <p className="max-w-2xl mx-auto max-sm:text-sm text-muted-foreground">
            A powerful, flexible, and high-performance video rendering engine for building modern creative tools.
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
