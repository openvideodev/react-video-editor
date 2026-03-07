"use client";

import React from "react";
import {
  Sparkles,
  Brain,
  Scissors,
  RefreshCw,
  Video,
  Bot,
  ArrowRight,
  Mail,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const WorkflowCard = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
}) => {
  return (
    <div className="flex items-center justify-center flex-col gap-5 p-10 text-center h-full group hover:bg-primary/5 transition-colors duration-300">
      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-2 shadow-inner group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold tracking-tight text-foreground/90">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">{description}</p>
    </div>
  );
};

const WorkflowsPage = () => {
  const workflows = [
    {
      title: "UGC Video Ads",
      description:
        "Create authentic user-style ads with AI avatars interacting with your product. Perfect for TikTok and Instagram.",
      icon: <Video size={24} />,
    },
    {
      title: "Product Video Ads",
      description:
        "Generate high-converting promo videos from your product assets and descriptions. Tailored for e-commerce growth.",
      icon: <Sparkles size={24} />,
    },
    {
      title: "AI Narrative Video",
      description:
        "Transform scripts into creative storytelling, motivational, or educational videos with dynamic visuals.",
      icon: <Brain size={24} />,
    },
    {
      title: "AI Editor",
      description:
        "Professional video editing app powered by AI tools. Crop, trim, and enhance your footage with just a few clicks.",
      icon: <Scissors size={24} />,
    },
    {
      title: "AI Copilot",
      description:
        "Chat with your footage to generate viral clips, summaries, and social media content automatically.",
      icon: <Bot size={24} />,
    },
    {
      title: "Smart Captions",
      description:
        "Add trendy captions, b-rolls, sound effects, and background music to make your videos stand out.",
      icon: <RefreshCw size={24} />,
    },
    {
      title: "Link to Video",
      description:
        "Turn any URL—product pages, articles, or blog posts—into a polished and professional video presentation.",
      icon: <Zap size={24} />,
    },
  ];

  return (
    <main className="flex h-full flex-col justify-center text-center w-full max-w-5xl mx-auto border-l border-r">
      <section className="flex flex-col items-center justify-center gap-16 py-28 p-8 text-center px-4 w-full border-b max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-6 flex-col">
          <Badge variant="secondary" className="px-4 py-2">
            Workflows
          </Badge>{" "}
          <h2 className="text-5xl font-medium tracking-tight">AI Powered Video Workflows</h2>
          <p className="max-w-2xl mx-auto max-sm:text-sm text-muted-foreground text-lg">
            Professional AI services tailored for scale. Select a workflow to see how we can
            transform your content production.
          </p>
        </div>{" "}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full border border-border/50 rounded-3xl overflow-hidden bg-card/10 backdrop-blur-sm">
          {workflows.map((workflow, index) => (
            <div key={index} className="relative group">
              <WorkflowCard
                title={workflow.title}
                description={workflow.description}
                icon={workflow.icon}
              />

              {/* Faded right border */}
              {(index + 1) % 3 !== 0 && (
                <div className="absolute right-0 top-10 bottom-10 w-[1px] bg-linear-to-b from-transparent via-border to-transparent hidden lg:block" />
              )}
              {(index + 1) % 2 !== 0 && (
                <div className="absolute right-0 top-10 bottom-10 w-[1px] bg-linear-to-b from-transparent via-border to-transparent hidden sm:block lg:hidden" />
              )}

              {/* Faded bottom border */}
              {index < 6 && (
                <div className="absolute bottom-0 left-10 right-10 h-[1px] bg-linear-to-r from-transparent via-border to-transparent hidden lg:block" />
              )}
              {index < workflows.length - 1 && (
                <div className="absolute bottom-0 left-10 right-10 h-[1px] bg-linear-to-r from-transparent via-border to-transparent sm:hidden" />
              )}
              {index < workflows.length - 2 && (
                <div className="absolute bottom-0 left-10 right-10 h-[1px] bg-linear-to-r from-transparent via-border to-transparent hidden sm:block lg:hidden" />
              )}
            </div>
          ))}
        </div>
        {/* CTA Section */}
        <div className="flex flex-col items-center gap-8 mt-12">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button asChild className="shadow-md h-10 rounded-full px-8" size={"lg"}>
              <Link href="https://cal.com/designcombo/30min" className="font-normal">
                Schedule a Demo
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-full px-8" size={"lg"}>
              <a href="mailto:hello@openvideo.dev" className="font-normal">
                <Mail className="mr-2 size-4" />
                Contact Sales
              </a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Trusted by content teams worldwide. Fully extensible and open source.
          </p>
        </div>
      </section>
    </main>
  );
};

export default WorkflowsPage;
