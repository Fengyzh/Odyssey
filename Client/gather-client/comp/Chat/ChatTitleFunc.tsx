'use client'
import axios from 'axios'
import React, { useState } from 'react'
import { IOllamaList } from '../Types'
import { useSidebar } from '@/app/context/sidebarContext'


interface IChatTitleFunc {
    modelSelectRef: React.RefObject<HTMLDivElement>
}


const ChatTitleFunc:React.FC<IChatTitleFunc> = ({modelSelectRef}) => {
    const [isModelSelect, setIsModelSelect] = useState<boolean>(false)
    const [modelList, setModelList] = useState<IOllamaList[] | []>([])


    const {
        setChatMeta, 
        chatMeta } = useSidebar();

    const handleExtentModelSelect = () => {
        setIsModelSelect(!isModelSelect)
        axios.get("http://localhost:5000/api/LLM/list").then((res)=> {
          setModelList(res.data?.models.models)
          console.log(res.data.models.models)
        })
      }
    
    const handleModelSelect = (modelName:string) => {
        const newMeta = {...chatMeta, currentModel:modelName}
        setChatMeta(newMeta)
    }


    const modelSelectBox = (<div ref={modelSelectRef} className='chat-model-select'>
    {modelList.map((model, index) => {
    return <h3 key={index} onClick={()=>handleModelSelect(model.name)} className='chat-model-select-models'>{model.name}  {model.details.parameter_size}</h3>
    })}

</div>)

  return (
    <div className='chat-model-cont'>
      <button onClick={()=>handleExtentModelSelect()} className='chat-model-btn'>{chatMeta.currentModel} {'>'}</button>
      {isModelSelect? modelSelectBox : ""}    
    </div>
  )
}


export default ChatTitleFunc