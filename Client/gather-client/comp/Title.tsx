'use client'
import React, { ReactNode, useState } from 'react'
import { useSidebar } from '@/app/context/sidebarContext';


interface ITitleProp {
    titleContRef: React.RefObject<HTMLDivElement>
    optionPanelComp: () => ReactNode

}


const Title:React.FC<ITitleProp> = ({titleContRef, optionPanelComp}) => {

    const { toggleSidebar, 
        chatMeta } = useSidebar();

    const [isOptionPanel, setIsOptionPanel] = useState<boolean>(true)


  return (
    <div className='chat-page-title-cont'>
      <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>

      <div ref={titleContRef} className='chat-title-func-cont'>
        <h2 className='chat-page-title'> {chatMeta.title} </h2>
        
      </div>
      <div className='chat-options'>
        <button onClick={()=>{setIsOptionPanel(!isOptionPanel)}} className='chat-options-btn'> === </button>
        {isOptionPanel? optionPanelComp() : ''}
    </div>
  </div>
  )}

  export default Title