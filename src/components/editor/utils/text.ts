type BaseProps = {
  family: string;
  fontSize: string;
  lineHeight: string;
  text: string;
  fontWeight: string;
  letterSpacing: string;
  textShadow: string;
  webkitTextStroke: string;
  id?: string;
  textTransform: string;
};

type TextHeightProps = BaseProps & {
  width: string;
};

export function htmlToPlainText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;

  const lines: string[] = [];

  for (const child of div.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;

      // Explicit handling for <br>
      if (el.tagName === "BR") {
        lines.push("");
      }

      // Each <div> or <p> becomes a new line (even if it's empty)
      else if (el.tagName === "DIV" || el.tagName === "P") {
        // If it contains <br> or is empty, it still counts as a line
        const text = el.textContent?.replace(/\u00A0/g, ""); // Remove non-breaking spaces
        lines.push(text || "");
      }
    } else if (child.nodeType === Node.TEXT_NODE) {
      lines.push(child.textContent || "");
    }
  }

  return lines.join("\n");
}

export const sanitizeHtmlRemoveHeights = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const removeHeights = (element: HTMLElement) => {
    element.style.removeProperty("height");
    for (const child of Array.from(element.children)) {
      removeHeights(child as HTMLElement);
    }
  };

  for (const el of Array.from(doc.body.children)) {
    removeHeights(el as HTMLElement);
  }

  return doc.body.innerHTML;
};

export const calculateTextHeight = (props: TextHeightProps) => {
  const {
    family,
    fontSize,
    width,
    lineHeight,
    letterSpacing,
    textShadow,
    webkitTextStroke,
    fontWeight,
    textTransform,
    text,
  } = props;

  const div = document.createElement("div");

  const cleanText = sanitizeHtmlRemoveHeights(text);

  div.innerHTML = cleanText || "a";

  // div.style.visibility = 'hidden';
  div.style.whiteSpace = "normal";
  div.style.overflowWrap = "break-word";
  div.style.wordSpacing = "normal";
  div.style.wordBreak = "normal";

  div.style.width = width;
  div.style.fontSize = fontSize;
  div.style.fontFamily = family;
  div.style.lineHeight = lineHeight;
  // div.style.height = 'fit-content';
  div.style.fontWeight = fontWeight;
  div.style.letterSpacing = letterSpacing;

  // div.style.position = "absolute";
  div.style.top = "100";
  div.style.left = "100";

  div.style.webkitTextStroke = webkitTextStroke;
  div.style.textShadow = textShadow;
  div.style.textTransform = textTransform;
  div.style.backgroundColor = "red";

  div.style.minWidth = `${1}ch`;

  document.body.appendChild(div);

  const newHeight = div.clientHeight;

  document.body.removeChild(div);

  return newHeight;
};

export const calculateCaptionHeight = (props: TextHeightProps) => {
  const {
    family,
    fontSize,
    width,
    lineHeight,
    letterSpacing,
    textShadow,
    webkitTextStroke,
    fontWeight,
    textTransform,
    text,
  } = props;

  const div = document.createElement("div");
  const cleanText = sanitizeHtmlRemoveHeights(text);
  div.innerHTML = cleanText || "a";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "normal";
  div.style.overflowWrap = "break-word";
  div.style.wordBreak = "normal";

  div.style.width = width;
  div.style.fontSize = fontSize;
  div.style.fontFamily = family;
  div.style.lineHeight = lineHeight;
  div.style.height = "fit-content";
  div.style.fontWeight = fontWeight;
  div.style.letterSpacing = letterSpacing;

  div.style.position = "absolute";
  div.style.top = "100";
  div.style.left = "100";

  div.style.webkitTextStroke = webkitTextStroke;
  div.style.textShadow = textShadow;
  div.style.textTransform = textTransform;

  div.style.minWidth = `${1}ch`;

  document.body.appendChild(div);

  const newHeight = div.clientHeight;

  document.body.removeChild(div);

  return newHeight;
};

export const calculateMinWidth = (props: Omit<TextHeightProps, "width">) => {
  const {
    family,
    fontSize,
    lineHeight,
    letterSpacing,
    textShadow,
    webkitTextStroke,
    fontWeight,
    textTransform,
    text,
  } = props;

  const div = document.createElement("div");
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.overflowWrap = "break-word";

  div.style.fontSize = fontSize;
  div.style.fontFamily = family;
  div.style.lineHeight = lineHeight;
  div.style.height = "fit-content";
  div.style.fontWeight = fontWeight;
  div.style.letterSpacing = letterSpacing;

  div.style.position = "absolute";
  div.style.top = "100";
  div.style.left = "100";

  div.style.webkitTextStroke = webkitTextStroke;
  div.style.textShadow = textShadow;
  div.style.textTransform = textTransform;

  div.style.width = "0px";
  div.style.minWidth = `${1}ch`;

  // const compositionLayer = document.querySelector(`[data-text-id="${id}"]`)
  div.innerText = "aaa";
  div.textContent = "aaa";

  document.body.appendChild(div);

  const minWidth = div.clientWidth;

  document.body.removeChild(div);

  return minWidth;
};
