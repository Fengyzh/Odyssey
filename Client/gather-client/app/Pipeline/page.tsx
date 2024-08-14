'use client'

import React, { useEffect, useRef, useState } from 'react'
import '@/app/Chat/chat.css'
import NavLayout from '@/app/navLayout'
import ChatPage from '@/comp/Chat/ChatPage'
import { useSidebar } from '../context/sidebarContext';
import ChatTitleFunc from '@/comp/Chat/ChatTitleFunc';
import { ChatMetaData, ChatResponse, IChatEndpoints, IModelOptions, IOllamaList, IPipelineLayer, IPipelineMeta } from '@/comp/Types';
import axios, { AxiosResponse } from 'axios';
import { usePathname } from 'next/navigation';
import { useDebounce, sendTitleUpdate, adjustInputLength } from '@/comp/Util';
import { constants } from '@/app/constants'
import './pipeline.css'
import { Modal }  from '@/comp/Modal'

export default function page() {
  const { DEFAULT_LAYER_DATA, DEFAULT_PIPELINE_META } = constants();

  const titleContRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pipelineInputRef = useRef<HTMLInputElement>(null);

  const [chat, setChat] = useState<ChatResponse[] | any[]>([])
  const [pipeline, setPipeline] = useState<IPipelineLayer[]>([DEFAULT_LAYER_DATA])
  const pathname = usePathname()
  const [isOptionPanel, setIsOptionPanel] = useState<boolean>(false)
  const [isModal, setIsModal] = useState<boolean>(true)
  const [isModelSelect, setIsModelSelect] = useState<boolean[]>([false])
  const [modelList, setModelList] = useState<IOllamaList[] | []>([])
  const [pipelineMeta, setPipelineMeta] = useState<IPipelineMeta>(DEFAULT_PIPELINE_META)


  
  const { toggleSidebar, 
    currentChat,  
    fetchChatSnippets, 
    isSidebarToggled, 
    setChatMeta, 
    chatMeta,
    handleChatDelete } = useSidebar();

    useEffect(() => {
      if (titleContRef && titleContRef.current) {
        if (isSidebarToggled) {
          titleContRef.current.style.transform='translateX(10%)'
        } else {
          titleContRef.current.style.transform='translateX(0)'
        }
      }
  
    }, [isSidebarToggled]) 

    useEffect(() => {
      adjustInputLength(inputRef)
    }, [chatMeta['title']]) 


    /* useEffect(() => {
      if (isModal) {      
        handleExtentModelSelect()    
      }
    }, [isModal]) */ 


    const handleExtentModelSelect = () => {
      axios.get("http://localhost:5000/api/LLM/list").then((res)=> {
        setModelList(res.data?.models.models)
        console.log(res.data.models.models)
      })
    }


    const pfetch = (res:AxiosResponse<any, any>)=>{
      console.log(res.data)
      setChat(res.data.history)

    if (res.data.meta != undefined) {
        console.log(res.data.meta)
        setChatMeta(res.data.meta)
      }
    
    if (res.data.pipeline != undefined) {
      setPipeline([])
    }
        
  }


  const debouncedSendTitleUpdate = useDebounce((newMeta) => {
    sendTitleUpdate(pathname, currentChat, newMeta).then((res)=>{
      fetchChatSnippets()
    });
  }, 1000);

  const handleTitleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
    let newMeta = chatMeta
    newMeta["title"] = e.target.value
    setChatMeta((prev)=>({...prev, title: e.target.value}))
    debouncedSendTitleUpdate(newMeta)
  }

 const handleAddPipelineLayer = () => {
  // TEMP: here to show the order relationship
  let temp = DEFAULT_LAYER_DATA
  temp.model = temp.model + pipeline.length
    setPipeline((prev)=>[...prev, temp])
 }


 const handleLayerDelete = (index:number) => {
    let temp = [...pipeline]
    temp.splice(index,1)
    setPipeline(temp)
 }


 const swapElement = (arr:any[], el1:any, el2:any) => {
  let tempArr = [...arr]
  let temp = tempArr[el1]
  tempArr[el1] = tempArr[el2]
  tempArr[el2] = temp
  return tempArr
 }


 const handleLayerOrdering = (isUp:boolean, index:number) => {
  if (isUp) {
    setPipeline(swapElement(pipeline, index, index-1))
  } else {
    setPipeline(swapElement(pipeline, index, index+1))
  }

 }


 const handleSysPrompt = (e:React.ChangeEvent<HTMLTextAreaElement>, index:number) => {
  let temp = [...pipeline]
  temp[index].modelOptions!.systemPrompt = e.target.value
  setPipeline(temp)
 }


 const ToggleLayerModelPanel = (index:number) => {
  setIsModelSelect((prev)=>{
    let temp = [...prev]
    temp[index] = !temp[index]
    return temp
  })

 }


 const handleModelSelect = (index:number, modelName:string) => {
  const newPipeline = [...pipeline]
  newPipeline[index].model = modelName
  setPipeline(newPipeline)
}


  const handleLayerOptions = (index:number, options:keyof IModelOptions, e:React.ChangeEvent<HTMLInputElement>) => {
    let tempPipe = [...pipeline]
    let tempOptions = tempPipe[index]
    if (tempOptions.modelOptions) {
      tempOptions.modelOptions[options] = e.target.value
      setPipeline(tempPipe)
    }    
  }

  const handleSubmitPipeline = () => {
    // Handle Pipeline update url
    console.log(pipeline)
  }

  const handleFav = () => {
    let tempMeta = {...pipelineMeta}
    tempMeta.isFav = !tempMeta.isFav
    console.log(tempMeta.isFav)

    setPipelineMeta(tempMeta)
  }


  const handlePipelineTitleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
    setPipelineMeta((prev)=>({...prev, pipelineName: e.target.value}))
    adjustInputLength(pipelineInputRef, 15, 12)
  }
  

  const chatOptionPanel = (<div className='pipeline-option-panel chat-option-panel'>
  <div className='chat-delete-btn-cont'>
    <button className='chat-delete-btn pipeline-delete-btn' onClick={()=>handleChatDelete()}> Delete Chat</button>
  </div>

</div>)


  const chatTitle = () => {return (<div className='chat-page-title-cont'>
  <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>

  <div ref={titleContRef} className='chat-title-func-cont'>
    {chatMeta.title !== 'Chat Title'? <input ref={inputRef} className='chat-page-title-t' onChange={(e)=>handleTitleChange(e)} value={chatMeta.title}/> 
    : 
    <h2 className='chat-page-title'> {chatMeta.title} </h2>}
          
  </div>

  <div className='chat-options pipeline-options'>
    <button className='chat-options-btn' onClick={()=>setIsModal((prev)=>!prev)}> P+ </button>
  </div>

  {/* Aadd the currentChat? back after pipeline panel is done */}   
  <div className='chat-options'>
    <button onClick={()=>{setIsOptionPanel(!isOptionPanel)}} className='chat-options-btn'> === </button>
    {isOptionPanel? chatOptionPanel : ''}
  </div>

</div>)}


