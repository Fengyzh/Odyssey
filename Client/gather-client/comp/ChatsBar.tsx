'use client'
import React, { useEffect, useState } from 'react'
import './ChatsBar.css'
import { useSidebar } from '@/app/context/sidebarContext';
import { usePathname } from 'next/navigation'

export default function ChatsBar() {


/* 
TODO:
  - Init the sidebar will grab all the convo belong to the current mode (exp: chat)
  - List all of them
  - When the user clicks on it, it will set the currentChat in the context to that so it can be displayed
    - the current chat will just be an id, and the chatpgae or whatever mode page will have to make a request to
    get that chat convo so that we are not getting every chat all at once to clog up memory

*/

    const [convos, setConvos] = useState([{title:'Chat1'}, {title:'Chat2'}, {title:'Chat3'}])

    const { isSidebarToggled, toggleSidebar, setIsSidebarToggled } = useSidebar();

    const pathname = usePathname()


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


  return (
        <div className='ChatsBar-cont'>
            <div className='bar-top'>
                <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>
                <h2 className='mode-toggle'>Chat Page</h2>
            </div>
            <div>
                {convos.map((conv, index)=>{
                    return <div key={index} className='nav-chat-titles'>{conv.title}</div>
                })}
            </div>
            <button onClick={()=>{console.log(pathname)}}>PATH</button>

        </div>
  )
}
