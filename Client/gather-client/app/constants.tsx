import { IModelOptions, ChatMetaData, IPipelineLayer, IRPLayer, IRPLayerOptions, IModalMeta } from '@/comp/Types';


type ConstantsReturnType = {
    DEFAULT_MODEL_OPTIONS: IModelOptions;
    DEFAULT_CHAT_METADATA: ChatMetaData;
    DEFAULT_LAYER_DATA: IPipelineLayer;
    DEFAULT_RP_LAYER_OPTIONS: IRPLayerOptions
    DEFAULT_RP_LAYER: IRPLayer
  };

export const constants = ():ConstantsReturnType => {
    const DEFAULT_MODEL_OPTIONS= {top_k:"50", top_p:"0.9", temperature: "0.7", systemPrompt:"You are a helpful assistant"}
    const DEFAULT_CHAT_METADATA= {title:'New Chat', dateCreate:'', dataChanged:'', currentModel:'llama3:instruct', modelOptions:DEFAULT_MODEL_OPTIONS, isWeb:false, isDoc:false}
    const DEFAULT_LAYER_DATA = {model: 'llama3:instruct', modelOptions: DEFAULT_MODEL_OPTIONS, isWeb:false, isDoc:false}
    const DEFAULT_RP_LAYER_OPTIONS = {name:'Default Character Name', role:'Default Character Role', behavior:'Default Behavior', extra:'Any Extra'}
    const DEFAULT_RP_LAYER = {model: 'llama3:instruct', modelOptions: DEFAULT_MODEL_OPTIONS, rpOptions:DEFAULT_RP_LAYER_OPTIONS, isWeb:false, isDoc:false, isWorld:false}
    return {
        DEFAULT_MODEL_OPTIONS, DEFAULT_CHAT_METADATA, DEFAULT_LAYER_DATA, DEFAULT_RP_LAYER_OPTIONS, DEFAULT_RP_LAYER
    }
}   