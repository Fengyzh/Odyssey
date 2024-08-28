import axios from "axios"

// TODO: Backend IMPL
export const getSavedPlayById = (playId:string) => {
    return axios.get("http://localhost:5000/api/rp/saved/" + playId)
}