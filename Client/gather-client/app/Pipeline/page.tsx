'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
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
import { deleteSavedPipeline, favouritePipeline, getSavedPipelineById, getSavedPipelines, updatePipeline } from './api'
import Title from '@/comp/Title';
import { ModalLayers } from '@/comp/ModalLayers/ModalLayers';

export default function page() {
  const { DEFAULT_LAYER_DATA } = constants();
  const DEFAULT_PIPELINE_META = {id:'', name:'New Pipeline', isFav:false}

  const titleContRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pipelineInputRef = useRef<HTMLInputElement>(null);

  const [chat, setChat] = useState<ChatResponse[]>([])
  const [pipeline, setPipeline] = useState<IPipelineLayer[]>([DEFAULT_LAYER_DATA])
  const pathname = usePathname()
  const [isModal, setIsModal] = useState<boolean>(false)
  const [isModelSelect, setIsModelSelect] = useState<boolean[]>([false])
  const [pipelineMeta, setPipelineMeta] = useState<IModalMeta>(DEFAULT_PIPELINE_META)
  const [savedPipelines, setSavedPipelines] = useState<ISavedPipeline[] | []>([])
  const [editSaved, setEditSaved] = useState<boolean>(false)
  const [counter, setCounter] = useState<number>(0)


  
  const {
    currentChat,  
    fetchChatSnippets, 
    isSidebarToggled, 
    setChatMeta, 
    chatMeta,
    handleChatDelete,
    setCurrentChat,
    getModalList } = useSidebar();

    useEffect(() => {
      handleAnimateSideBar(titleContRef, isSidebarToggled)
    }, [isSidebarToggled]) 

    useEffect(() => {
      adjustInputLength(inputRef)
    }, [chatMeta['title']]) 


    useEffect(() => {
      if (isModal) {      
        fetchAllSavedPipeline()
        getModalList()
      }
    }, [isModal]) 


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
    setPipelineMeta((prev)=>({...prev, name: e.target.value}))
    adjustInputLength(pipelineInputRef, 13, 11)
  }
  

  const handleChangePipeline = (pipelineId:string) => {
    getSavedPipelineById(pipelineId).then((res)=>{
      setPipeline([...res.data.settings])
    })
  }

  const handleDeleteSaved = (index:number) => {
    console.log(`Deleting: ${savedPipelines[index]._id}`)
    if (!savedPipelines[index]._id) return
    deleteSavedPipeline(savedPipelines[index]._id).then(()=>{
      fetchAllSavedPipeline()
    })

  }

  const handleNewChat = () => {
    setPipeline([DEFAULT_LAYER_DATA])
    setPipelineMeta(DEFAULT_PIPELINE_META)
  }
  




  const chatOptionPanel = (<div className='pipeline-option-panel chat-option-panel'>
  <div className='chat-delete-btn-cont'>
    <button className='chat-delete-btn pipeline-delete-btn' onClick={()=>handleChatDelete()}> Delete Chat</button>
  </div>

</div>)

const titleOptionalBlock = () => {
  return (<div className='chat-options pipeline-options'>
    <button className='chat-options-btn' onClick={()=>setIsModal((prev)=>!prev)}> P+ </button>
</div>)
}

const chatTitle = () => {return (<Title titleContRef={titleContRef} optionPanelComp={chatOptionPanel} inputRef={inputRef} titleOptionalBlock={titleOptionalBlock}/>)}
 







const modalBody = () => {
  return (
    <div>
      <div className='pipeline-title-cont'>
        <input ref={pipelineInputRef} className='pipeline-body-title' onChange={(e)=>handlePipelineTitleChange(e)} value={pipelineMeta.name}/>
        <button className={`pipeline-fav`} onClick={()=>handleFav()}>Save Pipeline</button>
        <button className='pipeline-new' onClick={()=>handleNewChat()}>New Pipeline</button>
      </div>
      <div className='pipeline-body'>
          {pipeline.map((pipe, index)=>{
                return (
                  <>
                    {/* {pipelineLayerComp(pipe, index)} */}
                    <ModalLayers layer={pipe} layers={pipeline} index={index} setLayers={setPipeline} allowRag={true}/>
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
    <>
    <div className='pipeline-saved-body'>
      {savedPipelines.map((sPipe, index)=>{
        return <>
          <div key={sPipe._id} onClick={()=>handleChangePipeline(sPipe._id)} className='saved-pipelines'>{sPipe.name}
          {editSaved?  
          <div onClick={()=>handleDeleteSaved(index)} className='pipeline-saved-delete'>
            X
          </div> : ''}

            </div>
        </>
      })}

    </div>
    <div className='modal-left-panel-btn-cont'>
      <button className='modal-left-panel-edit' onClick={()=>setEditSaved(()=>!editSaved)}>Edit Saved</button>
    </div>
    </>
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
  setCounter(prev=>prev+1)
  setChat(prevChat => [...prevChat, { role: 'assistant', content: "", name:pipeline[counter+1].model }]); /* TEST */
}

setChat((prevChat) => {
  if (streamText == '<PIPELINE_BREAK>') {
    return [...prevChat]
  }  
  if (prevChat.length === 0) {
    return [userMessage, { role: 'assistant', content: streamText, name:pipeline[0].model }];
  } else {
    const updatedChat = [...prevChat];
    const lastMessage = updatedChat[updatedChat.length - 1];
    updatedChat[updatedChat.length - 1] = { ...lastMessage, content: lastMessage.content + streamText };          
    return updatedChat;
  }
});  

}


const pipelinePreProcessing = (userMessage:ChatResponse) => {
  setChat(prevChat => [...prevChat, userMessage, { role: 'assistant', content: "", name:pipeline[0].model}]);
  setCounter(prev=>0)
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
  streamProcessing: pipelineTextStream,
  streamPreProcessing: pipelinePreProcessing
}

const ModalProps = {
  modalBody: modalBody,
  setIsModal:setIsModal,
  modalExternalControlPanel: modalExBtnPanel(handleSubmitPipeline, 'Update Pipeline'),
  modalLeftBody: modalLeftBody,
  modalLeftExtras: {modalLeftBtnTxt:'Saved Pipelines', modalLeftTitle:'Saved'}
}


  return (
    <>
      <ChatPage {...chatProps}/>
      {isModal? <Modal {...ModalProps}/> : ''}
    </>
  )
}
