/* eslint-disable no-empty */
import React, { useContext, useEffect, useRef } from "react";
import { MainContext } from "../../helpers/functions";
import { get_file_types } from "../../helpers/functions";
import { useAppDispatch, useAppSelector } from "../../helpers/hooks";
import { TActiveFile, TSelectedFile, TSimpleTab } from "../../helpers/types";
import {
  update_active_file,
  update_active_files,
  update_indent,
  update_simple_tab,
  update_simple_tabs,
} from "../../helpers/state_manager";
import { store } from "../../helpers/store";
import NewUi from "..";
import * as monaco from "monaco-editor";
import { MonacoPyrightProvider } from "monaco-pyright-lsp";

const MainComponent = React.memo((props: any) => {
  const editor_ref = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(
    null
  );
  const pyrightProviderRef = React.useRef<MonacoPyrightProvider | null>(null);
  const loadedModels = new Set<string>();
  const pyrightDiagnosticsSetup = new Set<string>();

  const dispatch = useAppDispatch();

  const normalizePath = (path: string) =>
    path.replace(/\\/g, "/").replace(/^\/?([a-zA-Z]):\//, "$1:/");

  const handle_set_editor = React.useCallback(
    async (selected_file: TSelectedFile) => {
      try {
        if (!pyrightProviderRef.current) {
          const provider = new MonacoPyrightProvider("./worker.js", {});
          await provider.init(monaco);
          pyrightProviderRef.current = provider;
        }

        const uri = monaco.Uri.file(selected_file.path);
        let model = monaco.editor.getModel(uri);

        if (!model) {
          model = monaco.editor.createModel(
            selected_file.content,
            get_file_types(selected_file.name),
            uri
          );
          loadedModels.add(uri.path);
        } else if (model.getValue() !== selected_file.content) {
          model.setValue(selected_file.content);
        }

        if (!editor_ref.current) {
          const style = getComputedStyle(document.documentElement);
          const editorBg = style.getPropertyValue("--terminal-bg");
          const textColor = style.getPropertyValue("--text-color");
          const theme = style.getPropertyValue("--editor-theme").trim();

          const rules = [
            { token: "comment", foreground: "7f848e", fontStyle: "italic" },
            { token: "keyword", foreground: "c678dd" },
            { token: "number", foreground: "d19a66" },
            { token: "string", foreground: "98c379" },
            { token: "type", foreground: "e5c07b" },
            { token: "function", foreground: "61afef" },
            { token: "variable", foreground: "e06c75" },
          ];

          monaco.editor.defineTheme("oneDark", {
            base: "vs-dark",
            inherit: true,
            rules,
            colors: {
              "editor.background": editorBg,
              "editor.foreground": textColor,
              "editorCursor.foreground": textColor,
            },
          });

          monaco.editor.defineTheme("oneLight", {
            base: "vs",
            inherit: true,
            rules,
            colors: {
              "editor.background": editorBg,
              "editor.foreground": textColor,
              "editorCursor.foreground": textColor,
            },
          });

          editor_ref.current = monaco.editor.create(
            document.querySelector(".editor-container"),
            {
              theme: theme === "dark" ? "oneDark" : "oneLight",
              automaticLayout: true,
              largeFileOptimizations: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              smoothScrolling: true,
            }
          );

          editor_ref.current.onDidChangeCursorPosition((e) => {
            dispatch(
              update_indent({
                line: e.position.lineNumber,
                column: e.position.column,
              })
            );
          });

          editor_ref.current.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
            () => {
              handle_save_file({
                path: editor_ref.current.getModel().uri.path,
                content: editor_ref.current.getValue(),
              });
            }
          );
        }

        editor_ref.current.setModel(model);

        if (
          pyrightProviderRef.current &&
          !pyrightDiagnosticsSetup.has(uri.path)
        ) {
          await pyrightProviderRef.current.setupDiagnostics(editor_ref.current);
          pyrightDiagnosticsSetup.add(uri.path);
        }

        editor_ref.current.onDidChangeModelContent(() => {
          const path = normalizePath(
            editor_ref.current?.getModel()?.uri.path || ""
          );
          const index = store
            .getState()
            .main.active_files.findIndex(
              (f: TActiveFile) => normalizePath(f.path) === path
            );
          if (index > -1) {
            const updated = [...store.getState().main.active_files];
            updated[index] = {
              ...updated[index],
              is_touched: true,
            };
            dispatch(update_active_files(updated));
          }
        });
      } finally {
      }
    },
    []
  );

  const handle_save_file = React.useCallback(
    (data: { path: string; content: string }) => {
      const newDataPath = normalizePath(data.path);
      window.electron.save_file({ path: newDataPath, content: data.content });

      setTimeout(() => {
        const state = store.getState();
        const model_editing_index = state.main.active_files.findIndex(
          (file: TActiveFile) =>
            normalizePath(file.path) === normalizePath(data.path)
        );

        if (model_editing_index === -1) {
          console.warn(`File not found in active_files: ${data.path}`);
          return;
        }

        const updated_files = [...state.main.active_files];
        updated_files[model_editing_index] = {
          ...updated_files[model_editing_index],
          is_touched: false,
        };

        dispatch(update_active_files(updated_files));
      }, 0);
    },
    []
  );

  const handle_remove_editor = React.useCallback(
    (selected_file: TSelectedFile) => {
      const targetModel = monaco.editor
        .getModels()
        .find(
          (model) =>
            model.uri.toString() ===
            monaco.Uri.file(selected_file.path).toString()
        );

      if (targetModel) {
        targetModel.dispose();
      } else {
        console.warn("Model not found:", selected_file.path);
      }

      const remainingModels = monaco.editor.getModels();

      if (editor_ref.current) {
        if (remainingModels.length > 0) {
          editor_ref.current.setModel(remainingModels[0]);
        } else {
          editor_ref.current.dispose();
          editor_ref.current = undefined;
        }
      }
    },
    []
  );

  const handle_win_blur = React.useCallback(() => {
    const blurred_active_files = store
      .getState()
      .main.active_files.filter(
        (file: TActiveFile) => file.is_touched === true
      );

    blurred_active_files.forEach((file: TActiveFile) => {
      const model = monaco.editor
        .getModels()
        .find(
          (model) => normalizePath(model.uri.path) === normalizePath(file.path)
        );

      if (!model) {
        console.warn(`No model found for path: ${file.path}`);
        return;
      }

      handle_save_file({
        path: file.path,
        content: model.getValue(),
      });
    });
  }, []);

  const handle_set_tab = React.useCallback(async (selected_tab: TSimpleTab) => {
    dispatch(update_active_file(null));

    if (
      store
        .getState()
        .main.simple_tabs.findIndex(
          (tab: TSimpleTab) => tab.name == selected_tab.name
        ) == -1
    ) {
      store.dispatch(
        update_simple_tabs([...store.getState().main.simple_tabs, selected_tab])
      );
    }

    dispatch(update_simple_tab(selected_tab));
  }, []);

  const handle_save_current_file = React.useCallback(() => {
    const activeFile = store.getState().main.active_file;
    if (!activeFile || !editor_ref.current) {
      window.electron.ipcRenderer.send("show-error-message-box", {
        message: "Please open a file before saving.",
        title: "No File Found.",
      });

      return;
    }

    handle_save_file({
      path: activeFile.path,
      content: editor_ref.current.getValue(),
    });
  }, []);

  React.useEffect(() => {
    window.addEventListener("blur", handle_win_blur);
    return () => window.removeEventListener("blur", handle_win_blur);
  }, []);

  return (
    <MainContext.Provider
      value={{
        handle_set_editor,
        handle_remove_editor,
        handle_save_file,
        handle_set_tab,
        handle_save_current_file,
      }}
    >
      <NewUi />
    </MainContext.Provider>
  );
});

export default MainComponent;
