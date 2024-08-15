'use client'
import React, { ChangeEvent, FormEvent, ReactElement, useEffect, useRef, useState } from 'react'
import './ChatsBar.css'
import { useSidebar } from '@/app/context/sidebarContext';
import { usePathname, useRouter  } from 'next/navigation'
import axios from 'axios';
import { ChatSnippets, FileSnippets } from './Types';
import FileSnippetsComp from './FileSnippetsComp';
import Link from "next/link";

export default function ChatsBar() {

/* 
TODO:
  - Init the sidebar will grab all the convo belong to the current mode (exp: chat)
  - List all of them
  - When the user clicks on it, it will set the currentChat in the context to that so it can be displayed
    - the current chat will just be an id, and the chatpgae or whatever mode page will have to make a request to
    get that chat convo so that we are not getting every chat all at once to clog up memory

*/
    const pathname = usePathname()

    const { isSidebarToggled, toggleSidebar, setCurrentChat, currentChat, fetchChatSnippets, chats, tab, setTab, fetchCurrentChatFiles, curFiles } = useSidebar();
    const [allFiles, setAllFiles] = useState<FileSnippets[] | []>([])
    const [bufferFiles, setBufferFiles] = useState<FileList | [] | File[]>([]);
    const [addBufferFiles, setAddBufferFiles] = useState<[] | FileSnippets[]>([]);
    const [fileLoading, setFileLoading] = useState<boolean>(false);
    const [currentSelected, setCurrentSelected] = useState<number | null>(null);

    const [modeSelectPanel, setModeSelectPanel] = useState<boolean | null>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter()

    useEffect(() => {
        setCurrentChat("")
        fetchChatSnippets()
        fetchAllFiles()
    }, [])


    useEffect(() => {
        fetchCurrentChatFiles()

    }, [currentChat])
    


    useEffect(() => {
        let bar = document.getElementsByClassName('ChatsBar-cont')[0] as HTMLElement
        console.log(11111, isSidebarToggled)
        if (!isSidebarToggled) {
            bar.style.transform = 'translateX(-200%)'
        } else {
            bar.style.transform = 'translateX(0)'
        }
    

    }, [isSidebarToggled])
    

    useEffect(() => {

        /* For when chaning chat modes */
    }, [])


    const fetchAllFiles = () => {
        axios.get("http://localhost:5000/api/files/all").then((res)=>{
          setAllFiles(res.data)
          //console.log(res.data)
        })
    
      }



    const handleChatSelect = (chatId:string, index:number) => {
        setCurrentSelected(index)
        setCurrentChat(chatId)
    }

    const handleNewChat = () => {
        setCurrentChat("")        
    }

    const  handleDeleteFile = async (fid:string) => {
        let newFileList = curFiles.filter(file => file._id !== fid);


        await axios.post('http://localhost:5000/api/files/' + currentChat, {files:newFileList})
        fetchCurrentChatFiles()
    }

    const handleDeleteDoc = async(fid:string) => {
        await axios.post('http://localhost:5000/api/files/all', {fid:fid})
        fetchAllFiles()
    }

    const handleBufferDelete = (index:number, buffer:boolean) => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        let t

        if (buffer) {
            t = Array.from(bufferFiles)
            t.splice(index, 1);
            setBufferFiles([...t]) 
        } else {
            t = addBufferFiles
            t.splice(index, 1);
            setAddBufferFiles([...t])
        }
      }



    const handleConfirmAdd = async (e: FormEvent) => {
        e.preventDefault()
        let createdEntryId;
        setFileLoading(true)

        if (!currentChat) {
          const createResponse = await axios.get("http://localhost:5000/api/newchat")
          const entryId = createResponse.data.id
          setCurrentChat(entryId)
          createdEntryId = entryId
          fetchChatSnippets()
        }

        const formData = new FormData()
        for (let i = 0; i < bufferFiles.length; i++) {
          console.log(bufferFiles[i])
          formData.append('files', bufferFiles[i])
        }

        for (let j = 0; j < addBufferFiles.length; j++) {
            formData.append('addToCur', addBufferFiles[j]._id)
          }
      
        formData.append('chatID', currentChat? currentChat : createdEntryId)

        const response = await axios.post('http://localhost:5000/api/files', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then(()=>{
            fetchCurrentChatFiles()
            fetchAllFiles()
            setFileLoading(false)
        })
        setBufferFiles([])
        setAddBufferFiles([])

    }


    const handleFileChange = (e:ChangeEvent<HTMLInputElement>) => {

          if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            console.log(newFiles)
            setBufferFiles((prevFiles) => [...prevFiles, ...newFiles]);
            //console.log(e.target.files)
          }
       }

    
    const handleAddCur = (fid:string, fname:string) => {
        setAddBufferFiles((prev) => [...prev, {_id:fid, name:fname}])
    }

    const handleModeSelect = () => {
        setModeSelectPanel((prev)=>!prev)
    }

    const handleRedirect = (uri:string) => {
        setCurrentChat("")
        router.push(uri)
    }


    const chatHistoryComp =  
    (<div className='chat-history-cont'>
    {chats.map((chat:ChatSnippets, index)=>{
        return (
        <div className='nav-chat-cont'>
            <div onClick={()=>handleChatSelect(chat._id, index)} key={index} className={`nav-chat-titles ${currentChat === chat._id? 'selected' : ''}`}>{chat.meta.title} 
            </div>
        </div>)
    })}
    </div>)

    const filesComp = (
    <>
        <div className='file-section-cont'>
            <h2>All Files</h2>
 

        </div>
        <div className='nav-files-cont'>
            {allFiles && allFiles.map((f, i) => {
                    return <div className='file-snippet-cont' key={i}>
                                <div className='file-snippet'>
                                    <p>{f.name}</p>
                                    <div className='file-control-cont'>
                                        <h4 className='file-add-snippet' onClick={()=>handleAddCur(f._id, f.name)}>+</h4>
                                        <h4 onClick={()=>handleDeleteDoc(f._id)} className='file-delete-snippet'>X</h4>
                                    </div>
                                </div>
                        </div>
                })}
        </div>


        <div className='file-section-cont'>
            <h2>Files in Chat</h2>
            {fileLoading? <h2>Processing files</h2> : ""}
        </div>


        <div className='nav-files-cont'>
            
                {addBufferFiles.map((file, index) => {
                    return  <FileSnippetsComp file={file} index={index} delfunc={handleBufferDelete} type={'add'}/>
                })}

            {Array.from(bufferFiles).map((file, index)=>{
              return (
                <div className='file-snippet-cont' key={index}>

                    <div className='file-snippet file-snippet-add'>
                        <p>{file.name}</p>
                        <h4 onClick={()=>handleBufferDelete(index, true)} className='file-delete-snippet'>X</h4>
                    </div>
                </div>
              )
            })}


            {curFiles && curFiles.map((f, i) => {
                return <div className='file-snippet-cont' key={i}>
                            <div className='file-snippet'>
                                <p>{f.name}</p>
                                <h4 onClick={()=>handleDeleteFile(f._id)} className='file-delete-snippet'>X</h4>
                            </div>
                    </div>
            })}
        </div>
 
    </>
    )


  return (
        <div className='ChatsBar-cont'>
            <div className='bar-top'>
                <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>
                <div className='mode-toggle-cont'>
                    <div className='mode-toggle-title' onClick={()=>handleModeSelect()}>
                        <h2 className='mode-toggle'>{pathname?.endsWith('Chat')? 'Chat Page' : pathname?.endsWith('Pipeline')? 'Pipeline' : ''}</h2>
                    </div>
                    {modeSelectPanel? <div className='mode-toggle-select'>
                        <li onClick={()=>handleRedirect('/Chat')} className='mode-select-items'>Chat</li>
                        <li onClick={()=>handleRedirect('/Pipeline')} className='mode-select-items'>Pipeline</li>
                        <li onClick={()=>handleRedirect('/Roleplay')} className='mode-select-items'>Role Play</li>
                    </div> : ""}
                    
                </div>
            </div>




            <div className='nav-tab-comp-cont'>
                {!tab? filesComp : chatHistoryComp}
            </div>



            {!tab?
            
            <form className='nav-file-form' onSubmit={(e)=>handleConfirmAdd(e)}>
                <input type="file" id="file-upload" multiple onChange={handleFileChange} ref={fileInputRef}></input>
                <label  className="file-upload" htmlFor="file-upload"> F + </label>
                <button className='file-send' type="submit">{'F >'}</button>
            </form> 
            : 
            <div className='nav-new-chat-cont'>
                <h3 onClick={()=>handleNewChat()} className='nav-new-chat'>New Chat</h3>
            </div>}
            


            
            <div onClick={()=> setTab(!tab)} className='nav-bottom-btn-group'>
                {!tab? <h3>Chat</h3> : <h3>Files</h3>}
            </div>

            <div>
                <button onClick={()=>{console.log(pathname)}}>PATH</button>
                <button onClick={()=>{console.log(currentChat)}}>Current Chat</button>
            </div>
        </div>
  )
}
