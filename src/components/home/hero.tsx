"use client";

import Link from "next/link";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";

const Hero = () => {
  const [stars, setStars] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/openvideodev/openvideo")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count.toLocaleString());
        }
      })
      .catch((err) => console.error("Error fetching stars:", err));
  }, []);

  return (
    <>
      <section className="relative flex flex-col items-center justify-center gap-12 px-10 text-center py-16 pt-24">
        <div className="flex items-center justify-center gap-4 flex-col">
          <Link
            href="https://www.producthunt.com/products/openvideo?utm_source=other&utm_medium=social"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Badge
              className="rounded-full cursor-pointer py-1 px-4 hover:bg-secondary/80 transition-colors"
              variant={"secondary"}
            >
              <Sparkles size={12} className="mr-2 text-orange-500" />
              We&apos;re live on Product Hunt! Support us 🚀
            </Badge>
          </Link>
        </div>
        <div className="flex items-center justify-center gap-4 flex-col">
          <h1 className="text-6xl max-sm:text-4xl font-medium tracking-tight">
            The Engine for Your Next Video Editor
          </h1>
          <p className="max-sm:text-sm text-lg text-muted-foreground max-w-2xl px-4">
            High-performance browser-based rendering powered by <strong>WebCodecs</strong> and <strong>WebGL</strong>.
            Build professional video editing platforms with our production-ready SDK.
          </p>
        </div>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button
            asChild
            className="shadow-md h-12 rounded-full px-8"
            size={"lg"}
          >
            <Link href="https://docs.openvideo.dev/" className="font-normal">
              Get Started
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-full px-8"
            size={"lg"}
          >
            <Link
              href="https://github.com/openvideodev/openvideo"
              className="font-normal flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                Github
                {stars && (
                  <span className="flex items-center gap-1 ml-1 text-muted-foreground border-l pl-2">
                    <Star size={14} className="fill-muted-foreground" />
                    {stars}
                  </span>
                )}
              </span>
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
          Open source • Browser-side rendering • Platform agnostic
        </div>
      </section>
    </>
  );
};

export default Hero;
