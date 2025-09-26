import {
  getStandalone,
  init_workbench_standalone,
  registerStandalone
} from "./chunk-5XOEW5AM.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/event/workbench.event.editor.ts
function mount() {
  const _data = { userId: Date.now() };
  const _event = new CustomEvent("editor.mount", {
    detail: _data
  });
  document.dispatchEvent(_event);
}
function open(tab) {
  const _data = { message: tab, userId: Date.now() };
  const _event = new CustomEvent("editor.open.file", {
    detail: _data
  });
  document.dispatchEvent(_event);
}
var EditorEventListner, _editorEventListner;
var init_workbench_event_editor = __esm({
  "src/code/workbench/event/workbench.event.editor.ts"() {
    init_workbench_standalone();
    EditorEventListner = class {
      constructor() {
        this.startListening();
      }
      startListening() {
        document.addEventListener("editor.open.file", (_event) => {
          const _customEvent = _event;
          const _tab = _customEvent.detail.message;
          const _editor = getStandalone("editor");
          if (!_editor) return;
          _editor._open(_tab);
        });
        document.addEventListener("editor.mount", (_event) => {
          const _editor = getStandalone("editor");
          if (!_editor) return;
          _editor._mount();
        });
      }
    };
    _editorEventListner = new EditorEventListner();
    registerStandalone("editor-event-listner", _editorEventListner);
  }
});

export {
  mount,
  open,
  EditorEventListner,
  _editorEventListner,
  init_workbench_event_editor
};
