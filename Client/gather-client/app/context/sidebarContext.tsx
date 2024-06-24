'use client'

import axios from 'axios';
import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { ChatSnippets, FileSnippets } from '@/comp/Types';


interface SidebarContextType {
  isSidebarToggled: boolean;
  toggleSidebar: () => void;
  setIsSidebarToggled: Dispatch<SetStateAction<boolean>>;
  currentChat:string;
  setCurrentChat: Dispatch<SetStateAction<string>>;
  chats:ChatSnippets[];
  fetchChatSnippets: () => void;
  tab: boolean;
  setTab:Dispatch<SetStateAction<boolean>>;
  curFiles: FileSnippets[]
  fetchCurrentChatFiles: () => void;

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
  const [tab, setTab] = useState<boolean>(true)
  const [curFiles, setCurFiles] = useState([])



  const fetchChatSnippets = () => {
    axios.get("http://localhost:5000/api/chats").then((res)=>{
      setChats(res.data)
      //console.log(res.data)
    })

  }




  useEffect(() => {
    fetchChatSnippets()
  }, [])


  const toggleSidebar = () => {
    setIsSidebarToggled(prevState => !prevState);
  };


  const  fetchCurrentChatFiles = () => {
    if (currentChat) {
        axios.get("http://localhost:5000/api/files/" + currentChat).then((res)=>{
            if (res.data) {                
                setCurFiles(res.data)
                console.log(res.data)
              }
        })
    } else {
      setCurFiles([])
    }
  }

  

  return (
    <SidebarContext.Provider value={{ isSidebarToggled, setIsSidebarToggled, toggleSidebar, currentChat, setCurrentChat, chats, fetchChatSnippets, tab, setTab, fetchCurrentChatFiles, curFiles}}>
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
