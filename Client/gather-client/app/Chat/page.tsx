'use client'
import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react'
import './chat.css'
import io from 'socket.io-client';
import axios from 'axios'
import StaggerText from '@/comp/StaggerText'
import { useSidebar } from '../context/sidebarContext';
import NavLayout from '@/app/navLayout'
import { ChatResponse, ChatMetaData } from '@/comp/Types';

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
  const [files, setFiles] = useState<FileList | [] | File[]>([]);
  const [bufferFiles, setBufferFiles] = useState<FileList | [] | File[]>([]);
  const [isModelSelect, setIsModelSelect] = useState<boolean>(false)


  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelSelectRef = useRef<HTMLDivElement>(null);
  const titleContRef = useRef<HTMLDivElement>(null);


  const { toggleSidebar, currentChat, setCurrentChat, fetchChatSnippets, fetchCurrentChatFiles, isSidebarToggled } = useSidebar();


  useEffect(() => {
    if (currentChat) {
      axios.get("http://localhost:5000/api/chat/" + currentChat).then((res)=>{
          setChat(res.data.history)

          //TODO: Add set chatMeta when Meta is implemented in backend storage
          setTitle(res.data.title)
        
      })
    } else {
      setChat([])
      setChatMeta(DEFAULT_CHAT_METADATA)
      setTitle('Chat Title')
    }

  }, [currentChat])


/*   useEffect(() => {
    axios.get("http://localhost:5000/api/LLM/list").then((res)=> {

    })

  }, []) */


  useEffect(() => {
    if (titleContRef && titleContRef.current) {
      if (isSidebarToggled) {
        titleContRef.current.style.marginLeft='10%'
      } else {
        titleContRef.current.style.marginLeft='0%'

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


 const handleFileChange = (e:ChangeEvent<HTMLInputElement>) => {

    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      console.log(newFiles)
      //setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      setBufferFiles((prevFiles) => [...prevFiles, ...newFiles]);
      //console.log(e.target.files)
    }
 }


 // Tempoary file upload control
 // Can refactor this out as its own comp for other modes too
const sendFiles = async (e: FormEvent) => {
  e.preventDefault()
  let createdEntryId;


  if (!currentChat) {
    const createResponse = await axios.get("http://localhost:5000/api/newchat")
    const entryId = createResponse.data.id
    //console.log(entryId)
    setCurrentChat(entryId)
    createdEntryId = entryId
    fetchChatSnippets()
  }



  if (!bufferFiles) {
    console.log("No files selected")
    return
  }

  const formData = new FormData()
  for (let i = 0; i < bufferFiles.length; i++) {
    console.log(bufferFiles[i])
    formData.append('files', bufferFiles[i])
  }

  formData.append('chatID', currentChat? currentChat : createdEntryId)


  try {
    const response = await axios.post('http://localhost:5000/api/upload', formData, {
      headers: {
          'Content-Type': 'multipart/form-data',
      },
  })
  setBufferFiles([])
  console.log(response.data)
  } catch (err) {
    console.log(err)
  }
  fetchCurrentChatFiles()

}


const handleBufferDelete = (index:number) => {
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }

  let t = Array.from(bufferFiles)
   t.splice(index, 1);
  setBufferFiles([...t])
}


const handleExtentModelSelect = () => {
  setIsModelSelect(!isModelSelect)

  // TODO: Fetch Model list and put it in a useState to store the list
}









  const modelSelectBox = (<div ref={modelSelectRef} className='chat-model-select'>
  <h3 className='chat-model-select-models'>MODEL 1</h3>
  <h3 className='chat-model-select-models'>MODEL 1</h3>
  <h3 className='chat-model-select-models'>MODEL 1</h3>
</div>)



  return (
    <NavLayout>
    <div className='chat-page'>
      <div className='chat-page-title-cont'>
        <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>

        <div ref={titleContRef} className='chat-title-func-cont'>
          <h2 className='chat-page-title'> {title} </h2>
          <div className='chat-model-cont'>
            <button onClick={()=>handleExtentModelSelect()} className='chat-model-btn'>{chatMeta.currentModel} {'>'}</button>
            {isModelSelect? modelSelectBox : ""}
            
          </div>
        </div>
      </div>

      <div className='chat-box'> 
        <h3> {chat.length === 0? "New Chat?" : ""} </h3>
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

        <div className='file-cont'>
          <div className='files-buffer'>
            {Array.from(bufferFiles).map((file, index)=>{
              return (
                <div key={index}>
                  <span>{file.name + "|"}</span>
                  <span onClick={()=>handleBufferDelete(index)}>x</span>
                </div>
              )
            })}
          </div>
          <form className='file-form' onSubmit={(e)=>sendFiles(e)}>
            <input type="file" multiple onChange={handleFileChange} ref={fileInputRef}></input>
            <button className='chat-send' type="submit"> {'F>'} </button>
          </form>
        </div>

        <input className='chat-input' type='text' onChange={(e)=>{setPrompt(e.target.value)}}></input>
        <button className='chat-send' onClick={()=>sendPrompt()}> {'>'} </button>
      </div>

    </div>
    </NavLayout>
  )
}
