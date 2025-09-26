import {
  Emitter2 as Emitter,
  init_editor_api,
  languages
} from "./chunk-ULLJH66C.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// node_modules/monaco-editor/esm/vs/language/typescript/fillers/monaco-editor-core.js
var init_monaco_editor_core = __esm({
  "node_modules/monaco-editor/esm/vs/language/typescript/fillers/monaco-editor-core.js"() {
    init_editor_api();
  }
});

// node_modules/monaco-editor/esm/vs/language/typescript/lib/typescriptServicesMetadata.js
var typescriptVersion;
var init_typescriptServicesMetadata = __esm({
  "node_modules/monaco-editor/esm/vs/language/typescript/lib/typescriptServicesMetadata.js"() {
    typescriptVersion = "4.4.3";
  }
});

// node_modules/monaco-editor/esm/vs/language/typescript/monaco.contribution.js
function getMode() {
  return import("./tsMode-NXIZBRWS.js");
}
var ModuleKind, JsxEmit, NewLineKind, ScriptTarget, ModuleResolutionKind, LanguageServiceDefaultsImpl, typescriptVersion2, typescriptDefaults, javascriptDefaults, getTypeScriptWorker, getJavaScriptWorker;
var init_monaco_contribution = __esm({
  "node_modules/monaco-editor/esm/vs/language/typescript/monaco.contribution.js"() {
    init_editor_api();
    init_typescriptServicesMetadata();
    init_monaco_editor_core();
    (function(ModuleKind2) {
      ModuleKind2[ModuleKind2["None"] = 0] = "None";
      ModuleKind2[ModuleKind2["CommonJS"] = 1] = "CommonJS";
      ModuleKind2[ModuleKind2["AMD"] = 2] = "AMD";
      ModuleKind2[ModuleKind2["UMD"] = 3] = "UMD";
      ModuleKind2[ModuleKind2["System"] = 4] = "System";
      ModuleKind2[ModuleKind2["ES2015"] = 5] = "ES2015";
      ModuleKind2[ModuleKind2["ESNext"] = 99] = "ESNext";
    })(ModuleKind || (ModuleKind = {}));
    (function(JsxEmit2) {
      JsxEmit2[JsxEmit2["None"] = 0] = "None";
      JsxEmit2[JsxEmit2["Preserve"] = 1] = "Preserve";
      JsxEmit2[JsxEmit2["React"] = 2] = "React";
      JsxEmit2[JsxEmit2["ReactNative"] = 3] = "ReactNative";
      JsxEmit2[JsxEmit2["ReactJSX"] = 4] = "ReactJSX";
      JsxEmit2[JsxEmit2["ReactJSXDev"] = 5] = "ReactJSXDev";
    })(JsxEmit || (JsxEmit = {}));
    (function(NewLineKind2) {
      NewLineKind2[NewLineKind2["CarriageReturnLineFeed"] = 0] = "CarriageReturnLineFeed";
      NewLineKind2[NewLineKind2["LineFeed"] = 1] = "LineFeed";
    })(NewLineKind || (NewLineKind = {}));
    (function(ScriptTarget2) {
      ScriptTarget2[ScriptTarget2["ES3"] = 0] = "ES3";
      ScriptTarget2[ScriptTarget2["ES5"] = 1] = "ES5";
      ScriptTarget2[ScriptTarget2["ES2015"] = 2] = "ES2015";
      ScriptTarget2[ScriptTarget2["ES2016"] = 3] = "ES2016";
      ScriptTarget2[ScriptTarget2["ES2017"] = 4] = "ES2017";
      ScriptTarget2[ScriptTarget2["ES2018"] = 5] = "ES2018";
      ScriptTarget2[ScriptTarget2["ES2019"] = 6] = "ES2019";
      ScriptTarget2[ScriptTarget2["ES2020"] = 7] = "ES2020";
      ScriptTarget2[ScriptTarget2["ESNext"] = 99] = "ESNext";
      ScriptTarget2[ScriptTarget2["JSON"] = 100] = "JSON";
      ScriptTarget2[ScriptTarget2["Latest"] = 99] = "Latest";
    })(ScriptTarget || (ScriptTarget = {}));
    (function(ModuleResolutionKind2) {
      ModuleResolutionKind2[ModuleResolutionKind2["Classic"] = 1] = "Classic";
      ModuleResolutionKind2[ModuleResolutionKind2["NodeJs"] = 2] = "NodeJs";
    })(ModuleResolutionKind || (ModuleResolutionKind = {}));
    LanguageServiceDefaultsImpl = /** @class */
    (function() {
      function LanguageServiceDefaultsImpl2(compilerOptions, diagnosticsOptions, workerOptions, inlayHintsOptions) {
        this._onDidChange = new Emitter();
        this._onDidExtraLibsChange = new Emitter();
        this._extraLibs = /* @__PURE__ */ Object.create(null);
        this._removedExtraLibs = /* @__PURE__ */ Object.create(null);
        this._eagerModelSync = false;
        this.setCompilerOptions(compilerOptions);
        this.setDiagnosticsOptions(diagnosticsOptions);
        this.setWorkerOptions(workerOptions);
        this.setInlayHintsOptions(inlayHintsOptions);
        this._onDidExtraLibsChangeTimeout = -1;
      }
      Object.defineProperty(LanguageServiceDefaultsImpl2.prototype, "onDidChange", {
        get: function() {
          return this._onDidChange.event;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(LanguageServiceDefaultsImpl2.prototype, "onDidExtraLibsChange", {
        get: function() {
          return this._onDidExtraLibsChange.event;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(LanguageServiceDefaultsImpl2.prototype, "workerOptions", {
        get: function() {
          return this._workerOptions;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(LanguageServiceDefaultsImpl2.prototype, "inlayHintsOptions", {
        get: function() {
          return this._inlayHintsOptions;
        },
        enumerable: false,
        configurable: true
      });
      LanguageServiceDefaultsImpl2.prototype.getExtraLibs = function() {
        return this._extraLibs;
      };
      LanguageServiceDefaultsImpl2.prototype.addExtraLib = function(content, _filePath) {
        var _this = this;
        var filePath;
        if (typeof _filePath === "undefined") {
          filePath = "ts:extralib-" + Math.random().toString(36).substring(2, 15);
        } else {
          filePath = _filePath;
        }
        if (this._extraLibs[filePath] && this._extraLibs[filePath].content === content) {
          return {
            dispose: function() {
            }
          };
        }
        var myVersion = 1;
        if (this._removedExtraLibs[filePath]) {
          myVersion = this._removedExtraLibs[filePath] + 1;
        }
        if (this._extraLibs[filePath]) {
          myVersion = this._extraLibs[filePath].version + 1;
        }
        this._extraLibs[filePath] = {
          content,
          version: myVersion
        };
        this._fireOnDidExtraLibsChangeSoon();
        return {
          dispose: function() {
            var extraLib = _this._extraLibs[filePath];
            if (!extraLib) {
              return;
            }
            if (extraLib.version !== myVersion) {
              return;
            }
            delete _this._extraLibs[filePath];
            _this._removedExtraLibs[filePath] = myVersion;
            _this._fireOnDidExtraLibsChangeSoon();
          }
        };
      };
      LanguageServiceDefaultsImpl2.prototype.setExtraLibs = function(libs) {
        for (var filePath in this._extraLibs) {
          this._removedExtraLibs[filePath] = this._extraLibs[filePath].version;
        }
        this._extraLibs = /* @__PURE__ */ Object.create(null);
        if (libs && libs.length > 0) {
          for (var _i = 0, libs_1 = libs; _i < libs_1.length; _i++) {
            var lib = libs_1[_i];
            var filePath = lib.filePath || "ts:extralib-" + Math.random().toString(36).substring(2, 15);
            var content = lib.content;
            var myVersion = 1;
            if (this._removedExtraLibs[filePath]) {
              myVersion = this._removedExtraLibs[filePath] + 1;
            }
            this._extraLibs[filePath] = {
              content,
              version: myVersion
            };
          }
        }
        this._fireOnDidExtraLibsChangeSoon();
      };
      LanguageServiceDefaultsImpl2.prototype._fireOnDidExtraLibsChangeSoon = function() {
        var _this = this;
        if (this._onDidExtraLibsChangeTimeout !== -1) {
          return;
        }
        this._onDidExtraLibsChangeTimeout = setTimeout(function() {
          _this._onDidExtraLibsChangeTimeout = -1;
          _this._onDidExtraLibsChange.fire(void 0);
        }, 0);
      };
      LanguageServiceDefaultsImpl2.prototype.getCompilerOptions = function() {
        return this._compilerOptions;
      };
      LanguageServiceDefaultsImpl2.prototype.setCompilerOptions = function(options) {
        this._compilerOptions = options || /* @__PURE__ */ Object.create(null);
        this._onDidChange.fire(void 0);
      };
      LanguageServiceDefaultsImpl2.prototype.getDiagnosticsOptions = function() {
        return this._diagnosticsOptions;
      };
      LanguageServiceDefaultsImpl2.prototype.setDiagnosticsOptions = function(options) {
        this._diagnosticsOptions = options || /* @__PURE__ */ Object.create(null);
        this._onDidChange.fire(void 0);
      };
      LanguageServiceDefaultsImpl2.prototype.setWorkerOptions = function(options) {
        this._workerOptions = options || /* @__PURE__ */ Object.create(null);
        this._onDidChange.fire(void 0);
      };
      LanguageServiceDefaultsImpl2.prototype.setInlayHintsOptions = function(options) {
        this._inlayHintsOptions = options || /* @__PURE__ */ Object.create(null);
        this._onDidChange.fire(void 0);
      };
      LanguageServiceDefaultsImpl2.prototype.setMaximumWorkerIdleTime = function(value) {
      };
      LanguageServiceDefaultsImpl2.prototype.setEagerModelSync = function(value) {
        this._eagerModelSync = value;
      };
      LanguageServiceDefaultsImpl2.prototype.getEagerModelSync = function() {
        return this._eagerModelSync;
      };
      return LanguageServiceDefaultsImpl2;
    })();
    typescriptVersion2 = typescriptVersion;
    typescriptDefaults = new LanguageServiceDefaultsImpl({ allowNonTsExtensions: true, target: ScriptTarget.Latest }, { noSemanticValidation: false, noSyntaxValidation: false, onlyVisible: false }, {}, {});
    javascriptDefaults = new LanguageServiceDefaultsImpl({ allowNonTsExtensions: true, allowJs: true, target: ScriptTarget.Latest }, { noSemanticValidation: true, noSyntaxValidation: false, onlyVisible: false }, {}, {});
    getTypeScriptWorker = function() {
      return getMode().then(function(mode) {
        return mode.getTypeScriptWorker();
      });
    };
    getJavaScriptWorker = function() {
      return getMode().then(function(mode) {
        return mode.getJavaScriptWorker();
      });
    };
    languages.typescript = {
      ModuleKind,
      JsxEmit,
      NewLineKind,
      ScriptTarget,
      ModuleResolutionKind,
      typescriptVersion: typescriptVersion2,
      typescriptDefaults,
      javascriptDefaults,
      getTypeScriptWorker,
      getJavaScriptWorker
    };
    languages.onLanguage("typescript", function() {
      return getMode().then(function(mode) {
        return mode.setupTypeScript(typescriptDefaults);
      });
    });
    languages.onLanguage("javascript", function() {
      return getMode().then(function(mode) {
        return mode.setupJavaScript(javascriptDefaults);
      });
    });
  }
});

export {
  init_monaco_editor_core,
  typescriptDefaults,
  init_monaco_contribution
};
