'use client'

import React, { useEffect, useRef, useState } from 'react'
import '@/app/Chat/chat.css'
import NavLayout from '@/app/navLayout'
import ChatPage from '@/comp/Chat/ChatPage'
import { useSidebar } from '../context/sidebarContext';
import ChatTitleFunc from '@/comp/Chat/ChatTitleFunc';
import { ChatMetaData, ChatResponse, IChatEndpoints } from '@/comp/Types';
import axios, { AxiosResponse } from 'axios';
import { usePathname } from 'next/navigation';
import { useDebounce, sendTitleUpdate, adjustInputLength } from '@/comp/Util';
import { constants } from '@/app/constants'

export default function page() {
  //const { DEFAULT_MODEL_OPTIONS, DEFAULT_CHAT_METADATA } = constants();

  const titleContRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [chat, setChat] = useState<ChatResponse[] | any[]>([])
  const [pipeline, setPipeline] = useState<string>()
  const pathname = usePathname()
  const [isOptionPanel, setIsOptionPanel] = useState<boolean>(false)


  
  const { toggleSidebar, 
    currentChat,  
    fetchChatSnippets, 
    isSidebarToggled, 
    setChatMeta, 
    chatMeta,
    handleChatDelete } = useSidebar();

    useEffect(() => {
      if (titleContRef && titleContRef.current) {
        if (isSidebarToggled) {
          titleContRef.current.style.transform='translateX(10%)'
        } else {
          titleContRef.current.style.transform='translateX(0)'
        }
      }
  
    }, [isSidebarToggled]) 

    useEffect(() => {
      adjustInputLength(inputRef)
    }, [chatMeta['title']]) 




    const pfetch = (res:AxiosResponse<any, any>)=>{
      console.log(res.data)
      setChat(res.data.history)

    if (res.data.meta != undefined) {
        console.log(res.data.meta)
        setChatMeta(res.data.meta)
      }
    
    if (res.data.pipeline != undefined) {
      setPipeline("hello")
    }
        
  }


  const debouncedSendTitleUpdate = useDebounce((newMeta) => {
    sendTitleUpdate(pathname, currentChat, newMeta).then((res)=>{
      fetchChatSnippets()
    });
  }, 1000);

  const handleTitleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
    let newMeta = chatMeta
    newMeta["title"] = e.target.value
    setChatMeta((prev)=>({...prev, title: e.target.value}))
    debouncedSendTitleUpdate(newMeta)
    //useDebounce(() => sendTitleUpdate(pathname, currentChat, newMeta), 1000)
  }
  

  const chatOptionPanel = (<div className='pipeline-option-panel chat-option-panel'>
  <div className='chat-delete-btn-cont'>
    <button className='chat-delete-btn pipeline-delete-btn' onClick={()=>handleChatDelete()}> Delete Chat</button>
  </div>

</div>)


  const chatTitle = () => {return (<div className='chat-page-title-cont'>
  <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>

  <div ref={titleContRef} className='chat-title-func-cont'>
    {chatMeta.title !== 'Chat Title'? <input ref={inputRef} className='chat-page-title-t' onChange={(e)=>handleTitleChange(e)} value={chatMeta.title}/> 
    : 
    <h2 className='chat-page-title'> {chatMeta.title} </h2>}
          
  </div>

  <div className='chat-options'>
    <button className='chat-options-btn'> P+ </button>
  </div>

  {currentChat?   
  <div className='chat-options'>
    <button onClick={()=>{setIsOptionPanel(!isOptionPanel)}} className='chat-options-btn'> === </button>
    {isOptionPanel? chatOptionPanel : ''}
  </div> : ""}

</div>)}

// TODO: Update to Agent endpoints
const chatEndpoints:IChatEndpoints = {getCurrentChat:'http://localhost:5000/api/chat/', newChat:'http://localhost:5000/api/newchat', stream:'http://localhost:5000/api/stream', delete:'http://localhost:5000/api/chat/delete/'}

const chatProps = {
  chatEndpoints: chatEndpoints,
  titleComp: chatTitle,
  chat: chat,
  setChat: setChat,
  resProcess: pfetch
}


  return (
    <ChatPage {...chatProps}/>
  )
}
