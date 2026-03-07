"use client";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackNav() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.back()}
      variant={"outline"}
      className="absolute left-4 top-4 w-8 md:left-8 md:top-8"
    >
      <ArrowLeftIcon />
    </Button>
  );
}
