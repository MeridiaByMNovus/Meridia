/* eslint-disable no-empty */
import React, { useEffect, useRef } from "react";
import { MainContext } from "./helpers/functions";
import { get_file_types } from "./helpers/functions";
import { useAppDispatch, useAppSelector } from "./helpers/hooks";
import { TActiveFile, TSelectedFile, TSimpleTab } from "./helpers/types";
import {
  update_active_file,
  update_active_files,
  update_indent,
  update_simple_tab,
  update_simple_tabs,
} from "./helpers/state_manager";
import { store } from "./helpers/store";
import NewUi from "./ui";
import pythonLangData from "../support/languages/python/python.json";
import * as monaco from "monaco-editor";

const MainComponent = React.memo((props: any) => {
  const editor_ref = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(
    null
  );

  const settings = useAppSelector((state) => state.main.editorSettings);

  const dispatch = useAppDispatch();

  const simple_tab = useAppSelector((state) => state.main.simple_tab);
  const simple_tabs = useAppSelector((state) => state.main.simple_tabs);

  useEffect(() => {
    if (!editor_ref.current) return;
    editor_ref.current.updateOptions(settings);
  }, [settings]);

  const normalizePath = (path: string) =>
    path.replace(/\\/g, "/").replace(/^\/?([a-zA-Z]):\//, "$1:/");

  const pythonLangFeature: any = pythonLangData;

  useEffect(() => {
    monaco.languages.registerCompletionItemProvider("python", {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        );

        const suggestions = [
          ...pythonLangFeature.keywords.map((keyword: any) => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            detail: "Python Keyword",
            range: range,
          })),

          ...pythonLangFeature.builtins.map((builtin: any) => ({
            label: builtin,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: builtin,
            detail: "Python Built-in",
            range: range,
          })),

          ...Object.keys(pythonLangData.snippets).map((key) => {
            const snippet = pythonLangFeature.snippets[key];
            return {
              label: snippet.prefix,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: Array.isArray(snippet.body)
                ? snippet.body.join("\n")
                : snippet.body,
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: snippet.description,
              range: range,
            };
          }),
        ];

        return { suggestions };
      },
    });
  }, []);

  const handle_set_editor = React.useCallback(
    async (selected_file: TSelectedFile) => {
      console.log("selected file", selected_file);

      const theme = getComputedStyle(document.documentElement).getPropertyValue(
        "--editor-theme"
      );
      const editorBg = getComputedStyle(
        document.documentElement
      ).getPropertyValue("--terminal-bg");
      const textColor = getComputedStyle(
        document.documentElement
      ).getPropertyValue("--text-color");

      monaco.editor.defineTheme("oneDark", {
        base: theme === "dark" ? "vs-dark" : "vs",
        inherit: true,
        rules: [
          { token: "comment", foreground: "7f848e", fontStyle: "italic" },
          { token: "keyword", foreground: "c678dd" },
          { token: "number", foreground: "d19a66" },
          { token: "string", foreground: "98c379" },
          { token: "type", foreground: "e5c07b" },
          { token: "function", foreground: "61afef" },
          { token: "variable", foreground: "e06c75" },
        ],
        colors: {
          "editor.background": editorBg,
          "editor.foreground": textColor,
          "editorCursor.foreground": textColor,
        },
      });

      if (!editor_ref.current) {
        editor_ref.current = monaco.editor.create(
          document.querySelector(".editor-container"),
          {
            theme: "oneDark",
            language: get_file_types(selected_file.name),
          }
        );
      }
      let targetModel = monaco.editor
        .getModels()
        .find(
          (model) =>
            model.uri.toString() ===
            monaco.Uri.file(selected_file.path).toString()
        );

      if (!targetModel) {
        targetModel = monaco.editor.createModel(
          selected_file.content,
          get_file_types(selected_file.name),
          monaco.Uri.file(selected_file.path)
        );
      } else {
      }

      editor_ref.current.onDidChangeModelContent(() => {
        const model_editing_index = store
          .getState()
          .main.active_files.findIndex(
            (file: TActiveFile) =>
              normalizePath(file.path) ===
              normalizePath(editor_ref.current?.getModel()?.uri.path || "")
          );

        if (model_editing_index > -1) {
          const updated_files = [...store.getState().main.active_files];
          updated_files[model_editing_index] = {
            ...updated_files[model_editing_index],
            is_touched: true,
          };
          dispatch(update_active_files(updated_files));
        }
      });

      editor_ref.current.onDidChangeCursorPosition((e) => {
        dispatch(
          update_indent({
            line: e.position.lineNumber,
            column: e.position.column,
          })
        );
      });

      editor_ref.current.onDidChangeCursorSelection((e) => {
        const { startLineNumber, startColumn, endColumn } = e.selection;

        dispatch(
          update_indent({
            line: startLineNumber,
            column: startColumn,
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

      editor_ref.current.setModel(targetModel);
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
      }}
    >
      <NewUi />
    </MainContext.Provider>
  );
});

export default MainComponent;
