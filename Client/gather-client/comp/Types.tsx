export interface ChatResponse {
    role: string;
    msg: any;
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
    modelOptions: IModelOptions
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
  systemPrompt?: string;
}

export interface IChatEndpoints {
  getCurrentChat: string;
  newChat: string;
  stream: string;
  delete: string;
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
  
}

