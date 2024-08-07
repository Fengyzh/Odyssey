'use client'
import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react'
import './chat.css'
import axios, { AxiosResponse } from 'axios'
import { useSidebar } from '@/app/context/sidebarContext';
import { ChatResponse, IChatEndpoints } from '@/comp/Types';
import ChatPage from '@/comp/Chat/ChatPage'
import ChatTitleFunc from '@/comp/Chat/ChatTitleFunc';
import { usePathname } from 'next/navigation';


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



const handleChatDelete = () => {
  axios.get("http://localhost:5000/api/chat/delete/" + currentChat)
  setCurrentChat('')
  fetchChatSnippets()
}


const cfetch = (res:AxiosResponse<any, any>)=>{
  console.log(res.data)
  setChat(res.data.history)

if (res.data.meta != undefined) {
    console.log(res.data.meta)
    setChatMeta(res.data.meta)
  }

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
        <h2 className='chat-page-title'> {chatMeta.title} </h2>
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
  resProcess: cfetch
}


  return (
    <ChatPage 
      {...chatProps}
    />
  )
}
