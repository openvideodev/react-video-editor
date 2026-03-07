import * as React from "react";
import { IClip } from "openvideo";
import { IconVolume, IconGauge, IconMusic } from "@tabler/icons-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Slider } from "@/components/ui/slider";

interface AudioPropertiesProps {
  clip: IClip;
}

export function AudioProperties({ clip }: AudioPropertiesProps) {
  const audioClip = clip as any;

  const handleUpdate = (updates: any) => {
    audioClip.update(updates);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Volume Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Volume
        </label>
        <div className="flex items-center gap-4">
          <IconVolume className="size-4 text-muted-foreground" />
          <Slider
            value={[Math.round((audioClip.volume ?? 1) * 100)]}
            onValueChange={(v) => handleUpdate({ volume: v[0] / 100 })}
            max={100}
            step={1}
            className="flex-1"
          />
          <InputGroup className="w-20">
            <InputGroupInput
              type="number"
              value={Math.round((audioClip.volume ?? 1) * 100)}
              onChange={(e) => handleUpdate({ volume: (parseInt(e.target.value) || 0) / 100 })}
              className="text-sm p-0 text-center"
            />
            <InputGroupAddon align="inline-end" className="p-0 pr-2">
              <span className="text-[10px] text-muted-foreground">%</span>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      {/* Pitch Section (UI Only) */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Pitch
        </label>
        <div className="flex items-center gap-4">
          <IconMusic className="size-4 text-muted-foreground" />
          <Slider
            value={[0]}
            onValueChange={() => {}}
            min={-12}
            max={12}
            step={1}
            className="flex-1"
            disabled
          />
          <InputGroup className="w-20">
            <InputGroupInput type="number" value={0} disabled className="text-sm p-0 text-center" />
            <InputGroupAddon align="inline-end" className="p-0 pr-2">
              <span className="text-[10px] text-muted-foreground">st</span>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      {/* Speed Section (UI Only) */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Speed
        </label>
        <div className="flex items-center gap-4">
          <IconGauge className="size-4 text-muted-foreground" />
          <Slider
            value={[100]}
            onValueChange={() => {}}
            min={25}
            max={400}
            step={5}
            className="flex-1"
            disabled
          />
          <InputGroup className="w-20">
            <InputGroupInput
              type="number"
              value={100}
              disabled
              className="text-sm p-0 text-center"
            />
            <InputGroupAddon align="inline-end" className="p-0 pr-2">
              <span className="text-[10px] text-muted-foreground">%</span>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
    </div>
  );
}
