import { IPipelineLayer, IPipelineMeta } from "@/comp/Types"
import axios from "axios"

export const updatePipeline = async (chatId:string, pipeline:IPipelineLayer[], pipelineMeta:IPipelineMeta) => {
    return axios.post("http://localhost:5000/api/pipelines/" + chatId, {
        pipeline:pipeline,
        pipelineMeta: pipelineMeta
      })
}

export const favouritePipeline = async (pipeline:IPipelineLayer[], pipelineMeta:IPipelineMeta) => {
    return axios.post("http://localhost:5000/api/pipelines/saved", {
        pipeline:pipeline,
        name:pipelineMeta.pipelineName
      })
}

export const getSavedPipelines = () => {
    return axios.get("http://localhost:5000/api/pipelines/saved")
}

export const getSavedPipelineById = (pipelineId:string) => {
    return axios.get("http://localhost:5000/api/pipelines/saved/" + pipelineId)
}