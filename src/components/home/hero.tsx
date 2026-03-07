"use client";

import Link from "next/link";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <>
      <section className="relative flex flex-col items-center justify-center gap-12 px-10 text-center py-16 pt-24">
        <div className="flex items-center justify-center gap-4 flex-col">
          <Badge
            className="rounded-full cursor-pointer py-1 px-4 hover:bg-secondary/80 transition-colors"
            variant={"secondary"}
          >
            <Sparkles size={12} className="mr-2 text-orange-500" />
            New: Chroma Key Support 🎬
          </Badge>
        </div>
        <div className="flex items-center justify-center gap-4 flex-col">
          <h1 className="text-6xl max-sm:text-4xl font-medium tracking-tight">
            The Open Source Video Editor
          </h1>
          <p className="max-sm:text-sm text-lg text-muted-foreground max-w-2xl px-4">
            The simplest way to edit videos in your browser. No installs, no signups—just start
            creating.
          </p>
        </div>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button asChild className="shadow-md h-12 rounded-full px-8" size={"lg"}>
            <Link href="/projects" className="font-normal text-lg">
              Get Started
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
          Open source • Browser-side rendering • Fully extensible
        </div>
      </section>
    </>
  );
};

export default Hero;
