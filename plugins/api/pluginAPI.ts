import React from "react";
import { createRoot } from "react-dom/client";

export class PluginAPI {
  private static commands: Record<string, (...args: any[]) => void> = {};
  static sidebarIcons: HTMLElement[] = [];
  static sidebarContent: Record<string, React.ReactNode> = {};

  static log(message: string): void {
    console.log(`[Meridia Plugin] ${message}`);
  }

  static registerCommand(
    commandName: string,
    callback: (...args: any[]) => void
  ): void {
    PluginAPI.commands[commandName] = callback;
    PluginAPI.log(`Registered command: ${commandName}`);
  }

  static executeCommand(commandName: string, ...args: any[]): void {
    if (PluginAPI.commands[commandName]) {
      PluginAPI.commands[commandName](...args);
    } else {
      console.error(`Command not found: ${commandName}`);
    }
  }

  static registerSidebarIcon(
    iconElement: HTMLElement,
    content: React.ReactNode,
    iconId: string
  ): void {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      iconElement.addEventListener("click", () => {
        PluginAPI.showSidebarContent(iconId);
      });

      sidebar.appendChild(iconElement);
      PluginAPI.sidebarIcons.push(iconElement);
      PluginAPI.sidebarContent[iconId] = content;
      PluginAPI.log(`Sidebar icon registered: ${iconId}`);
    } else {
      console.error("Sidebar element not found!");
    }
  }

  static showSidebarContent(iconId: string): void {
    const sidebarContainer = document.getElementById("sidebar-content");
    if (sidebarContainer && PluginAPI.sidebarContent[iconId]) {
      const root = createRoot(sidebarContainer);
      root.render(PluginAPI.sidebarContent[iconId] as React.ReactElement);
    } else {
      console.error(`Sidebar content not found for: ${iconId}`);
    }
  }
}
