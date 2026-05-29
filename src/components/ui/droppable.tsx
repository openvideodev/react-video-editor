import * as React from "react";
import Dropzone, { type DropzoneProps, type FileRejection } from "react-dropzone";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";

interface DroppableProps extends React.HTMLAttributes<HTMLDivElement> {
  onValueChange?: (files: File[]) => void;
  accept?: DropzoneProps["accept"];
  maxSize?: DropzoneProps["maxSize"];
  maxFileCount?: DropzoneProps["maxFiles"];
  multiple?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function Droppable(props: DroppableProps) {
  const {
    onValueChange,
    accept = {
      "image/*": [],
    },
    maxSize = 1024 * 1024 * 2,
    maxFileCount = 1,
    multiple = false,
    disabled = false,
    className,
    children,
    ...dropzoneProps
  } = props;

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      console.warn(rejectedFiles);
      if (!multiple && maxFileCount === 1 && acceptedFiles.length > 1) {
        // toast.error("Cannot upload more than 1 file at a time");
        return;
      }
      onValueChange?.(acceptedFiles);
    },

    [maxFileCount, multiple],
  );

  return (
    <Dropzone
      onDrop={onDrop}
      accept={accept}
      maxSize={maxSize}
      maxFiles={maxFileCount}
      multiple={maxFileCount > 1 || multiple}
      disabled={disabled}
      noClick
    >
      {({ getRootProps, getInputProps, isDragActive }) => (
        <div
          {...getRootProps()}
          className={cn(
            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            disabled && "pointer-events-none opacity-60",
            className,
          )}
          {...dropzoneProps}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 border-2 border-dashed border-zinc-600 bg-zinc-900">
              <div className="rounded-full border border-dashed p-3">
                <PlusIcon className="size-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="font-medium text-muted-foreground">Drop the files here</p>
            </div>
          ) : (
            <>{children}</>
          )}
        </div>
      )}
    </Dropzone>
  );
}
