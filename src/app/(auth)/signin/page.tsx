import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { UserAuthForm } from "@/components/user-auth-form";
import { ArrowLeftIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Signin to combo.",
};

export default function AuthenticationPage() {
  return (
    <div className="relative flex h-screen flex-col items-center justify-center  bg-background">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "outline" }),

          "absolute left-4 top-4 w-8 md:left-8 md:top-8",
        )}
      >
        <ArrowLeftIcon />
      </Link>

      <Link
        href="/signup"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-4 top-4 md:right-8 md:top-8",
        )}
      >
        Sign up
      </Link>
      <div className="lg:p-8 p-2 sm:p-4">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email to sign in to your account
            </p>
          </div>
          <UserAuthForm kind="signin" />
          <p className="px-8 text-center text-sm text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
