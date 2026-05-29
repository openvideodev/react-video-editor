import { generateId } from "@openvideo/timeline";
import { DEFAULT_FONT } from "./font";

export const TEXT_ADD_PAYLOAD = {
  type: "Text",
  text: "Heading and some body",
  width: 600,
  fontUrl: DEFAULT_FONT.url,
  style: {
    fontSize: 120,
    fontFamily: DEFAULT_FONT.postScriptName,
    color: "#ffffff",
    wordWrap: true,
    wordWrapWidth: 600,
    textAlign: "center",
  },
};
