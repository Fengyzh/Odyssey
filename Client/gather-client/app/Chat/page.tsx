'use client'
import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react'
import './chat.css'
import axios, { AxiosResponse } from 'axios'
import { useSidebar } from '@/app/context/sidebarContext';
import { ChatMetaData, ChatResponse, IChatEndpoints } from '@/comp/Types';
import ChatPage from '@/comp/Chat/ChatPage'
import ChatTitleFunc from '@/comp/Chat/ChatTitleFunc';
import { usePathname } from 'next/navigation';
import {adjustInputLength, sendTitleUpdate, useDebounce} from '@/comp/Util';


export default function page() {

  /* Chat looks like:
    [{role:xxxx, message:xxxx}, {role:xxxx, message:xxxx}...]
  */
  
  //const [prompt, setPrompt] = useState("")
  //const [chat, setChat] = useState<ChatResponse[] | any[]>([])
  //const [chatMeta, setChatMeta] = useState<ChatMetaData>(DEFAULT_CHAT_METADATA)
  //const [wait, setWait] = useState(false)


  const DEFAULT_MODEL_OPTIONS = {top_k:'40', top_p:'0.9', temperature: '0.8'}
  const DEFAULT_CHAT_METADATA = {title:'Chat Title', dateCreate:'', dataChanged:'', currentModel:'llama3:instruct', modelOptions:DEFAULT_MODEL_OPTIONS}

  const [isOptionPanel, setIsOptionPanel] = useState<boolean>(true)
  const [chat, setChat] = useState<ChatResponse[] | any[]>([])


  const modelSelectRef = useRef<HTMLDivElement>(null);
  const titleContRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)


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

const cfetch = (res:AxiosResponse<any, any>)=>{
  console.log(res.data)
  setChat(res.data.history)

if (res.data.meta != undefined) {
    console.log(res.data.meta)
    setChatMeta(res.data.meta)
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
}



/* model.name, model.details.parameter_size */


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
    <textarea className='chat-option-sysprompt' value={chatMeta.modelOptions.systemPrompt? chatMeta.modelOptions.systemPrompt : "Placeholder sys prompt"}/>
  </div>

  <button onClick={()=>{console.log(chatMeta)}}>Test</button>

  {currentChat?   
  <div className='chat-delete-btn-cont'>
    <button className='chat-delete-btn' onClick={()=>handleChatDelete()}> Delete Chat</button>
  </div> : ''}

</div>)

    const titleFunctionalBlock = () => {
      return (<ChatTitleFunc modelSelectRef={modelSelectRef}/>)
    }

  
    const chatEndpoints:IChatEndpoints = {getCurrentChat:'http://localhost:5000/api/chat/', newChat:'http://localhost:5000/api/newchat', stream:'http://localhost:5000/api/stream', delete:'http://localhost:5000/api/chat/delete/'}

//    const chatTitle = () => {return (<Title titleContRef={titleContRef} optionPanelComp={chatOptionPanel}/>)}

    const chatTitle = () => {return (<div className='chat-page-title-cont'>
      <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>

      <div ref={titleContRef} className='chat-title-func-cont'>
      {chatMeta.title !== 'Chat Title1'? <input ref={inputRef} className='chat-page-title-t' onChange={(e)=>handleTitleChange(e)} value={chatMeta.title}/> 
    : 
    <h2 className='chat-page-title'> {chatMeta.title} </h2>}
          {titleFunctionalBlock()}
      </div>
      <div className='chat-options'>
        <button onClick={()=>{setIsOptionPanel(!isOptionPanel)}} className='chat-options-btn'> === </button>

        {isOptionPanel? chatOptionPanel : ''}
    </div>
  </div>)}


const chatProps = {
  chatEndpoints: chatEndpoints,
  titleComp: chatTitle,
  chat: chat,
  setChat: setChat,
  resProcess: cfetch,
  streamBodyExtras:{}
}


  return (
    <ChatPage 
      {...chatProps}
    />
  )
}
