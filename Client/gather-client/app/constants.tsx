import { IModelOptions, ChatMetaData, IPipelineLayer } from '@/comp/Types';


type ConstantsReturnType = {
    DEFAULT_MODEL_OPTIONS: IModelOptions;
    DEFAULT_CHAT_METADATA: ChatMetaData;
    DEFAULT_LAYER_DATA: IPipelineLayer;
  };

export const constants = ():ConstantsReturnType => {
    const DEFAULT_MODEL_OPTIONS= {top_k:"40", top_p:"0.9", temperature: "0.8", systemPrompt:"You are a helpful assistant"}
    const DEFAULT_CHAT_METADATA= {title:'Chat Title', dateCreate:'', dataChanged:'', currentModel:'llama3:instruct', modelOptions:DEFAULT_MODEL_OPTIONS, summarizationSteps:0}
    const DEFAULT_LAYER_DATA = {model: 'llama3:instruct', modelOptions: DEFAULT_MODEL_OPTIONS}
    return {
        DEFAULT_MODEL_OPTIONS, DEFAULT_CHAT_METADATA, DEFAULT_LAYER_DATA
    }
}   