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

  /* Chat looks like:
    [{role:xxxx, message:xxxx}, {role:xxxx, message:xxxx}...]
  */
  
  //const [prompt, setPrompt] = useState("")
  //const [chat, setChat] = useState<ChatResponse[] | any[]>([])
  //const [chatMeta, setChatMeta] = useState<ChatMetaData>(DEFAULT_CHAT_METADATA)
  //const [wait, setWait] = useState(false)


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


/* const debouncedSendTitleUpdate = useDebounce((newMeta) => {
  sendTitleUpdate(pathname, currentChat, newMeta).then((res)=>{
    fetchChatSnippets()
  });
}, 1000);

const handleTitleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
  let newMeta = chatMeta
  newMeta["title"] = e.target.value
  setChatMeta((prev)=>({...prev, title: e.target.value}))
  debouncedSendTitleUpdate(newMeta)
} */



/* model.name, model.details.parameter_size */

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



  const chatTitle = () => {return (<Title titleContRef={titleContRef} optionPanelComp={chatOptionPanel} inputRef={inputRef} titleFunctionalBlock={titleFunctionalBlock}/>)}

    /* const chatTitle = () => {return (<div className='chat-page-title-cont'>
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
  </div>)} */

const chatTextStream = (userMessage:ChatResponse, streamText:string) => {
setChat((prevChat) => {
  if (prevChat.length === 0) {
    return [userMessage, { role: 'assistant', content: streamText }];
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
