'use client'
import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react'
import './chat.css'
import io from 'socket.io-client';
import axios from 'axios'
import StaggerText from '@/comp/StaggerText'
import { useSidebar } from '../context/sidebarContext';
import NavLayout from '@/app/navLayout'
import { ChatResponse, ChatMetaData, IOllamaList } from '@/comp/Types';

export default function page() {

  const DEFAULT_CHAT_METADATA = {title:'Chat Title', dateCreate:'', dataChanged:'', currentModel:'llama3:instruct'}
  /* Chat looks like:
    [{role:xxxx, message:xxxx}, {role:xxxx, message:xxxx}...]
  */
  
  const [prompt, setPrompt] = useState("")
  const [chat, setChat] = useState<ChatResponse[] | any[]>([])
  const [chatMeta, setChatMeta] = useState<ChatMetaData>(DEFAULT_CHAT_METADATA)
  const [wait, setWait] = useState(false)
  const [title, setTitle] = useState('Chat Title')
  const [modelList, setModelList] = useState<IOllamaList[] | []>([])
  const [isModelSelect, setIsModelSelect] = useState<boolean>(false)
  const [isOptionPanel, setIsOptionPanel] = useState<boolean>(true)


  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelSelectRef = useRef<HTMLDivElement>(null);
  const titleContRef = useRef<HTMLDivElement>(null);


  const { toggleSidebar, currentChat, setCurrentChat, fetchChatSnippets, fetchCurrentChatFiles, isSidebarToggled } = useSidebar();


  useEffect(() => {
    if (currentChat) {
      axios.get("http://localhost:5000/api/chat/" + currentChat).then((res)=>{
          setChat(res.data.history)

          //TODO: Add set chatMeta when Meta is implemented in backend storage
        if (res.data.meta != undefined) {
            console.log(res.data.meta)
            setChatMeta(res.data.meta)
          }
          //setTitle(res.data.title)
        
      })
    } else {
      console.log("reset")
      setChat([])
      setChatMeta(DEFAULT_CHAT_METADATA)
      //setTitle('Chat Title')
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



const handleExtentModelSelect = () => {
  setIsModelSelect(!isModelSelect)
  axios.get("http://localhost:5000/api/LLM/list").then((res)=> {
    setModelList(res.data?.models.models)
    console.log(res.data.models.models)
  })

}

const handleModelSelect = (modelName:string) => {
  const newMeta = {...chatMeta, currentModel:modelName}
  setChatMeta(newMeta)
}

const handleChatDelete = () => {
  axios.get("http://localhost:5000/api/chat/delete/" + currentChat)
  setCurrentChat('')
  fetchChatSnippets()
}



/* model.name, model.details.parameter_size */


const modelSelectBox = (<div ref={modelSelectRef} className='chat-model-select'>
  {modelList.map((model, index) => {
    return <h3 key={index} onClick={()=>handleModelSelect(model.name)} className='chat-model-select-models'>{model.name}  {model.details.parameter_size}</h3>
  })}

</div>)


const chatOptionPanel = (<div className='chat-option-panel'>
  <div className='chat-options-cont'>
    <p>Top K</p>
    <input className='chat-options-input'/>
  </div>
  <div className='chat-options-cont'>
    <p>Temperature</p>
    <input className='chat-options-input'/>
  </div>

  {currentChat?   
  <div className='chat-delete-btn-cont'>
    <button className='chat-delete-btn' onClick={()=>handleChatDelete()}> Delete Chat</button>
  </div> : ''}

</div>)


  return (
    <NavLayout>
    <div className='chat-page'>
      <div className='chat-page-title-cont'>
        <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>

        <div ref={titleContRef} className='chat-title-func-cont'>
          <h2 className='chat-page-title'> {chatMeta.title} </h2>
          <div className='chat-model-cont'>
            <button onClick={()=>handleExtentModelSelect()} className='chat-model-btn'>{chatMeta.currentModel} {'>'}</button>
            {isModelSelect? modelSelectBox : ""}
            
          </div>
        </div>
        <div className='chat-options'>
          <button onClick={()=>{setIsOptionPanel(!isOptionPanel)}} className='chat-options-btn'> === </button>

          {isOptionPanel? chatOptionPanel : ''}
        </div>

      </div>

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
