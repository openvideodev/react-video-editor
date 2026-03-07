import { IClip, VALUES_FILTER_SPECIAL_LIMITS, VALUES_FILTER_SPECIAL } from "openvideo";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ColorPicker,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
} from "@/components/ui/color-picker";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
interface EffectPropertiesProps {
  clip: IClip;
}
interface CoordinatesPropertyProps {
  value: { x: number; y: number };
  min: { x: number; y: number };
  max: { x: number; y: number };
  step: { x: number; y: number };
  onChange: (value: { x: number; y: number }) => void;
}

interface ColorPropertyProps {
  value: string;
  onChange: (value: string) => void;
}

interface StopsPropertyProps {
  value: { color: string; offset: number; alpha: number }[];
  config: {
    offset: { min: number; max: number; step: number };
    alpha: { min: number; max: number; step: number };
  };
  onChange: (stops: { color: string; offset: number; alpha: number }[]) => void;
}

interface MatrixPropertyProps {
  value: number[];
  onChange: (value: number[]) => void;
}
interface ReplacementsPropertyProps {
  value: string[][];
  onChange: (val: string[][]) => void;
}

interface PairPropertyProps {
  value: number[];
  config: { min: number; max: number; step: number }[];
  labels?: [string, string];
  onChange: (value: number[]) => void;
}
const TYPES_COLOR_GRADIENT_FILTER = [
  {
    value: 0,
    label: "Linear",
  },
  {
    value: 1,
    label: "Radial",
  },
  {
    value: 2,
    label: "Conic",
  },
];

const TYPES_GLITCH_FILTER = [
  {
    value: 0,
    label: "TRANSPARENT",
  },
  {
    value: 1,
    label: "ORIGINAL",
  },
  {
    value: 2,
    label: "LOOP",
  },
  {
    value: 3,
    label: "CLAMP",
  },
  {
    value: 4,
    label: "MIRROR",
  },
];
const EXTRA_PROPERTIES = {
  asciiFilter: {
    color: "color",
    replaceColor: "checkbox",
  },
  bevelFilter: {
    lightColor: "color",
    shadowColor: "color",
  },
  colorGradientFilter: {
    type: "select",
  },
  colorMapFilter: {
    nearest: "checkbox",
  },
  colorOverlayFilter: {
    color: "color",
  },
  colorReplaceFilter: {
    originalColor: "color",
    targetColor: "color",
  },
  crtFilter: {
    verticalLine: "checkbox",
  },
  dotFilter: {
    grayscale: "checkbox",
  },
  dropShadowFilter: {
    color: "color",
    shadowOnly: "checkbox",
  },
  glitchFilter: {
    fillMode: "select",
  },
  glowFilter: {
    color: "color",
    knockout: "checkbox",
  },
  godrayFilter: {
    parallel: "checkbox",
  },
  hslAdjustmentFilter: {
    colorize: "checkbox",
  },
  multiColorReplaceFilter: {
    replacements: "replacements",
  },
  outlineFilter: {
    color: "color",
    knockout: "checkbox",
  },
  simpleLightmapFilter: {
    color: "color",
  },
};

const rgbaArrayToHex = (rgba: number[]): string => {
  const [r, g, b] = rgba;

  const toHex = (value: number) => Math.round(value).toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
};

const PairProperty = ({
  value,
  config,
  labels = ["Start", "End"],
  onChange,
}: PairPropertyProps) => {
  return (
    <div className="flex flex-col gap-4">
      {([0, 1] as const).map((i) => (
        <div key={i} className="flex items-center gap-4">
          <span className="w-12 text-xs uppercase">{labels[i]}</span>

          <Slider
            value={[value[i]]}
            min={config[i].min}
            max={config[i].max}
            step={config[i].step}
            onValueChange={(v) => {
              const updated = [...value];
              updated[i] = v[0];
              onChange(updated);
            }}
            className="flex-1"
          />

          <InputGroup className="w-20">
            <InputGroupInput
              type="number"
              value={value[i]}
              min={config[i].min}
              max={config[i].max}
              step={config[i].step}
              onChange={(e) => {
                const updated = [...value];
                updated[i] = parseFloat(e.target.value) || config[i].min;
                onChange(updated);
              }}
              className="text-sm p-0 text-center"
            />
          </InputGroup>
        </div>
      ))}
    </div>
  );
};

