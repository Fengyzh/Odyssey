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