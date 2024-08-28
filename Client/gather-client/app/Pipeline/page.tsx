'use client'

import React, { useEffect, useRef, useState } from 'react'
import '@/app/Chat/chat.css'
import ChatPage from '@/comp/Chat/ChatPage'
import { useSidebar } from '../context/sidebarContext';
import { ChatMetaData, ChatResponse, IChatEndpoints, IModalMeta, IModelOptions, IOllamaList, IPipelineLayer, ISavedPipeline } from '@/comp/Types';
import axios, { AxiosResponse } from 'axios';
import { usePathname } from 'next/navigation';
import { useDebounce, sendTitleUpdate, adjustInputLength, createNewChat, handleAnimateSideBar } from '@/comp/Util';
import { constants } from '@/app/constants'
import './pipeline.css'
import { Modal, modalExBtnPanel }  from '@/comp/Modal'
import { getLLMList, pipelineARIEndpoints } from '../api'
import { favouritePipeline, getSavedPipelineById, getSavedPipelines, updatePipeline } from './api'
import Title from '@/comp/Title';
import { ModalLayers } from '@/comp/ModalLayers/ModalLayers';

export default function page() {
  const { DEFAULT_LAYER_DATA } = constants();
  const DEFAULT_PIPELINE_META = {id:'', name:'New Pipeline', isFav:false}

  const titleContRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pipelineInputRef = useRef<HTMLInputElement>(null);

  const [chat, setChat] = useState<ChatResponse[] | any[]>([])
  const [pipeline, setPipeline] = useState<IPipelineLayer[]>([DEFAULT_LAYER_DATA])
  const pathname = usePathname()
  const [isModal, setIsModal] = useState<boolean>(false)
  const [isModelSelect, setIsModelSelect] = useState<boolean[]>([false])
  const [modelList, setModelList] = useState<IOllamaList[] | []>([])
  const [pipelineMeta, setPipelineMeta] = useState<IModalMeta>(DEFAULT_PIPELINE_META)
  const [savedPipelines, setSavedPipelines] = useState<ISavedPipeline[] | []>([])


  
  const {
    currentChat,  
    fetchChatSnippets, 
    isSidebarToggled, 
    setChatMeta, 
    chatMeta,
    handleChatDelete,
    setCurrentChat } = useSidebar();

    useEffect(() => {
      handleAnimateSideBar(titleContRef, isSidebarToggled)
    }, [isSidebarToggled]) 

    useEffect(() => {
      adjustInputLength(inputRef)
    }, [chatMeta['title']]) 


    useEffect(() => {
      if (isModal) {      
        handleExtentModelSelect()
        fetchAllSavedPipeline()    
      }
    }, [isModal]) 



    const handleExtentModelSelect = () => {
      getLLMList().then((res)=> {
        setModelList(res.data?.models.models)
        console.log(res.data.models.models)
      })
    }

    const fetchAllSavedPipeline = () => {
      return getSavedPipelines().then((res)=>{
        console.log(res.data)
        setSavedPipelines(res.data)
      })
    }


    const pclean = () => {
      setPipeline([DEFAULT_LAYER_DATA])
      setPipelineMeta(DEFAULT_PIPELINE_META)
    }


    const pfetch = (res:AxiosResponse<any, any>)=>{
      console.log(res.data)
      setChat(res.data.history)

    if (res.data.meta != undefined) {
        console.log(res.data.meta)
        setChatMeta(res.data.meta)
      }
    
      console.log(res.data.pipeline)
      console.log(res.data.pipeline_meta)

    console.log(res.data)
    if (res.data.pipeline != undefined && res.data.pipeline_meta != undefined) {
      setPipeline(res.data.pipeline)
      setPipelineMeta(res.data.pipeline_meta)
    } else {
      setPipeline([DEFAULT_LAYER_DATA])
      setPipelineMeta(DEFAULT_PIPELINE_META)
    }
        
  }


 const handleAddPipelineLayer = () => {

    setPipeline((prev)=>[...prev, DEFAULT_LAYER_DATA])
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

  const handleSubmitPipeline = async () => {
    // Handle Pipeline update url
    let createdEntryId;
    let chatId
    if (!currentChat) {
      const createResponse = await createNewChat(pathname)
      if (createResponse) {
        const entryId = createResponse.data.id
        createdEntryId = entryId
        chatId = entryId
        fetchChatSnippets()
      }
     
    } else {
      chatId = currentChat
    }

    console.log(pipeline)
    await updatePipeline(chatId, pipeline, pipelineMeta)
    setCurrentChat(chatId)
    setIsModal(false)
  }

  const handleFav = () => {

    favouritePipeline(pipeline, pipelineMeta).then(()=>{
      fetchAllSavedPipeline()
    })

  }


  const handlePipelineTitleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
    setPipelineMeta((prev)=>({...prev, pipelineName: e.target.value}))
    adjustInputLength(pipelineInputRef, 15, 12)
  }
  
  const handleRAGOption = (index:number, isWeb:boolean) => {
    let tempPipe = [...pipeline]
    
    if (isWeb) {
      tempPipe[index].isWeb = !tempPipe[index].isWeb
    } else {
      tempPipe[index].isDoc = !tempPipe[index].isDoc
    }
    setPipeline(tempPipe)

  }

  const handleChangePipeline = (pipelineId:string) => {
    getSavedPipelineById(pipelineId).then((res)=>{
      setPipeline([...res.data.settings])
    })
  }
  


  const chatOptionPanel = (<div className='pipeline-option-panel chat-option-panel'>
  <div className='chat-delete-btn-cont'>
    <button className='chat-delete-btn pipeline-delete-btn' onClick={()=>handleChatDelete()}> Delete Chat</button>
  </div>

</div>)


/*   const chatTitle = () => {return (<div className='chat-page-title-cont'>
  <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>

  <div ref={titleContRef} className='chat-title-func-cont'>
    <input ref={inputRef} className='chat-page-title-t' onChange={(e)=>handleTitleChange(e)} value={chatMeta.title}/> 

          
  </div>

  <div className='chat-options pipeline-options'>
    <button className='chat-options-btn' onClick={()=>setIsModal((prev)=>!prev)}> P+ </button>
  </div>

  {currentChat?   
  <div className='chat-options'>
    <button onClick={()=>{setIsOptionPanel(!isOptionPanel)}} className='chat-options-btn'> === </button>
    {isOptionPanel? chatOptionPanel : ''}
  </div> : ''}


</div>)} */

const titleOptionalBlock = () => {
  return (<div className='chat-options pipeline-options'>
    <button className='chat-options-btn' onClick={()=>setIsModal((prev)=>!prev)}> P+ </button>
</div>)
}

const chatTitle = () => {return (<Title titleContRef={titleContRef} optionPanelComp={chatOptionPanel} inputRef={inputRef} titleOptionalBlock={titleOptionalBlock}/>)}
 




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
       

              <div className='layer-model-option-cont'>
                <div className='layer-model-options'>
                  <button className={`layer-model-option-toggle ${pipeline[index].isWeb? `layer-model-option-open` : ``}`} onClick={()=>handleRAGOption(index, true)}>Web</button>
                  <button className={`layer-model-option-toggle ${pipeline[index].isDoc? `layer-model-option-open` : ``}`} onClick={()=>handleRAGOption(index, false)}>Document</button>
                </div>

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
        <input ref={pipelineInputRef} className='pipeline-body-title' onChange={(e)=>handlePipelineTitleChange(e)} value={pipelineMeta.name}/>
        <button className={`pipeline-fav`} onClick={()=>handleFav()}>Save Play</button>
      </div>
      <div className='pipeline-body'>
          {pipeline.map((pipe, index)=>{
                return (
                  <>
                    {/* {pipelineLayerComp(pipe, index)} */}
                    <ModalLayers layer={pipe} layers={pipeline} index={index} setLayers={setPipeline}/>
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


const modalLeftBody = () => {
  return (
    <div className='pipeline-saved-body'>
      {savedPipelines.map((sPipe, index)=>{
        return <div key={sPipe._id} onClick={()=>handleChangePipeline(sPipe._id)} className='saved-pipelines'>{sPipe.name}</div>
      })}

    </div>
  )
}

const chatInputBox = (defaultChatInputBox: React.JSX.Element)=> {
  if (pipeline.length < 1) {
    return <div className='chatbox-cont pipeline-chatbox-cont'> Add a pipeline layer to start!</div>
  } else {
    return defaultChatInputBox
  }
}

const pipelineTextStream = (userMessage:ChatResponse, streamText:string) => {
  if (streamText.includes('<PIPELINE_BREAK>')) { /* TEST */
  setChat(prevChat => [...prevChat, { role: 'assistant', content: "" }]); /* TEST */
}

setChat((prevChat) => {
  if (streamText == '<PIPELINE_BREAK>') {
    return [...prevChat]
  }  
  if (prevChat.length === 0) {
    return [userMessage, { role: 'assistant', content: streamText }];
  } else {
    const updatedChat = [...prevChat];
    const lastMessage = updatedChat[updatedChat.length - 1];
    updatedChat[updatedChat.length - 1] = { ...lastMessage, content: lastMessage.content + streamText };          
    return updatedChat;
  }
});  

}




const chatProps = {
  chatEndpoints: pipelineARIEndpoints,
  titleComp: chatTitle,
  chat: chat,
  setChat: setChat,
  resProcess: pfetch,
  streamBodyExtras: {pipeline:pipeline, pipelineMeta:pipelineMeta},
  resCleanUp: pclean,
  chatInputBox: chatInputBox,
  streamProcessing: pipelineTextStream
}

const ModalProps = {
  modalBody: modalBody,
  setIsModal:setIsModal,
  modalExternalControlPanel: modalExBtnPanel(handleSubmitPipeline, 'Update Pipeline'),
  modalLeftBody: modalLeftBody,
  modalLeftName: "Saved Pipeline"
}


  return (
    <>
      <ChatPage {...chatProps}/>
      {isModal? <Modal {...ModalProps}/> : ''}
    </>
  )
}