const ReplacementsProperty = ({ value, onChange }: ReplacementsPropertyProps) => {
  const handleColorChange = (rowIndex: number, colorIndex: number, val: string) => {
    const updated = [...value];
    updated[rowIndex] = [...updated[rowIndex]];
    updated[rowIndex][colorIndex] = val;
    onChange(updated);
  };

  const addReplacement = () => {
    onChange([...value, ["#000000", "#000000"]]);
  };

  const removeReplacement = (index: number) => {
    if (value.length <= 1) return;
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-4">
      {value.map((colors, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-2 border p-2 rounded relative pt-6">
          {value.length > 1 && (
            <button
              className="absolute top-0 right-2 text-red-400 hover:text-red-500"
              onClick={() => removeReplacement(rowIndex)}
            >
              ×
            </button>
          )}
          {colors.map((color, colorIndex) => (
            <ColorProperty
              key={colorIndex}
              value={color}
              onChange={(val) => handleColorChange(rowIndex, colorIndex, val)}
            />
          ))}
        </div>
      ))}
      <Button onClick={addReplacement} variant="outline" size="sm" className="w-full">
        Add Replacement
      </Button>
    </div>
  );
};

const MatrixProperty = ({ value, onChange }: MatrixPropertyProps) => {
  const handleChange = (index: number, val: number) => {
    const updated = [...value];
    updated[index] = val;
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-4">
      {value.map(
        (v, i) =>
          i < 8 && (
            <div key={i} className="flex items-center gap-4">
              <span className="text-[10px] font-mono">M{i}</span>
              <Slider
                value={[v]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(vals) => handleChange(i, vals[0])}
                className="w-full"
              />
              <InputGroup className="w-20">
                <InputGroupInput
                  type="number"
                  value={v}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(e) => handleChange(i, parseFloat(e.target.value) || 0)}
                  className="text-sm p-0 text-center"
                />
              </InputGroup>
            </div>
          ),
      )}
    </div>
  );
};

