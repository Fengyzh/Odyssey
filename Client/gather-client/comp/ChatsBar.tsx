'use client'
import React, { useEffect, useState } from 'react'
import './ChatsBar.css'
import { useSidebar } from '@/app/context/sidebarContext';
import { usePathname } from 'next/navigation'
import axios from 'axios';

export default function ChatsBar() {


interface ChatSnippets {
    _id:string;
    title:string;
}


/* 
TODO:
  - Init the sidebar will grab all the convo belong to the current mode (exp: chat)
  - List all of them
  - When the user clicks on it, it will set the currentChat in the context to that so it can be displayed
    - the current chat will just be an id, and the chatpgae or whatever mode page will have to make a request to
    get that chat convo so that we are not getting every chat all at once to clog up memory

*/
    const pathname = usePathname()

    const { isSidebarToggled, toggleSidebar, setCurrentChat, currentChat, fetchChatSnippets, chats, tab, setTab, fetchCurrentChatFiles, curFiles } = useSidebar();
 

    useEffect(() => {
        fetchChatSnippets()
    }, [])


    useEffect(() => {
        fetchCurrentChatFiles()

    }, [currentChat])
    


    useEffect(() => {
        let bar = document.getElementsByClassName('ChatsBar-cont')[0] as HTMLElement
        if (!isSidebarToggled) {
            bar.style.width = '0'
        } else {
            bar.style.width = '12%'
        }
    

    }, [isSidebarToggled])
    

    useEffect(() => {

        /* For when chaning chat modes */
    }, [])


    const handleChatSelect = (chatId:string) => {
        setCurrentChat(chatId)
    }

    const handleNewChat = () => {
        setCurrentChat("")
    }




    const chatHistoryComp =  
    (<>
    {chats.map((chat:ChatSnippets, index)=>{
        return <div onClick={()=>handleChatSelect(chat._id)} key={index} className='nav-chat-titles'>{chat.title}</div>
    })}
</>)

    const filesComp = (
        <div className='nav-files-cont'>
            {curFiles && curFiles.map((f, i) => {
                return <div key={i}>{f.name}</div>
            })}
        </div>
    )


  return (
        <div className='ChatsBar-cont'>
            <div className='bar-top'>
                <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>
                <h2 className='mode-toggle'>Chat Page</h2>
            </div>

            <div className='nav-tab-comp-cont'>
                {!tab? filesComp : chatHistoryComp}
            </div>
            
            <div onClick={()=> setTab(!tab)} className='nav-bottom-btn-group'>
                {!tab? <h2>Chat</h2> : <h2>Files</h2>}
            </div>

            <div>
                <button onClick={()=>{console.log(pathname)}}>PATH</button>
                <button onClick={()=>{handleNewChat()}}>Start a new Chat</button>
            </div>
        </div>
  )
}
