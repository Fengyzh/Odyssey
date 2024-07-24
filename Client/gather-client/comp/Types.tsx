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
  }

export interface ChatMetaData {
    title:string;
    dateCreate:string;
    dataChanged:string;
    currentModel:string;
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

