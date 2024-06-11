'use client'

import axios from 'axios';
import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';


interface ChatSnippets {
  _id:string;
  title:string;
}

interface SidebarContextType {
  isSidebarToggled: boolean;
  toggleSidebar: () => void;
  setIsSidebarToggled: Dispatch<SetStateAction<boolean>>;
  currentChat:string;
  setCurrentChat: Dispatch<SetStateAction<string>>;
  chats:ChatSnippets[];
  fetchChatSnippets: () => void;
}

// Create the context with an empty default value
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}




// Create the provider component
export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isSidebarToggled, setIsSidebarToggled] = useState<boolean>(true);
  const [currentChat, setCurrentChat] = useState<string>("")
  const [chats, setChats] = useState<ChatSnippets[]>([])



  const fetchChatSnippets = () => {
    axios.get("http://localhost:5000/api/chats").then((res)=>{
      setChats(res.data)
      console.log(res.data)
    })

  }

  useEffect(() => {
    fetchChatSnippets
  }, [])


  const toggleSidebar = () => {
    console.log(11111)
    setIsSidebarToggled(prevState => !prevState);
  };
  

  return (
    <SidebarContext.Provider value={{ isSidebarToggled, setIsSidebarToggled, toggleSidebar, currentChat, setCurrentChat, chats, fetchChatSnippets }}>
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
