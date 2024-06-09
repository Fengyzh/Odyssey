'use client'
import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react'
import './chat.css'
import io from 'socket.io-client';
import axios from 'axios'
import StaggerText from '@/comp/StaggerText'
import { useSidebar } from '../context/sidebarContext';

export default function page() {

  
  const [prompt, setPrompt] = useState("")
  const [chat, setChat] = useState<ChatResponse[] | any[]>([])
  const [wait, setWait] = useState(false)
  const [init, setInit] = useState(true)
  const [title, setTitle] = useState(true)
  const [files, setFiles] = useState<FileList | [] | null>([]);


  const socketRef = useRef<null | any>(null);

  const { isSidebarToggled, toggleSidebar, setIsSidebarToggled } = useSidebar();



  useEffect(() => {

    socketRef.current = io("http://localhost:5000");

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    const handleTextStream = (data:any) => {
      //console.log(data);
      setChat((prevChat) => {      
        if (prevChat.length === 0) {
          return [{ role: 'assistant', msg: data.data }];
        } else {
          const updatedChat = [...prevChat];
          const lastMessage = updatedChat[updatedChat.length - 1];
          updatedChat[updatedChat.length - 1] = { ...lastMessage, msg: lastMessage.msg + data.data };          
          return updatedChat;
        }
      });
    };

    const handleEndResponse = () => {
      console.log("Socket End");
      //socket.disconnect();
      socket.off('text_stream', handleTextStream);


      console.log(chat)
      if (init) {
        axios.post("http://localhost:5000/api/summary", {
          context: chat
        }).then((res)=> {
          setTitle(res.data.title)
        })
      }
      
      setInit(false)
    };

    const handleStartResponse = () => {
      setWait(prev => !prev)
      socket.on('text_stream', handleTextStream);

      setChat((prevChat) => [...prevChat, { role: 'assistant', msg: "" }]);
      console.log("Socket Start");
    };

    const handleResponse = (data:any) => {
      console.log(data.data);
    };

    //socket.on('text_stream', handleTextStream);
    socket.on('end_response', handleEndResponse);
    socket.on('start_response', handleStartResponse);
    socket.on('response', handleResponse);

    return () => {
      socket.disconnect();
      console.log("Disconnected from WebSocket server");
    };
  }, []);




  const sendPrompt = async () => {
    let userMessage = {role:'user', msg:prompt}
    setWait(prev => !prev)
    setChat(prevChat => [...prevChat, userMessage]);

    setChat((prevChat) => [...prevChat, { role: 'assistant', msg: "" }])
    const response = await fetch("http://localhost:5000/api/stream", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({message: prompt})

    })

    const reader = response.body?.getReader();


    for (let i = 0; i<10; i++) {
      if (reader) {
        const {done, value} = await reader.read()
        let a = new TextDecoder().decode(value)
        if (done) {
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

    console.log("client started streaming")
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
    <div className='chat-page'>
      <div className='chat-page-title-cont'>
        <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>
        <h2 className='chat-page-title'> {title} </h2>
      </div>

      <div className='chat-box'> 
        <div className='chat-bubble chat-client'>hi Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui quos blanditiis magnam aspernatur autem amet molestias, accusamus placeat nobis iusto aliquid, ducimus recusandae exercitationem fuga, dicta repellat. Error praesentium nemo enim, voluptas tempora accusantium quo repudiandae fuga? Minus, error illo suscipit ut voluptatem sunt accusamus! Eum quo eaque iure, dolorum natus libero unde commodi! Soluta sapiente quasi ducimus eum! Accusantium!</div>
        <div className='chat-bubble chat-ai'>hi Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui quos blanditiis magnam aspernatur autem amet molestias, accusamus placeat nobis iusto aliquid, ducimus recusandae exercitationem fuga, dicta repellat. Error praesentium nemo enim, voluptas tempora accusantium quo repudiandae fuga? Minus, error illo suscipit ut voluptatem sunt accusamus! Eum quo eaque iure, dolorum natus libero unde commodi! Soluta sapiente quasi ducimus eum! Accusantium!</div>

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
  )
}
