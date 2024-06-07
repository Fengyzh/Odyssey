'use client'
import React, { useEffect, useState } from 'react'
import './ChatsBar.css'
import { useSidebar } from '@/app/context/sidebarContext';

export default function ChatsBar() {

    const { isSidebarToggled, toggleSidebar, setIsSidebarToggled } = useSidebar();


    useEffect(() => {
        let bar = document.getElementsByClassName('ChatsBar-cont')[0] as HTMLElement
        if (!isSidebarToggled) {
            bar.style.width = '0'
        } else {
            bar.style.width = '12%'
        }
    

    }, [isSidebarToggled])
    


  return (
    <div className='ChatsBar-cont'>
        <div className='bar-top'>
            <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>
            <h2 className='mode-toggle'>Chat Page</h2>
        </div>
    </div>
  )
}
