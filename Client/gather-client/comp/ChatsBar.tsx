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

    const [convos, setConvos] = useState([{title:'Chat1'}, {title:'Chat2'}, {title:'Chat3'}])
    const { isSidebarToggled, toggleSidebar, setCurrentChat, currentChat, fetchChatSnippets, chats } = useSidebar();
 

    useEffect(() => {
        fetchChatSnippets()
    }, [])
    


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


  return (
        <div className='ChatsBar-cont'>
            <div className='bar-top'>
                <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>
                <h2 className='mode-toggle'>Chat Page</h2>
            </div>
            <div>
                {chats.map((chat:ChatSnippets, index)=>{
                    return <div onClick={()=>handleChatSelect(chat._id)} key={index} className='nav-chat-titles'>{chat.title}</div>
                })}
            </div>
            <button onClick={()=>{console.log(pathname)}}>PATH</button>
            <button onClick={()=>{handleNewChat()}}>Start a new Chat</button>

        </div>
  )
}
