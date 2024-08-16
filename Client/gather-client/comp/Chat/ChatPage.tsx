'use client'
import React, { useState, useEffect, useRef, ChangeEvent, FormEvent, ReactNode, Dispatch, SetStateAction } from 'react'
import '@/app/Chat/chat.css'
import axios, { AxiosResponse } from 'axios'
import StaggerText from '@/comp/StaggerText'
import { useSidebar } from '../../app/context/sidebarContext';
import NavLayout from '@/app/navLayout'
import { ChatResponse, IOllamaList, IChatEndpoints } from '@/comp/Types';
import { usePathname } from 'next/navigation'
import { constants } from '@/app/constants'

interface IChatPageProps {
    chatEndpoints: IChatEndpoints
    titleComp: () => ReactNode
    chat: ChatResponse[] | any[]
    setChat: Dispatch<SetStateAction<ChatResponse[] | any[]>>;
    resProcess: (res: AxiosResponse<any, any>) => void
    streamBodyExtras: any
} 



const ChatPage: React.FC<IChatPageProps> = ({ chatEndpoints, titleComp, chat, setChat, resProcess, streamBodyExtras }) => {
  const { DEFAULT_MODEL_OPTIONS, DEFAULT_CHAT_METADATA } = constants();


  //const DEFAULT_MODEL_OPTIONS = {top_k:'40', top_p:'0.9', temperature: '0.8'}
  //const DEFAULT_CHAT_METADATA = {title:'Chat Title', dateCreate:'', dataChanged:'', currentModel:'llama3:instruct', modelOptions:DEFAULT_MODEL_OPTIONS}

  /* Chat looks like:
    [{role:xxxx, message:xxxx}, {role:xxxx, message:xxxx}...]
  */
  
  const [prompt, setPrompt] = useState("")
  const [wait, setWait] = useState(false)
  const [showBorder, setShowBorder] = useState(false);

  const pathname = usePathname()


  const titleContRef = useRef<HTMLDivElement>(null);
  const chatPageRef = useRef<HTMLDivElement>(null);
  const chatSpaceRef = useRef<HTMLDivElement>(null);


  const {currentChat, 
        setCurrentChat, 
        fetchChatSnippets, 
        isSidebarToggled, 
        chatMeta, 
        setChatMeta } = useSidebar();


  useEffect(() => {
    if (currentChat) {
      console.log(currentChat)

      axios.get("http://localhost:5000/api/chat/" + currentChat + `?type=${pathname?.replace('/','')}`).then(resProcess).then(()=>{
            requestAnimationFrame(() => {
              if (chatSpaceRef.current && chatPageRef.current) {
                if (chatPageRef.current.scrollHeight > 2000) {
                  chatPageRef.current.scrollTop = chatPageRef.current.scrollHeight;
                } else {
                  chatSpaceRef.current.scrollIntoView({behavior:'smooth'})
                }
              }
            });
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


  useEffect(() => {
    const chatPageElement = chatPageRef.current;
    if (chatPageElement) {
      chatPageElement.scrollTop = chatPageElement.scrollHeight;
      const handleScroll = () => {
        const scrollHeight = chatPageElement.scrollTop;
        const scrollHeight2 = chatPageElement.scrollHeight - chatPageElement.clientHeight;
        setShowBorder(scrollHeight !== scrollHeight2);
      };
  
      // Initialize showBorder state based on current scroll position
      setShowBorder(chatPageElement.scrollTop !== chatPageElement.scrollHeight - chatPageElement.clientHeight);

      chatPageElement.addEventListener('scroll', handleScroll);
  
      return () => {
        chatPageElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);




  const sendPrompt = async () => {

    let userMessage = {role:'user', content:prompt}
    setWait(prev => !prev)
    setChat(prevChat => [...prevChat, userMessage, { role: 'assistant', content: "" }]);
    let createdEntryId;

    if (!currentChat) {
      const createResponse = await axios.get("http://localhost:5000/api/newchat" + `?type=${pathname?.replace('/', '')}`)
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
    const response = await fetch(chatEndpoints.stream + `?type=${pathname?.replace('/', '')}`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: prompt, 
        context:curContext,
        meta:chatMeta,
        id:currentChat? currentChat : createdEntryId,
        streamBodyExtras
      })

    })

    if (createdEntryId) {
      axios.post("http://localhost:5000/api/chat/summary", {
        id:createdEntryId,
        context:curContext
      }).then((res)=>{
        if (res.data){
          setChatMeta((prev)=>({...prev, title: res.data.title}))
        }
      })
    }


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
        if (a.includes('PRUI')) { /* TEST */
          setChat(prevChat => [...prevChat, { role: 'assistant', content: "" }]); /* TEST */
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

      <div ref={chatPageRef} className='chat-box'> 
        <h3> {chat.length === 0 && !wait? "New Chat?" : ""} </h3>
        {chat.map((item, index)=> {
          /* Might remove this staggerText and put the markdown tag in the div at the bottom */
          if (item.role == 'assistant') {
            return <StaggerText className="chat-bubble chat-ai" key={index} text={item.content}></StaggerText>
          }
          return (
          
          <div key={index} className={`chat-bubble ${item.role =='assistant'? "chat-ai" : "chat-client"}`}>{item.content}</div>) 
        })}
        

        {wait? <div className='waiting-res-indicator'>Waiting for Response ...</div> : ""}

        <div ref={chatSpaceRef} className='chat-space'></div>
      </div>


      <div className={`chatbox-cont`}>
        <input className={`chat-input ${showBorder ? 'with-border' : ''}`} type='text' onChange={(e)=>{setPrompt(e.target.value)}}></input>
        <button className='chat-send' onClick={()=>sendPrompt()}> {'>'} </button>
      </div>

    </div>
    </NavLayout>
  )
}

export default ChatPage