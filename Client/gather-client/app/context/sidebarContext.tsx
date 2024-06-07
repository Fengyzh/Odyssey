'use client'

import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';

interface SidebarContextType {
  isSidebarToggled: boolean;
  toggleSidebar: () => void;
  setIsSidebarToggled: Dispatch<SetStateAction<boolean>>;
}

// Create the context with an empty default value
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}

// Create the provider component
export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isSidebarToggled, setIsSidebarToggled] = useState<boolean>(false);

  const toggleSidebar = () => {
    console.log(11111)
    setIsSidebarToggled(prevState => !prevState);
  };

  return (
    <SidebarContext.Provider value={{ isSidebarToggled, setIsSidebarToggled, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Custom hook for using the sidebar context
export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
