import { useState } from "react";

export function useTabs<T extends string>(defaultTab: T) {
  const [activeTab, setActiveTab] = useState<T>(defaultTab);
  const isActive = (tab: T) => activeTab === tab;
  return { activeTab, setActiveTab, isActive };
}
