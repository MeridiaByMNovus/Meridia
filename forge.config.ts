/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/no-var-requires */
import { resolve, join, dirname } from "path";
import { copy, mkdirs } from "fs-extra";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerDeb } from "@electron-forge/maker-deb";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: "Meridia",
    executableName: "Meridia",
    icon: "./src/assets/icon.ico",
    appVersion: "1.0.0",
  },
  makers: [
    new MakerSquirrel({
      name: "Meridia",
      setupExe: "MeridiaSetup.exe",
      setupMsi: "MeridiaMsiSetup.msi",
      noMsi: false,
      setupIcon: "./src/assets/icon.ico",
      exe: "Meridia.exe",
      title: "Meridia",
      iconUrl:
        "https://raw.githubusercontent.com/MeridiaByMNovus/Meridia/refs/heads/main/src/assets/icon.ico",
      owners: "MNovus",
      authors: "MNovus",
      description: "The new world of Python Development",
      version: "1.0.0",
    }),
    new MakerDeb({
      options: {
        name: "Meridia",
        icon: "./src/assets/icon.ico",
        productName: "Meridia",
        description: "The new world of Python Development",
        version: "1.0.0",
        categories: ["Development"],
      },
    }),
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig,
      devContentSecurityPolicy:
        "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;",
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: "./main/static-html/index.html",
            js: "./main/renderer-workers/main_worker.ts",
            name: "main_window",
            preload: {
              js: "./main/preload.ts",
            },
          },
          {
            html: "./main/static-html/welcome_wizard.html",
            js: "./main/renderer-workers/welcome_wizard_worker.ts",
            name: "welcome_wizard",
            preload: {
              js: "./main/preload.ts",
            },
          },
        ],
      },
    }),

    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  rebuildConfig: {},
  hooks: {
    async packageAfterCopy(_forgeConfig, buildPath) {
      const requiredNativePackages = ["node-pty"];

      const dirnamePath: string = ".";
      const sourceNodeModulesPath = resolve(dirnamePath, "node_modules");
      const destNodeModulesPath = resolve(buildPath, "node_modules");

      await Promise.all(
        requiredNativePackages.map(async (packageName) => {
          const sourcePath = join(sourceNodeModulesPath, packageName);
          const destPath = join(destNodeModulesPath, packageName);

          await mkdirs(dirname(destPath));
          await copy(sourcePath, destPath, {
            recursive: true,
            preserveTimestamps: true,
          });
        })
      );
    },
  },
};

export default config;
