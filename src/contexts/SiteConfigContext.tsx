"use client";

import { createContext, useContext } from "react";
import { SiteConfig, siteConfig as defaultConfig } from "@/lib/siteConfig";

const SiteConfigContext = createContext<SiteConfig>(defaultConfig);

export function SiteConfigProvider({
  config,
  children,
}: {
  config: SiteConfig;
  children: React.ReactNode;
}) {
  return <SiteConfigContext.Provider value={config}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig(): SiteConfig {
  return useContext(SiteConfigContext);
}
