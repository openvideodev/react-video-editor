"use client";
import React from "react";
import { LogoIcons } from "./shared/logos";
import { Icons } from "./shared/icons";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const router = useRouter();

  const handleGetStarted = (route: string) => {
    router.push(route);
  };

  return (
    <nav className="fixed top-2 inset-x-0 z-50 flex justify-center px-4">
      <div
        className="flex items-center justify-between w-full max-w-7xl h-16 px-6 
                     backdrop-blur-md 
                     border border-border shadow-lg rounded-2xl"
      >
        <div
          className="pointer-events-auto flex h-9 w-9 bg-primary/20 items-center justify-center rounded-md "
          onClick={() => handleGetStarted("/")}
        >
          <LogoIcons.scenify width={24} />
        </div>

        {/* Links Centrales */}
        <div className="hidden md:flex items-center gap-8">
          <a
            onClick={() => handleGetStarted("/")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Home
          </a>
          <a
            onClick={() => handleGetStarted("/marketplace")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Marketplace
          </a>
        </div>

        {/* Botones Derecha */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 border-r pr-4 border-border">
            <a
              href="https://github.com/openvideodev/openvideo-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icons.github className="size-4" />
            </a>
            <a
              href="https://discord.gg/SCfMrQx8kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Join our Discord"
            >
              <Icons.discord className="size-4" />
            </a>
          </div>
          <Button className="px-5 py-2 text-sm font-semibold rounded-md">
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
