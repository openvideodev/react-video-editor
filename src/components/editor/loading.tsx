import { Loader2 } from "lucide-react";

export const Loading = () => {
  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center flex-col gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <div className="text-muted-foreground text-sm">Initializing Studio...</div>
    </div>
  );
};
