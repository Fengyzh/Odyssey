'use client'
import ChatPage from '@/comp/Chat/ChatPage'
import { Modal, modalExBtnPanel } from '@/comp/Modal'
import React, { useEffect, useRef, useState } from 'react'
import { RPAPIEndpoints } from '../api'
import { useSidebar } from '../context/sidebarContext'
import { adjustInputLength, createNewChat, handleAnimateSideBar, sendTitleUpdate, useDebounce } from '@/comp/Util'
import { usePathname } from 'next/navigation'
import { ChatResponse, IModalMeta, IModelOptions, IOllamaList, IRPLayer, ISavedPipeline } from '@/comp/Types'
import { AxiosResponse } from 'axios'
import { constants } from '@/app/constants'
import { getSavedPlayById } from './api'
import Title from '@/comp/Title'
import '@/app/Roleplay/rp.css'
import { ModalLayers } from '@/comp/ModalLayers/ModalLayers'

export default function page() {
    const { DEFAULT_RP_LAYER } = constants();
    const DEFAULT_RP_META = {id:'', name:'New Play', isFav:false}


    const [isModal, setIsModal] = useState<boolean>(true)
    const [chat, setChat] = useState<ChatResponse[] | any[]>([])
    const [layers, setLayers] = useState<IRPLayer[] | []>([DEFAULT_RP_LAYER])
    const [rpMeta, setRpMeta] = useState<IModalMeta>(DEFAULT_RP_META)
    const [savedPlays, setSavedPlays] = useState<ISavedPipeline[] | []>([])



    const titleContRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const rpInputRef = useRef<HTMLInputElement>(null);

    const pathname = usePathname()

    const {
        currentChat,  
        fetchChatSnippets, 
        isSidebarToggled, 
        setChatMeta, 
        handleChatDelete,
        setCurrentChat,
        getModalList } = useSidebar();

    useEffect(() => {
        handleAnimateSideBar(titleContRef, isSidebarToggled)

    }, [isSidebarToggled]) 

    useEffect(() => {
      if (isModal) {      
        //getModalList()
      }
    }, [isModal]) 



    const rpfetch = (res:AxiosResponse<any, any>)=>{
        console.log(res.data)
        setChat(res.data.history)
      
      if (res.data.meta != undefined) {
          console.log(res.data.meta)
          setChatMeta(res.data.meta)
        }
      
      }


    const handleAddPipelineLayer = () => {
        setLayers((prev)=>[...prev, DEFAULT_RP_LAYER])
    }    


    const handleRPTitleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        setRpMeta((prev)=>({...prev, pipelineName: e.target.value}))
        adjustInputLength(rpInputRef, 15, 12)
      }


      const handleSubmitRp = async () => {
        // TODO: Impl
        console.log(layers)
        /* let createdEntryId;
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
    
        //await updatePipeline(chatId, pipeline, pipelineMeta)
        setCurrentChat(chatId)
        setIsModal(false) */
      }



    const handleChangePlay = (playId:string) => {
        // TODO: IMPL
        getSavedPlayById(playId).then((res)=>{
        // TEMP set value
        setLayers([])
    })
    }




    /* ---- FUNCTIONAL LINE ---- */

    const titleOptionalBlock = () => {
        return (<div className='chat-options rp-options'>
          <button className='chat-options-btn' onClick={()=>setIsModal((prev)=>!prev)}> RP+ </button>
      </div>)
      }
      
      const chatTitle = () => {return (<Title titleContRef={titleContRef} optionPanelComp={chatOptionPanel} inputRef={inputRef} titleOptionalBlock={titleOptionalBlock}/>)}
       


    const chatInputBox = (defaultChatInputBox: React.JSX.Element)=> {
        return defaultChatInputBox
    }




    const chatTextStream = (userMessage:ChatResponse, streamText:string) => {
        setChat((prevChat) => {
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


  const chatOptionPanel = (<div className='pipeline-option-panel chat-option-panel'>
  <div className='chat-delete-btn-cont'>
    <button className='chat-delete-btn pipeline-delete-btn' onClick={()=>handleChatDelete()}> Delete Chat</button>
  </div>

</div>)


const modalOptionalText = (index:number, layer:IRPLayer) => { 
  return (
  <div className='rp-optional-text-cont'>
    <div className='rp-option-row'>
      <div className='rp-options-cont'>
        <label>Name</label>
        <input className='rp-option-input' value={layer.rpOptions.name}/>
      </div>
      <div className='rp-options-cont'>
        <label>Role</label>
        <input className='rp-option-input' value={layer.rpOptions.role}/>
      </div>
    </div>

    <div className='rp-option-row'>
      <div className='rp-options-cont'>
        <label>Behavior</label>
        <input className='rp-option-input' value={layer.rpOptions.behavior}/>
      </div>

    </div>


  </div>
)}



    const modalBody = () => {
        return (
        <div>
            <div className='pipeline-title-cont'>
            <input ref={rpInputRef} className='pipeline-body-title' onChange={(e)=>handleRPTitleChange(e)} value={rpMeta.name}/>
            </div>
            <div className='pipeline-body'>
                {layers.map((layer, index)=>{
                    return (
                            <ModalLayers key={`${index}-${Math.floor(Math.random()*1000)}`} layer={layer} layers={layers} setLayers={setLayers} index={index} optionalTextField={modalOptionalText}/>
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
            {savedPlays.map((splay, index)=>{
              return <div key={splay._id} onClick={()=>handleChangePlay(splay._id)} className='saved-pipelines'>{splay.name}</div>
            })}
      
          </div>
        )
      }



    const chatProps = {
        chatEndpoints: RPAPIEndpoints,
        titleComp: chatTitle,
        chat: chat,
        setChat: setChat,
        resProcess: rpfetch,
        chatInputBox: chatInputBox,
        streamProcessing: chatTextStream
      }

    const ModalProps = {
    modalBody: modalBody,
    setIsModal:setIsModal,
    modalLeftBody:modalLeftBody,
    modalLeftName: "Saved Plays",
    modalExternalControlPanel: modalExBtnPanel(handleSubmitRp, 'Update Play'),
    }

  return (
    <>
        <ChatPage {...chatProps}/>
        {/* TODO: Add modal */}
        {isModal? <Modal {...ModalProps}/> : ''}
    </>
  )
}
