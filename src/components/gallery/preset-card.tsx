"use client";
import { Play } from "lucide-react";

export const PresetCard = ({
  label,
  image,
  video,
  category,
  isActive,
  onClick,
}: {
  label: string;
  image?: string;
  video?: string;
  category: string;
  isActive?: boolean;
  onClick?: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:ring-2 hover:ring-primary/20 hover:shadow-xl cursor-pointer ${
        isActive ? "ring-2 ring-primary border-primary shadow-lg scale-[1.02]" : ""
      }`}
    >
      <div className="aspect-video w-full bg-muted relative overflow-hidden">
        {image && (
          <img
            src={image}
            alt={label}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        {video && (
          <video
            src={video}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        )}
        {!image && !video && (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/10 to-primary/5">
            <Play className="w-8 h-8 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="p-2 rounded-full bg-primary text-primary-foreground shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <Play className="w-5 h-5 fill-current" />
          </div>
        </div>
      </div>
      <div className="p-4 bg-linear-to-b from-transparent to-black/5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm truncate">{label}</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 rounded-full bg-primary/10 whitespace-nowrap">
            {category}
          </span>
        </div>
      </div>
    </div>
  );
};