const pipelineLayerComp = (pipe:IPipelineLayer, index:number) => {
  return (
    <div className='pipeline-layers'>
      <div>

        <div  className='pipeline-model-options'>

            <div className='layer-title'>
              <div className='pipeline-model-select' > 
                {pipe.model} 
              </div>
              <div className='layer-options-btn' onClick={()=>ToggleLayerModelPanel(index)}> Options</div>
            </div>

            <div className={`layer-model-select-cont ${isModelSelect[index]? `model-option-toggle` : ``}`}>
              <div className='layer-model-select'>
              {modelList.map((model, modelindex) => {
                return <h4 key={modelindex} className='layer-model-items' onClick={()=>handleModelSelect(index, model.name)}>{model.name} {model.details.parameter_size}</h4>
                })}
              </div>
       

              {/* TODO: Handle input logic */}
              <div className='layer-model-option-cont'>
                <div className='layer-model-options'>
                    <p>Temperature</p>
                    <input className='layer-option-inputs' onChange={(e)=>handleLayerOptions(index, 'temperature', e)} value={pipeline[index].modelOptions?.temperature}/>
                  </div>
                  <div className='layer-model-options'>
                    <p>Top K</p>
                    <input className='layer-option-inputs' onChange={(e)=>handleLayerOptions(index, 'top_k', e)} value={pipeline[index].modelOptions?.top_k}/>
                  </div>
                  <div className='layer-model-options'>
                    <p>Top P</p>
                    <input className='layer-option-inputs' onChange={(e)=>handleLayerOptions(index, 'top_p', e)} value={pipeline[index].modelOptions?.top_p}/>
                  </div>
              </div>
            </div>

        </div>

        <div>
          <textarea className='pipeline-sysprompt-text' onChange={(e)=>handleSysPrompt(e, index)} value={pipe.modelOptions?.systemPrompt}/>
        </div>

      </div>
      <div className='pipeline-delete-cont'>
        <div className='pipeline-layers-delete'>
          <button onClick={()=>handleLayerDelete(index)} className='pipeline-layers-btn pipeline-layers-btn-delete'>X</button>
        </div>
      </div>
      <div className='pipeline-layers-control'>

        {index != 0? 
        <button onClick={()=>handleLayerOrdering(true, index)} className='pipeline-layers-btn'>U</button> : ""}

        {index != pipeline.length-1? 
        <button onClick={()=>handleLayerOrdering(false, index)} className='pipeline-layers-btn'>D</button>
                : ""}

      </div>
    </div>
  )

}