const StopsProperty = ({ value, config, onChange }: StopsPropertyProps) => {
  const handleStopChange = (index: number, key: "color" | "offset" | "alpha", val: any) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [key]: val };
    onChange(updated);
  };

  const addStop = () => {
    onChange([...value, { color: "#000000", offset: config.offset.min, alpha: config.alpha.min }]);
  };

  const removeStop = (index: number) => {
    if (value.length <= 2) return;
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-4">
      {value.map((stop, index) => (
        <div key={index} className="flex flex-col gap-2 border p-2 rounded relative pt-6">
          {value.length > 2 && (
            <button
              className="absolute top-0 right-2 text-red-400 hover:text-red-500"
              onClick={() => removeStop(index)}
            >
              ×
            </button>
          )}
          {/* Color */}
          <ColorProperty
            value={stop.color}
            onChange={(val) => handleStopChange(index, "color", val)}
          />

          {/* Offset */}
          <div className="flex items-center gap-2">
            <span className="text-xs w-12">Offset</span>
            <Slider
              value={[stop.offset]}
              min={config.offset.min}
              max={config.offset.max}
              step={config.offset.step}
              onValueChange={(v) => handleStopChange(index, "offset", v[0])}
              className="flex-1"
            />
            <InputGroup className="w-20">
              <InputGroupInput
                type="number"
                value={stop.offset}
                min={config.offset.min}
                max={config.offset.max}
                step={config.offset.step}
                onChange={(e) =>
                  handleStopChange(index, "offset", parseFloat(e.target.value) || config.offset.min)
                }
                className="text-sm p-0 text-center"
              />
            </InputGroup>
          </div>

          {/* Alpha */}
          <div className="flex items-center gap-2">
            <span className="text-xs w-12">Alpha</span>
            <Slider
              value={[stop.alpha]}
              min={config.alpha.min}
              max={config.alpha.max}
              step={config.alpha.step}
              onValueChange={(v) => handleStopChange(index, "alpha", v[0])}
              className="flex-1"
            />
            <InputGroup className="w-20">
              <InputGroupInput
                type="number"
                value={stop.alpha}
                min={config.alpha.min}
                max={config.alpha.max}
                step={config.alpha.step}
                onChange={(e) =>
                  handleStopChange(index, "alpha", parseFloat(e.target.value) || config.alpha.min)
                }
                className="text-sm p-0 text-center"
              />
            </InputGroup>
          </div>
        </div>
      ))}
      <Button onClick={addStop} variant="outline" size="sm" className="w-full">
        Add Stop
      </Button>
    </div>
  );
};
const CoordinatesProperty = ({ value, min, max, step, onChange }: CoordinatesPropertyProps) => {
  return (
    <div className="flex flex-col gap-4">
      {(["x", "y"] as const).map((axis) => (
        <div key={axis} className="flex items-center gap-4">
          <span className="w-4 text-xs uppercase">{axis}</span>

          <Slider
            value={[value[axis]]}
            min={min[axis]}
            max={max[axis]}
            step={step[axis]}
            onValueChange={(v) =>
              onChange({
                ...value,
                [axis]: v[0],
              })
            }
            className="flex-1"
          />

          <InputGroup className="w-20">
            <InputGroupInput
              type="number"
              value={value[axis]}
              min={min[axis]}
              max={max[axis]}
              step={step[axis]}
              onChange={(e) =>
                onChange({
                  ...value,
                  [axis]: parseFloat(e.target.value) || 0,
                })
              }
              className="text-sm p-0 text-center"
            />
          </InputGroup>
        </div>
      ))}
    </div>
  );
};
const ColorProperty = ({ value, onChange }: ColorPropertyProps) => {
  return (
    <InputGroup className="flex-1">
      <InputGroupAddon align="inline-start" className="relative p-0">
        <Popover modal>
          <PopoverTrigger asChild>
            <InputGroupButton variant="ghost" size="icon-xs" className="h-full w-8">
              <div
                className="h-4 ml-2 w-4 border border-white/10 shadow-sm"
                style={{ backgroundColor: value }}
              />
            </InputGroupButton>
          </PopoverTrigger>

          <PopoverContent className="w-64 p-3" align="start">
            <ColorPicker
              onChange={(colorValue: any) => {
                const hex = rgbaArrayToHex(colorValue);
                onChange(hex);
              }}
              className="w-72 h-72 rounded-md border bg-background p-4 shadow-sm"
            >
              <ColorPickerSelection />
              <div className="flex items-center gap-4">
                <ColorPickerEyeDropper />
                <div className="grid w-full gap-1">
                  <ColorPickerHue />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ColorPickerOutput />
                <ColorPickerFormat />
              </div>
            </ColorPicker>
          </PopoverContent>
        </Popover>
      </InputGroupAddon>

      <InputGroupInput
        value={value}
        onChange={(e) => {
          const hex = rgbaArrayToHex(e.target.value.split(",").map(Number));
          onChange(hex);
        }}
        className="text-sm p-0 text-[10px] font-mono"
      />
    </InputGroup>
  );
};

