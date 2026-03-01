"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogoIcons } from "@/components/shared/logos";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Docs", href: "https://docs.openvideo.dev" },
    { name: "Discord", href: "https://discord.gg/SCfMrQx8kr" },
    { name: "Github", href: "https://github.com/openvideodev/openvideo-editor" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header
        id="nd-nav"
        className="border-b w-full bg-background/80 backdrop-blur-md sticky top-0 z-50 px-4"
        aria-label="Main"
      >
        <div className="max-w-7xl mx-auto h-16 flex items-center">
          {/* Desktop Navigation: 3-column Grid for Symmetry */}
          <div className="hidden md:grid grid-cols-3 w-full items-center">
            {/* Left: Logo */}
            <div className="flex justify-start">
              <Link
                className="inline-flex items-center gap-2.5 font-bold tracking-tight"
                href="/"
              >
                <LogoIcons.scenify className="size-5" />
                <span>OpenVideo</span>
              </Link>
            </div>

            {/* Center: Navigation Links */}
            <div className="flex justify-center">
              <nav className="flex items-center gap-10 text-sm font-medium">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right: CTA */}
            <div className="flex justify-end">
              <Button asChild size="sm" className="rounded-full">
                <Link href="https://editor.openvideo.dev/">
                  Try editor
                </Link>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex w-full items-center justify-between">
            <Link
              className="inline-flex items-center gap-2.5 font-bold tracking-tight"
              href="/"
            >
              <LogoIcons.scenify className="text-primary size-5" />
              <span>OpenVideo</span>
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-foreground transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-6 space-y-4 flex flex-col items-center bg-background absolute left-0 right-0 shadow-lg animate-in slide-in-from-top-2 duration-200">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-base font-medium text-muted-foreground hover:text-primary transition-colors px-10 py-2 w-full text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t w-full px-10">
              <Button asChild className="w-full">
                <Link href="https://editor.openvideo.dev/" onClick={() => setIsMenuOpen(false)}>
                  Try editor
                </Link>
              </Button>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
