'use client'
import React, { useState } from 'react'
import './chat.css'
import axios from 'axios'
import StaggerText from '@/comp/StaggerText'

export default function page() {

  
  const [prompt, setPrompt] = useState("")
  const [chat, setChat] = useState<ChatResponse[] | []>([])
  const [wait, setWait] = useState(false)



  const sendPrompt = () => {
    let userMessage = {role:'user', msg:prompt}
    setWait(prev => !prev)
    setChat(prevChat => [...prevChat, userMessage]);

    axios.post("http://localhost:5000/api/chat", {
      message: prompt
    }).then((res) => {
      console.log(res.data);
      let llmMessage = { role: 'assistant', msg: res.data.data };
      

      setChat(prevChat => [...prevChat, llmMessage]);
      setWait(prev => !prev)


    });

  }




  return (
    <div className='chat-page'>
      <div className='chat-page-title-cont'>
        <h2 className='chat-page-title'> Chat Page </h2>
      </div>

      <div className='chat-box'> 
        <div className='chat-bubble chat-client'>hi Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui quos blanditiis magnam aspernatur autem amet molestias, accusamus placeat nobis iusto aliquid, ducimus recusandae exercitationem fuga, dicta repellat. Error praesentium nemo enim, voluptas tempora accusantium quo repudiandae fuga? Minus, error illo suscipit ut voluptatem sunt accusamus! Eum quo eaque iure, dolorum natus libero unde commodi! Soluta sapiente quasi ducimus eum! Accusantium!</div>
        <div className='chat-bubble chat-ai'>hi Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui quos blanditiis magnam aspernatur autem amet molestias, accusamus placeat nobis iusto aliquid, ducimus recusandae exercitationem fuga, dicta repellat. Error praesentium nemo enim, voluptas tempora accusantium quo repudiandae fuga? Minus, error illo suscipit ut voluptatem sunt accusamus! Eum quo eaque iure, dolorum natus libero unde commodi! Soluta sapiente quasi ducimus eum! Accusantium!</div>

        {chat.map((item, index)=> {
          //console.log(chat)
          if (item.role == 'assistant') {
            return <StaggerText className="chat-bubble chat-ai" key={index} text={item.msg}></StaggerText>
          }
          return (
          
          <div key={index} className={`chat-bubble ${item.role =='assistant'? "chat-ai" : "chat-client"}`}>{item.msg}</div>) 
        })}
        

        {wait? <div>Waiting for Response</div> : ""}

        <div className='chat-space'></div>
      </div>


      <div className='chatbox-cont'>
        <input className='chat-input' type='text' onChange={(e)=>{setPrompt(e.target.value)}}></input>
        <button className='chat-send' onClick={()=>sendPrompt()}> {'>'} </button>
      </div>

    </div>
  )
}
