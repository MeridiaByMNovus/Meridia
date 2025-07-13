import React from "react";

interface TabViewProps {
  activeTab: string;
  tab: string;
  children: React.ReactNode;
  fullHeight?: boolean;
}

export function TabView({
  activeTab,
  tab,
  children,
  fullHeight,
}: TabViewProps) {
  return (
    <div
      style={{
        height: fullHeight ? "100%" : undefined,
        display: activeTab === tab ? "block" : "none",
      }}
    >
      {children}
    </div>
  );
}
