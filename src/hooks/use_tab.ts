import { useState } from "react";

export function useTabs(defaultTab: string) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const isActive = (tab: string) => activeTab === tab;
  return { activeTab, setActiveTab, isActive };
}
