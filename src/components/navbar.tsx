import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogoIcons } from "@/components/shared/logos";
import { Menu, X, Sparkles, Wand2, Type, LayoutTemplate } from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const components: { title: string; href: string; description: string; icon: React.ReactNode }[] = [
  {
    title: "Animations",
    href: "/components/animations",
    description: "Dynamic motion effects for your video elements.",
    icon: <Wand2 className="size-4" />,
  },
  {
    title: "Captions",
    href: "/components/captions",
    description: "Smart text overlays and subtitles generator.",
    icon: <Type className="size-4" />,
  },
  {
    title: "Effects",
    href: "/components/effects",
    description: "Visual filters and GLSL shader-based effects.",
    icon: <Sparkles className="size-4" />,
  },
  {
    title: "Transitions",
    href: "/components/transitions",
    description: "Seamless scene transitions and cinematic cuts.",
    icon: <LayoutTemplate className="size-4" />,
  },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Docs", href: "https://docs.openvideo.dev" },
    { name: "Workflows", href: "/workflows" },
    { name: "Discord", href: "https://discord.gg/SCfMrQx8kr" },
    {
      name: "Github",
      href: "https://github.com/openvideodev/openvideo-editor",
    },
  ];

  return (
    <header
      id="nd-nav"
      className="border-b w-full bg-background/80 backdrop-blur-md sticky top-0 z-50 px-4"
      aria-label="Main"
    >
      <div className="max-w-7xl mx-auto h-16 flex items-center px-4">
        {/* Desktop Navigation */}
        <div className="hidden md:grid grid-cols-3 w-full items-center">
          {/* Left: Logo */}
          <div className="flex justify-start">
            <Link
              className="inline-flex items-center gap-2.5 font-bold tracking-tight shrink-0"
              href="/"
            >
              <LogoIcons.scenify className="size-5" />
              <span>OpenVideo</span>
            </Link>
          </div>

          {/* Center: NavigationMenu */}
          <div className="flex justify-center">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Components</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {components.map((component) => (
                        <ListItem
                          key={component.title}
                          title={component.title}
                          href={component.href}
                          icon={component.icon}
                        >
                          {component.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                {navLinks.map((link) => (
                  <NavigationMenuItem key={link.name}>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                      <Link href={link.href}>{link.name}</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right: UserMenu */}
          <div className="flex justify-end">
            <UserMenu />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex w-full items-center justify-between">
          <Link className="inline-flex items-center gap-2.5 font-bold tracking-tight" href="/">
            <LogoIcons.scenify className="text-primary size-5" />
            <span>OpenVideo</span>
          </Link>

          <div className="flex items-center gap-2">
            <UserMenu />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-foreground transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div className="md:hidden border-t py-6 space-y-4 flex flex-col items-center bg-background absolute left-0 right-0 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="w-full px-6 flex flex-col gap-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-4">
              Components
            </div>
            <div className="grid grid-cols-1 gap-2">
              {components.map((c) => (
                <Link
                  key={c.title}
                  href={c.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center">
                    {c.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{c.title}</div>
                    <div className="text-[10px] text-muted-foreground">{c.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="border-t w-full" />
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
        </div>
      )}
    </header>
  );
};

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { title: string; icon?: React.ReactNode }
>(({ className, title, children, href, icon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref as any}
          href={href!}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="flex items-center gap-2">
            {icon}
            <div className="text-sm font-medium leading-none">{title}</div>
          </div>
          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export default Navbar;
