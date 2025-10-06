"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// Sidebar Context
interface SidebarContextType {
  isOpen: boolean;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

// Sidebar Provider
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const collapseSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <SidebarContext.Provider
      value={{ isOpen, isCollapsed, toggleSidebar, collapseSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
