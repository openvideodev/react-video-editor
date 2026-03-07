import type { Metadata } from "next";
import { MailCheckIcon } from "lucide-react";
import BackNav from "@/components/back-nav";

export const metadata: Metadata = {
  title: "Confirm",
  description: "Confirm your email to combo.",
};

export default function AuthenticationPage() {
  //confirm
  return (
    <div className="relative flex h-screen flex-col items-center justify-center  bg-background">
      <BackNav />

      <div className="lg:pb-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-4 text-center">
            <div className="flex items-center justify-center">
              <MailCheckIcon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We emailed a magic link to your email address. Click the link to continue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
