"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "./shared/icons";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  kind: "signup" | "signin";
}

export function UserAuthForm({ className, kind, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isLoadingGitHub, setIsLoadingGitHub] = React.useState<boolean>(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>("");
  const router = useRouter();

  const signinGit = async () => {
    try {
      setIsLoadingGitHub(true);
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
      });
    } catch (error) {
      console.error("GitHub sign-in error:", error);
    } finally {
      setIsLoadingGitHub(false);
    }
  };

  const authWithMaginLink = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setIsLoading(true);

    await authClient.signIn.magicLink(
      {
        email: email,
        callbackURL: "/",
      },

      {
        onSuccess: (ctx) => {
          setIsLoading(false);
          if (router) {
            router.push("/confirm"); // Navigate to /confirm
          }
        },
        onError: (ctx) => {
          setIsLoading(false);
        },
      },
    );
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoadingGoogle(true);
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={authWithMaginLink}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button disabled={isLoading}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            {kind === "signin" ? "Sign In" : "Sign Up"} with Email
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="outline" type="button" disabled={isLoadingGitHub} onClick={signinGit}>
          {isLoadingGitHub ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.gitHub className="mr-2 h-4 w-4" />
          )}
          GitHub
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={isLoadingGoogle}
          onClick={signInWithGoogle}
        >
          {isLoadingGoogle ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.google className="mr-2 h-4 w-4" />
          )}
          Google
        </Button>
      </div>
         
    </div>
  );
}
