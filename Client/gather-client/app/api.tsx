import { ChatMetaData, ChatResponse, IChatEndpoints } from "@/comp/Types"
import axios from "axios"


type pathName = string | null

export const getCurrentChat = async (currentChat:string, pathname:pathName) => {
    return axios.get("http://localhost:5000/api/chat/" + currentChat + `?type=${pathname?.replace('/','')}`)
}

export const getChatTitleSummary = async (createdEntryId:string, curContext:ChatResponse[], pathname:pathName, chatMeta:ChatMetaData) => {
    return axios.post("http://localhost:5000/api/chat/summary" + `?type=${pathname?.replace('/', '')}`, {
        id:createdEntryId,
        context:curContext,
        meta:chatMeta
      })
}

export const getLLMList = async () => {
    return axios.get("http://localhost:5000/api/LLM/list")
}


export const getURLbyPathName = (pathName:string | null) => {
    if (!pathName) {
        return ""
    }
    if (pathName == '/Chat') {
        return "http://localhost:5000/api/chat"
    } 
    else if (pathName == "/Pipeline") {
        return "http://localhost:5000/api/pipelines"
    }
    else if (pathName == "/Roleplay") {
        return "http://localhost:5000/api/rp"
    } else {
        return ""
    }
}



export const chatAPIEndpoints:IChatEndpoints = {getCurrentChat:'http://localhost:5000/api/chat/', newChat:'http://localhost:5000/api/chat/create', stream:'http://localhost:5000/api/chat/stream'}

export const pipelineARIEndpoints:IChatEndpoints = {getCurrentChat:'http://localhost:5000/api/chat/', newChat:'http://localhost:5000/api/chat/create', stream:'http://localhost:5000/api/pipelines/stream'}

export const RPAPIEndpoints: IChatEndpoints = {getCurrentChat:'http://localhost:5000/api/chat/', newChat:'http://localhost:5000/api/chat/create', stream:'http://localhost:5000/api/rp/stream'}