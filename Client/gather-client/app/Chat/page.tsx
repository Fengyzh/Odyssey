import React from 'react'
import './chat.css'

export default function page() {
  return (
    <div className='chat-page'>

      <div className='chat-box'> Hello </div>

      <div className='chatbox-cont'>
        <input className='chat-input' type='text'></input>
        <button className='chat-send'>Send</button>
      </div>

    </div>
  )
}
