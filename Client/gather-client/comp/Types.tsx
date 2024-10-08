export interface ChatResponse {
    role: string;
    content: any;
    name?:string;
}

export interface FileSnippets {
    _id:string;
    name:string;
  }

export interface ChatSnippets {
    _id:string;
    title:string;
    meta: ChatMetaData;
  }

export interface ChatMetaData {
    title:string;
    dateCreate:string;
    dataChanged:string;
    currentModel:string;
    modelOptions:IModelOptions;
    isWeb:boolean;
    isDoc:boolean;
}

export interface IOllamaListDetails {
  families: string[];
  family:string;
  format:string;
  parameter_size:string;
  parent_mode:string;
  quantization_level:string;
}


export interface IOllamaList {
  details:IOllamaListDetails;
  digest:string;
  model:string;
  modified_at:string;
  name:string;
  size:string;
}

export interface IModelOptions {
  top_k: string;
  top_p: string;
  temperature: string;
  systemPrompt: string;
}

export interface IChatEndpoints {
  getCurrentChat: string;
  newChat: string;
  stream: string;
}

export interface IChatInfo {
  _id:string;
  docs: string[];
  history:ChatResponse[];
  meta: ChatMetaData;
}

export interface IPipelineLayer {
  model: string;
  modelOptions?: IModelOptions;
  isWeb:boolean;
  isDoc:boolean;
}
/* IPipelineMeta */
export interface IModalMeta {
  id:string;
  name:string;
  isFav:boolean;
}


export interface ISavedPipelineSnippet {
  _id:string;
  name:string;
}

export interface ISavedPipeline {
  _id:string;
  type:string;
  name:string;
  settings: IPipelineLayer[]
}

export interface IRPLayerOptions {
  name:string;
  role:string;
  behavior:string;
  extra:string;
}

export interface IRPLayer extends IPipelineLayer {
  rpOptions: IRPLayerOptions
}

export interface IRPWorld {
  userName:string;
  setting:string;
  intro:string
}


/* {model: 'llama3:instruct', modelOptions: DEFAULT_MODEL_OPTIONS, rp_options:DEFAULT_RP_LAYER_OPTIONS, isWeb:false, isDoc:false, isWorld:false} */