'use client'

import React, { useEffect, useRef } from 'react'
import NavLayout from '@/app/navLayout'
import ChatPage from '@/comp/Chat/ChatPage'
import { useSidebar } from '../context/sidebarContext';
import ChatTitleFunc from '@/comp/Chat/ChatTitleFunc';
import { IChatEndpoints } from '@/comp/Types';

export default function page() {


  const titleContRef = useRef<HTMLDivElement>(null);

  const { toggleSidebar, 
    currentChat, 
    setCurrentChat, 
    fetchChatSnippets, 
    isSidebarToggled, 
    setChatMeta, 
    chatMeta } = useSidebar();

    useEffect(() => {
      if (titleContRef && titleContRef.current) {
        if (isSidebarToggled) {
          titleContRef.current.style.transform='translateX(10%)'
        } else {
          titleContRef.current.style.transform='translateX(0)'
        }
      }
  
    }, [isSidebarToggled]) 




  const chatTitle = () => {return (<div className='chat-page-title-cont'>
  <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>

  <div ref={titleContRef} className='chat-title-func-cont'>
    <h2 className='chat-page-title'> {chatMeta.title} </h2>
      
  </div>
  <div className='chat-options'>
    <h3></h3>
</div>
</div>)}

// TODO: Update to Agent endpoints
const chatEndpoints:IChatEndpoints = {getCurrentChat:'http://localhost:5000/api/chat/', newChat:'http://localhost:5000/api/newchat', stream:'http://localhost:5000/api/stream', delete:'http://localhost:5000/api/chat/delete/'}

  return (
    <ChatPage chatEndpoints={chatEndpoints} titleComp={chatTitle}/>
  )
}
