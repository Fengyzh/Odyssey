'use client'
import React, { useState, useEffect, useRef, ChangeEvent, FormEvent, ReactNode } from 'react'
import '@/app/Chat/chat.css'
import axios from 'axios'
import StaggerText from '@/comp/StaggerText'
import { useSidebar } from '../../app/context/sidebarContext';
import NavLayout from '@/app/navLayout'
import { ChatResponse, IOllamaList, IChatEndpoints } from '@/comp/Types';

interface IChatPageProps {
    chatEndpoints: IChatEndpoints
    titleComp: () => ReactNode
} 



const ChatPage: React.FC<IChatPageProps> = ({ chatEndpoints, titleComp }) => {

  const DEFAULT_MODEL_OPTIONS = {top_k:'40', top_p:'0.9', temperature: '0.8'}
  const DEFAULT_CHAT_METADATA = {title:'Chat Title', dateCreate:'', dataChanged:'', currentModel:'llama3:instruct', modelOptions:DEFAULT_MODEL_OPTIONS}

  /* Chat looks like:
    [{role:xxxx, message:xxxx}, {role:xxxx, message:xxxx}...]
  */
  
  const [prompt, setPrompt] = useState("")
  const [chat, setChat] = useState<ChatResponse[] | any[]>([])
  const [wait, setWait] = useState(false)


  const titleContRef = useRef<HTMLDivElement>(null);


  const {currentChat, 
        setCurrentChat, 
        fetchChatSnippets, 
        isSidebarToggled, 
        chatMeta, 
        setChatMeta } = useSidebar();


  useEffect(() => {
    if (currentChat) {
      axios.get("http://localhost:5000/api/chat/" + currentChat).then((res)=>{
          setChat(res.data.history)

        if (res.data.meta != undefined) {
            console.log(res.data.meta)
            setChatMeta(res.data.meta)
          }
        
      })
    } else {
      console.log("reset")
      setChat([])
      setChatMeta(DEFAULT_CHAT_METADATA)
    }

  }, [currentChat])



  useEffect(() => {
    if (titleContRef && titleContRef.current) {
      if (isSidebarToggled) {
        titleContRef.current.style.transform='translateX(10%)'
      } else {
        titleContRef.current.style.transform='translateX(0)'
      }
    }

  }, [isSidebarToggled]) 


  const sendPrompt = async () => {

    let userMessage = {role:'user', content:prompt}
    setWait(prev => !prev)
    setChat(prevChat => [...prevChat, userMessage, { role: 'assistant', content: "" }]);
    let createdEntryId;

    if (!currentChat) {
      const createResponse = await axios.get("http://localhost:5000/api/newchat")
      const entryId = createResponse.data.id
      //console.log(entryId)
      setCurrentChat(entryId)
      createdEntryId = entryId
      fetchChatSnippets()
    }


    //setChat((prevChat) => [...prevChat, { role: 'assistant', content: "" }])
    let curContext = [...chat]
    curContext.push(userMessage)
    console.log(createdEntryId)
    const response = await fetch("http://localhost:5000/api/stream", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: prompt, 
        context:curContext,
        meta:chatMeta,
        id:currentChat? currentChat : createdEntryId
      })

    })

    const reader = response.body?.getReader();
    setWait(prev => !prev)


    while(true) {
      if (reader) {
        const {done, value} = await reader.read()
        let a = new TextDecoder().decode(value)
        if (done) {
          console.log("break!")
          break;
        }
        setChat((prevChat) => {      
          if (prevChat.length === 0) {
            return [{ role: 'assistant', content: a }];
          } else {
            const updatedChat = [...prevChat];
            const lastMessage = updatedChat[updatedChat.length - 1];
            updatedChat[updatedChat.length - 1] = { ...lastMessage, content: lastMessage.content + a };          
            return updatedChat;
          }
        });    
      }
}

}



  return (
    <NavLayout>
    <div className='chat-page'>
        {titleComp()}

      <div className='chat-box'> 
        <h3> {chat.length === 0 && !wait? "New Chat?" : ""} </h3>
        {chat.map((item, index)=> {
          //console.log(chat)
          if (item.role == 'assistant') {
            return <StaggerText className="chat-bubble chat-ai" key={index} text={item.content}></StaggerText>
          }
          return (
          
          <div key={index} className={`chat-bubble ${item.role =='assistant'? "chat-ai" : "chat-client"}`}>{item.content}</div>) 
        })}
        

        {wait? <div>Waiting for Response</div> : ""}

        <div className='chat-space'></div>
      </div>


      <div className='chatbox-cont'>
        <input className='chat-input' type='text' onChange={(e)=>{setPrompt(e.target.value)}}></input>
        <button className='chat-send' onClick={()=>sendPrompt()}> {'>'} </button>
      </div>

    </div>
    </NavLayout>
  )
}

export default ChatPage