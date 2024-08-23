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


export const chatAPIEndpoints:IChatEndpoints = {getCurrentChat:'http://localhost:5000/api/chat/', newChat:'http://localhost:5000/api/newchat', stream:'http://localhost:5000/api/stream', delete:'http://localhost:5000/api/chat/delete/'}

export const pipelineARIEndpoints:IChatEndpoints = {getCurrentChat:'http://localhost:5000/api/chat/', newChat:'http://localhost:5000/api/newchat', stream:'http://localhost:5000/api/pipelines/stream', delete:'http://localhost:5000/api/chat/delete/'}

