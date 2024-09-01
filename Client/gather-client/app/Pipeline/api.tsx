import { IPipelineLayer, IModalMeta } from "@/comp/Types"
import axios from "axios"

export const updatePipeline = async (chatId:string, pipeline:IPipelineLayer[], pipelineMeta:IModalMeta) => {
    return axios.post("http://localhost:5000/api/pipelines/" + chatId, {
        pipeline:pipeline,
        pipelineMeta: pipelineMeta
      })
}

export const deleteSavedPipeline = async (pipelineId:string) => {
    return axios.delete("http://localhost:5000/api/pipelines/saved" + pipelineId)
}


export const favouritePipeline = async (pipeline:IPipelineLayer[], pipelineMeta:IModalMeta) => {
    return axios.post("http://localhost:5000/api/pipelines/saved", {
        pipeline:pipeline,
        name:pipelineMeta.name
      })
}

export const getSavedPipelines = () => {
    return axios.get("http://localhost:5000/api/pipelines/saved")
}

export const getSavedPipelineById = (pipelineId:string) => {
    return axios.get("http://localhost:5000/api/pipelines/saved/" + pipelineId)
}