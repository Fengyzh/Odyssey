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
import { createNewChat } from '../Util'
import { getChatTitleSummary, getCurrentChat } from '@/app/api'
import Markdown from 'react-markdown'
import '@/app/Chat/chat.css'

interface IChatPageProps {
    chatEndpoints: IChatEndpoints
    titleComp: () => ReactNode
    chat: ChatResponse[] | any[]
    setChat: Dispatch<SetStateAction<ChatResponse[] | any[]>>;
    resProcess: (res: AxiosResponse<any, any>) => void
    streamBodyExtras?: any
    resCleanUp?: () => void
    chatInputBox: (defaultChatInputBox:React.JSX.Element) => React.JSX.Element
    streamProcessing: (userMessage:ChatResponse, streamText:string) => void;
} 



const ChatPage: React.FC<IChatPageProps> = ({ chatEndpoints, titleComp, chat, setChat, resProcess, streamBodyExtras, resCleanUp, chatInputBox, streamProcessing }) => {
  const { DEFAULT_CHAT_METADATA } = constants();


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

      getCurrentChat(currentChat, pathname).then(resProcess).then(()=>{
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
      if (resCleanUp != undefined) {
        resCleanUp()
      }
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



  const handleKeyPress = (e:React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key == 'Enter') {
      sendPrompt()
    }
  }


  const sendPrompt = async () => {
    
    let userMessage = {role:'user', content:prompt, name:'User'}
    setWait(prev => !prev)
    setChat(prevChat => [...prevChat, userMessage, { role: 'assistant', content: "", name:chatMeta.currentModel}]);
    let createdEntryId;

    if (!currentChat) {
      const createResponse = await createNewChat(pathname)
      if (createResponse) {
        const entryId = createResponse.data.id
        setCurrentChat(entryId)
        createdEntryId = entryId
        fetchChatSnippets()
      }
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
        streamBodyExtras:streamBodyExtras? streamBodyExtras : {}
      })

    })

    if (createdEntryId || curContext.length <= 2) {
      let working_id = currentChat? currentChat : createdEntryId
      getChatTitleSummary(working_id, curContext, pathname, chatMeta).then((res)=>{
        if (res.data){
          setChatMeta((prev)=>({...prev, title: res.data.title}))
          fetchChatSnippets()
        }
      })
    }


    const reader = response.body?.getReader();
    setWait(prev => !prev)
    setPrompt("")

    while(true) {
      if (reader) {
        const {done, value} = await reader.read()
        let streamText = new TextDecoder().decode(value)
        if (done) {
          console.log("break!")
          break;
        }


        streamProcessing(userMessage, streamText)
  
      }
}

}


const handleRAGOptions = (isWeb:boolean) => {
  let tempMeta = {...chatMeta}
  
  if (isWeb) {
    tempMeta.isWeb = !tempMeta.isWeb
  } else {
    tempMeta.isDoc = !tempMeta.isDoc 
  }

  console.log(tempMeta)
  setChatMeta(tempMeta)
}





const ChatInputBoxComp = (el=<div></div>) => {
    return (      
    <div className={`chatbox-cont`}>
    {pathname==='/Chat'? 
      <div className='chat-option-cont'>
        <button onClick={()=>handleRAGOptions(true)} className={`chat-option-btn ${chatMeta.isWeb? `chat-option-on` : ``}`}>Web</button>
        <button onClick={()=>handleRAGOptions(false)} className={`chat-option-btn ${chatMeta.isDoc? `chat-option-on` : ``}`}>Document</button>
      </div> : ''}
      <input className={`chat-input ${showBorder ? 'with-border' : ''}`} type='text' value={prompt} onChange={(e)=>{setPrompt(e.target.value)}}></input>
        <button onKeyDown={(e)=>handleKeyPress(e)} className='chat-send' onClick={()=>sendPrompt()}> {'>'} </button>
      <button onClick={()=>console.log(streamBodyExtras)}>TEST</button>

  </div> )
}




  return (
    <NavLayout>
    <div className='chat-page'>
        {titleComp()}

      <div ref={chatPageRef} className='chat-box'> 
        {chat.length === 0 && !wait? 
        <div className='newchat-cont'>
          <div className='newChat-title-cont'>
            <h3>New Chat! {`-->`}  Start the conversation by sending a message!</h3>
          </div>
        </div> : ""}
        
        {chat.map((item, index)=> {
          if (item.content == "") return
          if (item.role == 'assistant') {
            return (
              <>
                <div className="chat-bubble chat-ai">
                  <div className='chat-name'>{item.name? item.name : "NO NAME"}</div>
                  <Markdown>{item.content}</Markdown>
                </div>
              </>
            )
          }
          return (
          <>
            <div key={index} className={`chat-bubble ${item.role =='assistant'? "chat-ai" : "chat-client"}`}>{item.content}</div>
          </>) 
        })}
        

        {wait? <div className='waiting-res-indicator'>Waiting for Response ...</div> : ""}

        <div ref={chatSpaceRef} className='chat-space'></div>
      </div>


        {chatInputBox(ChatInputBoxComp())}



    </div>
    </NavLayout>
  )
}

export default ChatPage