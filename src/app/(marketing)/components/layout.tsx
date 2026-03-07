"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const componentLinks = [
    { name: "Overview", href: "/components" },
    { name: "Animations", href: "/components/animations" },
    { name: "Effects", href: "/components/effects" },
    { name: "Transitions", href: "/components/transitions" },
    { name: "Captions", href: "/components/captions" },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
