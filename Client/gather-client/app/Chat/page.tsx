'use client'
import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react'
import './chat.css'
import axios, { AxiosResponse } from 'axios'
import { useSidebar } from '@/app/context/sidebarContext';
import { ChatMetaData, ChatResponse, IChatEndpoints } from '@/comp/Types';
import ChatPage from '@/comp/Chat/ChatPage'
import ChatTitleFunc from '@/comp/Chat/ChatTitleFunc';
import { usePathname } from 'next/navigation';
import {adjustInputLength, handleAnimateSideBar, sendTitleUpdate, useDebounce} from '@/comp/Util';
import { chatAPIEndpoints } from '../api';
import Title from '@/comp/Title';


export default function page() {


  const [chat, setChat] = useState<ChatResponse[] | any[]>([])


  const modelSelectRef = useRef<HTMLDivElement>(null);
  const titleContRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null)


  const {
        currentChat, 
        isSidebarToggled, 
        setChatMeta, 
        chatMeta,
        handleChatDelete } = useSidebar();




  useEffect(() => {
    handleAnimateSideBar(titleContRef, isSidebarToggled)
  }, [isSidebarToggled]) 


  useEffect(() => {
    adjustInputLength(inputRef)
  }, [chatMeta['title']]) 

const cfetch = (res:AxiosResponse<any, any>)=>{
  console.log(res.data)
  setChat(res.data.history)

if (res.data.meta != undefined) {
    console.log(res.data.meta)
    setChatMeta(res.data.meta)
  }

}


const handleSysprompt = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
  setChatMeta(prev=>({...prev, modelOptions:{...prev.modelOptions, systemPrompt:e.target.value}}))
}


const chatInputBox = (defaultChatInputBox: React.JSX.Element)=> {
  return defaultChatInputBox
}

const chatOptionPanel = (<div className='chat-option-panel'>
  <div className='chat-options-cont'>
    <p>Top P</p>
    <input onChange={(e)=>{setChatMeta((prev)=>({...prev, modelOptions: {...prev.modelOptions, top_p:e.target.value}}))}} className='chat-options-input' value={chatMeta.modelOptions.top_p}/>
  </div>
  <div className='chat-options-cont'>
    <p>Top K</p>
    <input onChange={(e)=>{setChatMeta((prev)=>({...prev, modelOptions: {...prev.modelOptions, top_k:e.target.value}}))}} className='chat-options-input' value={chatMeta.modelOptions.top_k}/>
  </div>
  <div className='chat-options-cont'>
    <p>Temperature</p>
    <input onChange={(e)=>{setChatMeta((prev)=>({...prev, modelOptions: {...prev.modelOptions, temperature:e.target.value}}))}} className='chat-options-input' value={chatMeta.modelOptions.temperature}/>
  </div>
  <div>
    {/* Update mongo entries to accept sysprompt and then remove the logic here */}
    <label className='chat-option-sysprompt-label'>System Prompt</label>
    <textarea className='chat-option-sysprompt' value={chatMeta.modelOptions.systemPrompt? chatMeta.modelOptions.systemPrompt : "Placeholder sys prompt"} onChange={(e)=>handleSysprompt(e)}/>
  </div>

  {currentChat?   
  <div className='chat-delete-btn-cont'>
    <button className='chat-delete-btn' onClick={()=>handleChatDelete()}> Delete Chat</button>
  </div> : ''}

</div>)

    const titleFunctionalBlock = () => {
      return (<ChatTitleFunc modelSelectRef={modelSelectRef}/>)
    }



  const chatTitle = () => {return (<Title titleContRef={titleContRef} optionPanelComp={chatOptionPanel} inputRef={inputRef} titleFunctionalBlock={titleFunctionalBlock}/>)}

const chatTextStream = (userMessage:ChatResponse, streamText:string) => {
setChat((prevChat) => {
  if (prevChat.length === 0) {
    return [userMessage, { role: 'assistant', content: streamText, name:chatMeta.currentModel }];
  } else {
    const updatedChat = [...prevChat];
    const lastMessage = updatedChat[updatedChat.length - 1];
    updatedChat[updatedChat.length - 1] = { ...lastMessage, content: lastMessage.content + streamText };          
    return updatedChat;
  }
});  

}







const chatProps = {
  chatEndpoints: chatAPIEndpoints,
  titleComp: chatTitle,
  chat: chat,
  setChat: setChat,
  resProcess: cfetch,
  chatInputBox: chatInputBox,
  streamProcessing: chatTextStream

}


  return (
    <ChatPage 
      {...chatProps}
    />
  )
}
