'use client'
import React, { useEffect, useState } from 'react'
import './ChatsBar.css'
import { useSidebar } from '@/app/context/sidebarContext';
import { usePathname } from 'next/navigation'
import axios from 'axios';
import { ChatSnippets, FileSnippets } from './Types';

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
    const [bufferFiles, setBufferFiles] = useState<string[] | [] >([]);


    useEffect(() => {
        fetchChatSnippets()
        fetchAllFiles()

    }, [])


    useEffect(() => {
        fetchCurrentChatFiles()

    }, [currentChat])
    


    useEffect(() => {
        let bar = document.getElementsByClassName('ChatsBar-cont')[0] as HTMLElement
        if (!isSidebarToggled) {
            bar.style.width = '0'
        } else {
            bar.style.width = '12%'
        }
    

    }, [isSidebarToggled])
    

    useEffect(() => {

        /* For when chaning chat modes */
    }, [])


    const fetchAllFiles = () => {
        axios.get("http://localhost:5000/api/files").then((res)=>{
          setAllFiles(res.data)
          //console.log(res.data)
        })
    
      }



    const handleChatSelect = (chatId:string) => {
        setCurrentChat(chatId)
    }

    const handleNewChat = () => {
        setCurrentChat("")
    }

    // Later change to update files to support both delete and add
    const  handleDeleteFile = async (fid:string) => {
        let newFileList = curFiles.filter(file => file._id !== fid);


        await axios.post('http://localhost:5000/api/files/' + currentChat, {files:newFileList})
        fetchCurrentChatFiles()
        
    }

    const handleAddToCur = (fid:string) => {
        setBufferFiles((prevFiles) => [...prevFiles, fid]);
          
    }


    const handleConfirmAdd = async () => {
        let createdEntryId;


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
      
        formData.append('chatID', currentChat? currentChat : createdEntryId)

        const response = await axios.post('http://localhost:5000/api/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        setBufferFiles([])
    }
    


    const chatHistoryComp =  
    (<>
    {chats.map((chat:ChatSnippets, index)=>{
        return <div onClick={()=>handleChatSelect(chat._id)} key={index} className='nav-chat-titles'>{chat.title}</div>
    })}
</>)

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
                                        <h4 onClick={()=>handleAddToCur(f._id)} className='file-add-snippet'>+</h4>
                                        <h4 onClick={()=>handleDeleteFile(f._id)} className='file-delete-snippet'>X</h4>
                                    </div>
                                </div>
                        </div>
                })}
        </div>


        <div className='file-section-cont'>
            <h2>Files in Chat</h2>
        </div>


        <div className='nav-files-cont'>
            
            {/* TODO: Add File Buffer UI */}


            {curFiles && curFiles.map((f, i) => {
                return <div className='file-snippet-cont' key={i}>
                            <div className='file-snippet'>
                                <p>{f.name}</p>
                                <h4 onClick={()=>handleDeleteFile(f._id)} className='file-delete-snippet'>X</h4>
                            </div>
                    </div>
            })}
        </div>
        <button onClick={()=>handleConfirmAdd()}>Confirm Add</button>
    </>
    )


  return (
        <div className='ChatsBar-cont'>
            <div className='bar-top'>
                <h2 className='sidebar-toggle' onClick={()=>toggleSidebar()}>O</h2>
                <h2 className='mode-toggle'>Chat Page</h2>
            </div>




            <div className='nav-tab-comp-cont'>
                {!tab? filesComp : chatHistoryComp}
            </div>
            
            <div onClick={()=> setTab(!tab)} className='nav-bottom-btn-group'>
                {!tab? <h3>Chat</h3> : <h3>Files</h3>}
            </div>

            <div>
                <button onClick={()=>{console.log(pathname)}}>PATH</button>
                <button onClick={()=>{handleNewChat()}}>Start a new Chat</button>
            </div>
        </div>
  )
}
