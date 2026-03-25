import React, { useEffect, useRef, useState } from "react";

const sizerStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  visibility: "hidden",
  height: 0,
  overflow: "scroll",
  whiteSpace: "pre",
};

const INPUT_PROPS_BLACKLIST: Array<keyof AutosizeInputProps> = [
  "extraWidth",
  "injectStyles",
  "inputClassName",
  "inputRef",
  "inputStyle",
  "minWidth",
  "onAutosize",
  "placeholderIsMinWidth",
];

interface AutosizeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  extraWidth?: number | string;
  injectStyles?: boolean;
  inputClassName?: string;
  inputRef?: React.RefCallback<HTMLInputElement | null>;
  inputStyle?: React.CSSProperties;
  minWidth?: number | string;
  onAutosize?: (newWidth: number) => void;
  placeholderIsMinWidth?: boolean;
}

const cleanInputProps = (inputProps: AutosizeInputProps): AutosizeInputProps => {
  const cleanedProps = { ...inputProps };
  for (const field of INPUT_PROPS_BLACKLIST) {
    delete cleanedProps[field];
  }
  return cleanedProps;
};

const copyStyles = (styles: CSSStyleDeclaration, node: HTMLElement) => {
  node.style.fontSize = styles.fontSize;
  node.style.fontFamily = styles.fontFamily;
  node.style.fontWeight = styles.fontWeight;
  node.style.fontStyle = styles.fontStyle;
  node.style.letterSpacing = styles.letterSpacing;
  node.style.textTransform = styles.textTransform;
};

const AutosizeInput: React.FC<AutosizeInputProps> = (props) => {
  const {
    className,
    style,
    inputStyle,
    inputClassName,
    id,
    minWidth = 1,
    injectStyles = true,
    onAutosize,
    extraWidth,
    inputRef,
    placeholder,
    value,
    defaultValue,
    placeholderIsMinWidth,
    ...rest
  } = props;

  const [inputWidth, setInputWidth] = useState<number>(
    typeof minWidth === "number" ? minWidth : Number.parseInt(minWidth),
  );
  const [inputId] = useState<string>(id || "uniqueid");
  const inputEl = useRef<HTMLInputElement | null>(null);
  const sizerEl = useRef<HTMLDivElement | null>(null);
  const placeHolderSizerEl = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateInputWidth = () => {
      if (!sizerEl.current || typeof sizerEl.current.scrollWidth === "undefined") return;
      let newInputWidth: number;
      if (placeholder && (!value || (value && placeholderIsMinWidth))) {
        newInputWidth =
          Math.max(sizerEl.current.scrollWidth, placeHolderSizerEl.current?.scrollWidth || 0) + 2;
      } else {
        newInputWidth = sizerEl.current.scrollWidth + 2;
      }

      const calculatedExtraWidth =
        props.type === "number" && extraWidth === undefined
          ? 16
          : Number.parseInt(extraWidth as string) || 0;
      newInputWidth += calculatedExtraWidth;

      if (newInputWidth < (typeof minWidth === "number" ? minWidth : Number.parseInt(minWidth))) {
        newInputWidth = typeof minWidth === "number" ? minWidth : Number.parseInt(minWidth);
      }

      if (newInputWidth !== inputWidth) {
        setInputWidth(newInputWidth);
        if (onAutosize) {
          onAutosize(newInputWidth);
        }
      }
    };

    const handleCopyInputStyles = () => {
      if (!window.getComputedStyle) return;
      const inputStyles = inputEl.current && window.getComputedStyle(inputEl.current);
      if (!inputStyles) return;
      if (sizerEl.current) {
        copyStyles(inputStyles, sizerEl.current);
      }
      if (placeHolderSizerEl.current) {
        copyStyles(inputStyles, placeHolderSizerEl.current);
      }
    };

    handleCopyInputStyles();
    updateInputWidth();
  }, [value, placeholder, placeholderIsMinWidth, extraWidth, minWidth, inputWidth, onAutosize]);

  const sizerValue = [defaultValue, value, ""].reduce<any>(
    (previousValue, currentValue) => {
      if (previousValue !== null && previousValue !== undefined) {
        return previousValue;
      }
      return currentValue;
    },
    undefined, // Initial value for reduce
  );

  return (
    <div className={className} style={{ display: "inline-block", ...style }}>
      <input
        {...cleanInputProps(rest)}
        className={inputClassName}
        id={inputId}
        value={value}
        style={{
          boxSizing: "content-box",
          width: `${inputWidth}px`,
          ...inputStyle,
        }}
        ref={(el) => {
          inputEl.current = el;
          if (inputRef) inputRef(el);
        }}
      />
      <div ref={sizerEl} style={sizerStyle}>
        {sizerValue}
      </div>
      {placeholder && (
        <div ref={placeHolderSizerEl} style={sizerStyle}>
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default AutosizeInput;