const modalBody = () => {
  return (
    <div>
      <div className='pipeline-title-cont'>
        <input ref={pipelineInputRef} className='pipeline-body-title' onChange={(e)=>handlePipelineTitleChange(e)} value={pipelineMeta.pipelineName}/>
        <button className={`pipeline-fav ${pipelineMeta.isFav? `pipeline-faved`:``}`} onClick={()=>handleFav()}>FAV</button>
      </div>
      <div className='pipeline-body'>
          {pipeline.map((pipe, index)=>{
                return (
                  <>
                    {pipelineLayerComp(pipe, index)}
                    <h3 className='pipeline-layer-seperator'>V</h3>
                  </>
                  )
          })}
        <div className='pipeline-output-labal'>Output</div>
        <button className='pipeline-addlayer-btn' onClick={()=>handleAddPipelineLayer()}>Add Layer</button>

      </div>
    </div>
  )
}

const modalExBtnPanel = () => {
  return (
    <div className='pipeline-ex-btn-panel'>
      <button onClick={()=>handleSubmitPipeline()} className='pipeline-submit'>Update Pipeline</button>
    </div>
  )
}

const modalLeftBody = () => {
  return (
    <div className='pipeline-saved-body'>
      <div className='saved-pipelines'>Hello</div>
      <div className='saved-pipelines'>Hello</div>
      <div className='saved-pipelines'>Hello</div>

    </div>
  )
}



// TODO: Update to Agent endpoints
const chatEndpoints:IChatEndpoints = {getCurrentChat:'http://localhost:5000/api/chat/', newChat:'http://localhost:5000/api/newchat', stream:'http://localhost:5000/api/stream', delete:'http://localhost:5000/api/chat/delete/'}

const chatProps = {
  chatEndpoints: chatEndpoints,
  titleComp: chatTitle,
  chat: chat,
  setChat: setChat,
  resProcess: pfetch
}

const ModalProps = {
  modalBody: modalBody,
  setIsModal:setIsModal,
  modalExternalControlPanel: modalExBtnPanel,
  modalTitle:'Pipeline Setup',
  modelLeftBody: modalLeftBody
}


  return (
    <>
      <ChatPage {...chatProps}/>
      {isModal? <Modal {...ModalProps}/> : ''}
    </>
  )
}
