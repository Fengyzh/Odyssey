'use client'
import React, { ReactNode, useState } from 'react'
import { useSidebar } from '@/app/context/sidebarContext';
import { sendTitleUpdate, useDebounce } from './Util';


interface ITitleProp {
    titleContRef: React.RefObject<HTMLDivElement>
    inputRef: React.RefObject<HTMLInputElement>
    optionPanelComp: ReactNode
    titleFunctionalBlock?: () => ReactNode
    titleOptionalBlock?: () => ReactNode
}


const Title:React.FC<ITitleProp> = ({titleContRef, optionPanelComp, inputRef, titleFunctionalBlock, titleOptionalBlock}) => {

    const { toggleSidebar, 
        chatMeta,
        setChatMeta,
        fetchChatSnippets,
        currentChat,
        pathname } = useSidebar();

    const [isOptionPanel, setIsOptionPanel] = useState<boolean>(false)


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



  return (
    <div className='chat-page-title-cont'>
      <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>

      <div ref={titleContRef} className='chat-title-func-cont'>
      {currentChat !== ''? <input ref={inputRef} className='chat-page-title-t' onChange={(e)=>handleTitleChange(e)} value={chatMeta.title}/> 
    : 
    <h2 className='chat-page-title'> New Chat </h2>}

        {titleFunctionalBlock? titleFunctionalBlock() : ''}

      </div>

      {titleOptionalBlock? titleOptionalBlock() : ''}

      <div className='chat-options'>
        <button onClick={()=>{setIsOptionPanel(!isOptionPanel)}} className='chat-options-btn'> === </button>
        {isOptionPanel? optionPanelComp : ''}
    </div>
  </div>
  )}

  export default Title