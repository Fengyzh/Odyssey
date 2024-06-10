'use client'

import React from 'react'
import ChatsBar from "@/comp/ChatsBar";
import { SidebarProvider } from "./context/sidebarContext";


export default function NavLayout({ children, }: Readonly<{children: React.ReactNode;}>) {

  return (
    <div>
        <ChatsBar/>
        {children}
    </div>
  )
}
