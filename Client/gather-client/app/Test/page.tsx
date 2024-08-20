'use client'
import PagedChatBox from '@/comp/PagedChatBox'
import React, { useState, useEffect, useRef, ChangeEvent, FormEvent, ReactNode, Dispatch, SetStateAction } from 'react'

export default function page() {

    const [dummy, setDummy] = useState([[{role: 'user', content: 'Hello'}], [{role: 'user', content: 'World'}], [{role: 'user', content: 'How'}, {role: 'Assit', content: 'Are'}]])
    const [buffer, setBuffer] = useState({role: 'assit', content: ''})

    const addToLast = () => {
        let tempa = [...dummy]
        tempa[tempa.length-1].push(buffer)
        setDummy(tempa)
    }


  return (
    <div>
        
        <div>Test Page</div>
        <div>
            {dummy.map((item, index)=>{
                return <PagedChatBox item={item}/>
            })}

        <input onChange={(e)=>setBuffer(prev=>({...prev, content:e.target.value}))} value={buffer.content}/>
        <button onClick={()=>addToLast()}>Send Buffer</button>
        <button onClick={()=>console.log(dummy)}>Show Dummy Array</button>


        </div>


    </div>
  )
}
