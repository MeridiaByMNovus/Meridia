import { ERenderer } from "../code/base/window/preload/preload.js";

declare global {
  interface Window {
    electron: typeof ERenderer;
    set_folder_data: Function;
    target_window: string;
    __gutter_cleanup_bound__?: boolean;
  }
}
