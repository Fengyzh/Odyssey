import { IModelOptions, ChatMetaData } from '@/comp/Types';


type ConstantsReturnType = {
    DEFAULT_MODEL_OPTIONS: IModelOptions;
    DEFAULT_CHAT_METADATA: ChatMetaData;
  };

export const constants = ():ConstantsReturnType => {
    const DEFAULT_MODEL_OPTIONS= {top_k:"40", top_p:"0.9", temperature: "0.8"}
    const DEFAULT_CHAT_METADATA= {title:'Chat Title', dateCreate:'', dataChanged:'', currentModel:'llama3:instruct', modelOptions:DEFAULT_MODEL_OPTIONS}
    return {
        DEFAULT_MODEL_OPTIONS, DEFAULT_CHAT_METADATA
    }
}