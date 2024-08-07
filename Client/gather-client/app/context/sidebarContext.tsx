'use client'

import axios from 'axios';
import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { ChatSnippets, FileSnippets, ChatMetaData } from '@/comp/Types';
import { usePathname } from 'next/navigation';


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
  chatMeta: ChatMetaData;
  setChatMeta: Dispatch<SetStateAction<ChatMetaData>>

}

// Create the context with an empty default value
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}


const DEFAULT_MODEL_OPTIONS = {top_k:'40', top_p:'0.9', temperature: '0.8'}
const DEFAULT_CHAT_METADATA = {title:'Chat Title', dateCreate:'', dataChanged:'', currentModel:'llama3:instruct', modelOptions:DEFAULT_MODEL_OPTIONS}

// Create the provider component
export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isSidebarToggled, setIsSidebarToggled] = useState<boolean>(false);
  const [currentChat, setCurrentChat] = useState<string>("")
  const [chats, setChats] = useState<ChatSnippets[]>([])
  const [tab, setTab] = useState<boolean>(true)
  const [curFiles, setCurFiles] = useState([])
  const [chatMeta, setChatMeta] = useState<ChatMetaData>(DEFAULT_CHAT_METADATA)
  const [chatInfo, setChatInfo] = useState()
  const pathname = usePathname()



  const fetchChatSnippets = () => {
    if (pathname === "/Chat") {    
      axios.get("http://localhost:5000/api/chats").then((res)=>{
      setChats(res.data)
      //console.log(res.data)
    })
  } else if (pathname == "/Pipeline") {
    axios.get("http://localhost:5000/api/pipelines").then((res)=>{
      console.log(res.data)
      setChats(res.data)
    })
  }
  }


  useEffect(() => {

    
}, [pathname])



  const toggleSidebar = () => {
    setIsSidebarToggled(prevState => !prevState);
    console.log(pathname)

  };


  const  fetchCurrentChatFiles = () => {
    if (currentChat) {
        axios.get("http://localhost:5000/api/files/" + currentChat + `?type=${pathname?.replace('/', '')}`).then((res)=>{
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
    <SidebarContext.Provider value={{ isSidebarToggled, 
      setIsSidebarToggled, 
      toggleSidebar, 
      currentChat, 
      setCurrentChat, 
      chats, 
      fetchChatSnippets, 
      tab, 
      setTab, 
      fetchCurrentChatFiles, 
      curFiles,
      chatMeta,
      setChatMeta
      }}>
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