const PropertyRenderer = ({
  property,
  value,
  config,
  onChange,
}: {
  property: string;
  value: any;
  config: any;
  onChange: (val: any) => void;
}) => {
  const isCoordinates = value && typeof value === "object" && "x" in value && "y" in value;

  if (property === "stops") {
    return <StopsProperty value={value || []} config={config[0]} onChange={onChange} />;
  }

  if (property === "matrix") {
    return <MatrixProperty value={value} onChange={onChange} />;
  }

  if (
    ["amplitude", "waveLength", "alpha"].includes(property) &&
    Array.isArray(value) &&
    value.length === 2 &&
    Array.isArray(config) &&
    "min" in config[0] &&
    "max" in config[0] &&
    "step" in config[0]
  ) {
    return <PairProperty value={value} config={config} onChange={onChange} />;
  }
  if (isCoordinates) {
    return (
      <CoordinatesProperty
        value={value || { x: 0, y: 0 }}
        min={{ x: config.x.min, y: config.y.min }}
        max={{ x: config.x.max, y: config.y.max }}
        step={{ x: config.x.step, y: config.y.step }}
        onChange={onChange}
      />
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Slider
        value={[value]}
        min={config.min}
        max={config.max}
        step={config.step}
        onValueChange={(v) => onChange(v[0])}
        className="flex-1"
      />

      <InputGroup className="w-24">
        <InputGroupInput
          type="number"
          value={value}
          min={config.min}
          max={config.max}
          step={config.step}
          onChange={(e) => onChange(parseFloat(e.target.value) || config.min)}
          className="text-sm p-0 text-center"
        />
      </InputGroup>
    </div>
  );
};
export function EffectProperties({ clip }: EffectPropertiesProps) {
  const effectClip = clip as any;
  const filterKey = effectClip.effect.key;

  const limits =
    VALUES_FILTER_SPECIAL_LIMITS[filterKey as keyof typeof VALUES_FILTER_SPECIAL_LIMITS];
  const defaultValues = VALUES_FILTER_SPECIAL[filterKey as keyof typeof VALUES_FILTER_SPECIAL];
  const extraProperties = EXTRA_PROPERTIES[filterKey as keyof typeof EXTRA_PROPERTIES] ?? {};

  const handleUpdate = (property: string, value: any) => {
    effectClip.update({
      effect: {
        ...effectClip.effect,
        values: {
          ...(effectClip.effect.values || {}),
          [property]: value,
        },
      },
    });
  };

  // if (!limits) return null;

  const hasProperties =
    (limits && Object.keys(limits).length > 0) ||
    (extraProperties && Object.keys(extraProperties).length > 0);

  if (!hasProperties) {
    return (
      <div className="text-sm text-muted-foreground italic text-center">
        Properties not available for modification
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-6">
        {Object.entries(limits).map(([property, config]) => {
          const currentValue = effectClip.effect.values?.[property] ?? defaultValues[property];
          return (
            <div key={property} className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {property}
              </label>

              <PropertyRenderer
                property={property}
                value={currentValue}
                config={config}
                onChange={(val) => handleUpdate(property, val)}
              />
            </div>
          );
        })}
        {Object.entries(extraProperties).map(([property, type]) => {
          const currentValue = effectClip.effect.values?.[property] ?? defaultValues?.[property];
          const optionsSelect =
            property === "fillMode" ? TYPES_GLITCH_FILTER : TYPES_COLOR_GRADIENT_FILTER;

          return (
            <div
              key={property}
              className={`flex  ${type === "checkbox" ? "flex-wrap gap-4 items-center" : "flex-col gap-2"}`}
            >
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {property}
              </label>

              {type === "color" && (
                <ColorProperty
                  value={currentValue ?? "#000000"}
                  onChange={(value) => handleUpdate(property, value)}
                />
              )}

              {type === "checkbox" && (
                <Checkbox
                  checked={!!currentValue}
                  onCheckedChange={(checked) => handleUpdate(property, checked)}
                  className="h-4 w-4"
                />
              )}
              {type === "select" && (
                <Select
                  value={currentValue.toString()}
                  onValueChange={(value) => handleUpdate(property, Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {optionsSelect.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
              {type === "replacements" && (
                <ReplacementsProperty
                  value={currentValue || []}
                  onChange={(value) => handleUpdate(property, value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
