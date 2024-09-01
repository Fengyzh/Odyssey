import { IModalMeta, IRPLayer } from "@/comp/Types"
import axios from "axios"

// TODO: Backend IMPL
export const getSavedPlays = () => {
    return axios.get("http://localhost:5000/api/rp/saved")
}


export const getSavedPlayById = (playId:string) => {
    return axios.get("http://localhost:5000/api/rp/saved/" + playId)
}

export const updateRP = async (chatId:string, layers:IRPLayer[], rpMeta:IModalMeta) => {
    return axios.post("http://localhost:5000/api/rp/" + chatId, {
        layers:layers,
        rpMeta: rpMeta
      })
}

export const deleteSavedPlays = (playId:string) => {
    return axios.delete("http://localhost:5000/api/rp/saved" + playId)
}

export const favouritePlay = async (layers:IRPLayer[], meta:IModalMeta) => {
    return axios.post("http://localhost:5000/api/pipelines/saved", {
        layers:layers,
        name:meta.name
      })
}