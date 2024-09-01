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
import { deleteSavedPlays, favouritePlay, getSavedPlayById, getSavedPlays, updateRP } from './api'
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
    const [editSaved, setEditSaved] = useState<boolean>(false)


    const titleContRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const rpInputRef = useRef<HTMLInputElement>(null);

    const pathname = usePathname()

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
      if (isModal) {      
        getModalList()
      }
    }, [isModal]) 


    const fetchAllSavedPlays = () => {
      return getSavedPlays().then((res)=>{
        console.log(res.data)
        setSavedPlays(res.data)
      })
    }



    const rpfetch = (res:AxiosResponse<any, any>)=>{
        setChat(res.data.history)
      
      if (res.data.meta != undefined) {
          setChatMeta(res.data.meta)
        }

        if (res.data.layers != undefined && res.data.rp_meta != undefined) {
          setLayers(res.data.layers)
          setRpMeta(res.data.rp_meta)
        } else {
          setLayers([DEFAULT_RP_LAYER])
          setRpMeta(DEFAULT_RP_META)
        }
      
      }


    const handleAddPipelineLayer = () => {
        setLayers((prev)=>[...prev, DEFAULT_RP_LAYER])
    }    


    const handleRPTitleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        setRpMeta((prev)=>({...prev, name: e.target.value}))
        adjustInputLength(rpInputRef, 13, 11)
      }


      const handleSubmitRp = async () => {
        console.log(layers)
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
    
        await updateRP(chatId, layers, rpMeta)
        setCurrentChat(chatId)
        setIsModal(false) 
      }



    const handleChangePlay = (playId:string) => {
        // TODO: IMPL
        getSavedPlayById(playId).then((res)=>{
        // TEMP set value
        setLayers(res.data.playLayers)
    })
    }


    const handleDeleteSaved = (index:number) => {
      console.log(`Deleting: ${savedPlays[index]._id}`)
      if (!savedPlays[index]._id) return
      deleteSavedPlays(savedPlays[index]._id).then(()=>{
        fetchAllSavedPlays()
      })
  
    }


    const handleFav = () => {
      favouritePlay(layers, rpMeta).then(()=>{
        fetchAllSavedPlays()
      })
    }

  const handleNewChat = () => {
    setLayers([DEFAULT_RP_LAYER])
    setRpMeta(DEFAULT_RP_META)
  }


  const handleLayerOption = (index:number, e:React.ChangeEvent<HTMLInputElement>, type: "name" | "role" | "behavior") => {
    let allL = [...layers]
    let curLayer = allL[index]
    curLayer.rpOptions[type] = e.target.value

    setLayers(allL)
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
      if (streamText.includes('<RP_BREAK>')) { /* TEST */
      setChat(prevChat => [...prevChat, { role: 'assistant', content: "", name:chatMeta.currentModel }]); /* TEST */
    }
    
    setChat((prevChat) => {
      if (streamText == '<RP_BREAK>') {
        return [...prevChat]
      }  
      if (prevChat.length === 0) {
        return [userMessage, { role: 'assistant', content: streamText, name:chatMeta.currentModel }];
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
        <input className='rp-option-input' value={layer.rpOptions.name} onChange={(e)=>handleLayerOption(index, e, 'name')}/>
      </div>
      <div className='rp-options-cont'>
        <label>Role</label>
        <input className='rp-option-input' value={layer.rpOptions.role} onChange={(e)=>handleLayerOption(index, e, 'role')}/>
      </div>
    </div>

    <div className='rp-option-row'>
      <div className='rp-options-cont'>
        <label>Behavior</label>
        <input className='rp-option-input' value={layer.rpOptions.behavior} onChange={(e)=>handleLayerOption(index, e, 'behavior')}/>
      </div>

    </div>


  </div>
)}



    const modalBody = () => {
        return (
        <div>
            <div className='pipeline-title-cont'>
              <input ref={rpInputRef} className='pipeline-body-title' onChange={(e)=>handleRPTitleChange(e)} value={rpMeta.name}/>
              <button className={`pipeline-fav`} onClick={()=>handleFav()}>Save Play</button>
              <button className='pipeline-new' onClick={()=>handleNewChat()}>New Play</button>
            </div>
            <div className='pipeline-body'>
                {layers.map((layer, index)=>{
                    return (
                            <ModalLayers key={index} layer={layer} layers={layers} setLayers={setLayers} index={index} optionalTextField={modalOptionalText}/>
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
              {savedPlays.map((splay, index)=>{
                return <>
                  <div key={splay._id} onClick={()=>handleChangePlay(splay._id)} className='saved-pipelines'>{splay.name}</div>
                  {editSaved?  
                  <div onClick={()=>handleDeleteSaved(index)} className='pipeline-saved-delete'>
                    X
                  </div> : ''}
                </>
              })}
        
            </div>
          </>
        )
      }


      /* const modalLeftBody = () => {
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
} */


    var rpStreamBodyExtra = {
      layers: layers,
      rpMeta: rpMeta
    }

  const chatProps = {
      chatEndpoints: RPAPIEndpoints,
      titleComp: chatTitle,
      chat: chat,
      setChat: setChat,
      resProcess: rpfetch,
      chatInputBox: chatInputBox,
      streamProcessing: chatTextStream,
      streamBodyExtras:rpStreamBodyExtra
    }

    const ModalProps = {
    modalBody: modalBody,
    setIsModal:setIsModal,
    modalLeftBody:modalLeftBody,
    modalExternalControlPanel: modalExBtnPanel(handleSubmitRp, 'Update Play'),
    modalLeftExtras: {modalLeftBtnTxt:'Saved Plays', modalLeftTitle:'Saved'}
    }

  return (
    <>
        <ChatPage {...chatProps}/>
        {isModal? <Modal {...ModalProps}/> : ''}
    </>
  )
}
