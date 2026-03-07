"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface WebCodecsUnsupportedModalProps {
  open: boolean;
}

export function WebCodecsUnsupportedModal({ open }: WebCodecsUnsupportedModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Browser Not Supported</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your browser doesn't support WebCodecs, which is required for this video editor.
          </p>
          <div>
            <p className="font-medium text-sm mb-2">Please use one of the following browsers:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Google Chrome (version 94+)</li>
              <li>Microsoft Edge (version 94+)</li>
              <li>Opera (version 80+)</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            Note: Safari and Firefox do not currently support WebCodecs.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
