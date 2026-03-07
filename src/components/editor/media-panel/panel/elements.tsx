"use client";

export default function PanelElements() {
  const shapes = [
    { name: "Ellipse", icon: "●" },
    { name: "Square", icon: "■" },
    { name: "Polygon", icon: "⬟" },
  ];

  return (
    <div className="px-4 h-full">
      <div className="text-text-primary flex h-12 flex-none items-center text-sm font-medium">
        Elements
      </div>
      <div className="grid grid-cols-3 gap-4">
        {shapes.map((shape) => (
          <div key={shape.name} className="flex flex-col gap-2">
            <div className="aspect-square bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-center cursor-pointer transition-colors duration-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                {shape.name === "Ellipse" && <div className="w-12 h-12 bg-white rounded-full" />}
                {shape.name === "Square" && <div className="w-10 h-10 bg-white rounded-md" />}
                {shape.name === "Polygon" && (
                  <div
                    className="w-12 h-12 bg-white"
                    style={{
                      clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
                    }}
                  />
                )}
              </div>
            </div>
            <span className="text-xs text-white/50">{shape.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
