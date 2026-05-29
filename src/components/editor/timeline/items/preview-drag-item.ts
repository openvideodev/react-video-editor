import {
  PreviewTrackItem as PreviewTrackItemBase,
  PreviewTrackItemProps,
} from "@openvideo/timeline";

class PreviewTrackItem extends PreviewTrackItemBase {
  static type = "PreviewTrackItem";
  constructor(props: PreviewTrackItemProps) {
    super(props);
  }
}

export default PreviewTrackItem;
