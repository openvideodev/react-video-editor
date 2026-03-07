"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { UserMenu } from "@/components/user-menu";

// Page name from path segment
const PAGE_NAMES: Record<string, string> = {
  animations: "Animations",
  effects: "Effects",
  transitions: "Transitions",
  captions: "Captions",
};

// ─── Layout ─────────────────────────────────────────────────────────────────

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Derive current page name from last path segment
  const lastSegment = pathname.split("/").filter(Boolean).pop() ?? "";
  const pageName = PAGE_NAMES[lastSegment] ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <header className="border-b border-border/80 shrink-0">
        {/* Primary row: always visible */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-14">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {pageName ? (
                  <BreadcrumbLink asChild>
                    <Link href="/components">Components</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>Components</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {pageName && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{pageName}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <UserMenu />
          </div>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
