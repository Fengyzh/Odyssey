'use client'
import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react'
import './chat.css'
import io from 'socket.io-client';
import axios from 'axios'
import StaggerText from '@/comp/StaggerText'
import { useSidebar } from '../context/sidebarContext';
import NavLayout from '@/app/navLayout'

export default function page() {


  /* Chat looks like:
    [{role:xxxx, message:xxxx}, {role:xxxx, message:xxxx}...]
  */
  
  const [prompt, setPrompt] = useState("")
  const [chat, setChat] = useState<ChatResponse[] | any[]>([])
  const [wait, setWait] = useState(false)
  const [init, setInit] = useState(true)
  const [title, setTitle] = useState('Chat Title')
  const [files, setFiles] = useState<FileList | [] | null>([]);




  const { isSidebarToggled, toggleSidebar, currentChat, setCurrentChat, fetchChatSnippets } = useSidebar();


  useEffect(() => {
    if (currentChat) {
      axios.get("http://localhost:5000/api/chat/" + currentChat).then((res)=>{
        if (res.data.history.length != 0) {
          setChat(res.data.history)
          setTitle(res.data.title)
        }
      })
    } else {
      setChat([])
      setTitle('Chat Title')
    }

  }, [currentChat])
  




  const sendPrompt = async () => {

    let userMessage = {role:'user', msg:prompt}
    setWait(prev => !prev)
    setChat(prevChat => [...prevChat, userMessage, { role: 'assistant', msg: "" }]);
    let createdEntryId;

    if (!currentChat) {
      const createResponse = await axios.get("http://localhost:5000/api/newchat")
      const entryId = createResponse.data.id
      //console.log(entryId)
      setCurrentChat(entryId)
      createdEntryId = entryId
      fetchChatSnippets()
    }


    //setChat((prevChat) => [...prevChat, { role: 'assistant', msg: "" }])
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
            return [{ role: 'assistant', msg: a }];
          } else {
            const updatedChat = [...prevChat];
            const lastMessage = updatedChat[updatedChat.length - 1];
            updatedChat[updatedChat.length - 1] = { ...lastMessage, msg: lastMessage.msg + a };          
            return updatedChat;
          }
        });    
      }
}


/*     axios.post("http://localhost:5000/api/stream", {
      message: prompt,
      context: chat
    }).then((res)=>{
      console.log(res.data)
    }) */

    //console.log("client started streaming")
    //console.log(chat)

/*     .then((res) => {
      console.log(res.data);
      let llmMessage = { role: 'assistant', msg: res.data.data };
      

      setChat(prevChat => [...prevChat, llmMessage]);
      setWait(prev => !prev)


    }) */;

  }


 const handleFileChange = (e:ChangeEvent<HTMLInputElement>) => {

  /* TODO: Currently in order for the user to upload multiple files, they have to shift + click on the files
    We want to make it so what we buffer the files whenever the user selects a file and we send all the files at
    once when the user click send (Should wait until we finish the navbar files view) */

  setFiles(e.target.files)
 }


 // Tempoary file upload control
const sendFiles = async (e: FormEvent) => {
  if (!files) {
    console.log("No files selected")
    return
  }

  const formData = new FormData()
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i])
  }

  try {
    const response = await axios.post('http://localhost:5000/api/upload', formData, {
      headers: {
          'Content-Type': 'multipart/form-data',
      },
  })
  console.log(response.data)
  } catch (err) {
    console.log(err)
  }

}


  return (
    <NavLayout>
    <div className='chat-page'>
      <div className='chat-page-title-cont'>
        <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>
        <h2 className='chat-page-title'> {title} </h2>
      </div>

      <div className='chat-box'> 
        <h3> {chat.length === 0? "New Chat?" : ""} </h3>

        {chat.map((item, index)=> {
          //console.log(chat)
          if (item.role == 'assistant') {
            return <StaggerText className="chat-bubble chat-ai" key={index} text={item.msg}></StaggerText>
          }
          return (
          
          <div key={index} className={`chat-bubble ${item.role =='assistant'? "chat-ai" : "chat-client"}`}>{item.msg}</div>) 
        })}
        

        {wait? <div>Waiting for Response</div> : ""}

        <div className='chat-space'></div>
      </div>


      <div className='chatbox-cont'>
        <form onSubmit={(e)=>sendFiles(e)}>
          <input type="file" multiple onChange={handleFileChange}></input>
          <button className='chat-send' type="submit"> {'F>'} </button>
        </form>
        <input className='chat-input' type='text' onChange={(e)=>{setPrompt(e.target.value)}}></input>
        <button className='chat-send' onClick={()=>sendPrompt()}> {'>'} </button>
      </div>

    </div>
    </NavLayout>
  )
}
