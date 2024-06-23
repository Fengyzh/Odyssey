import React from 'react'
import { FileSnippets } from './Types'

interface FileSnippetsIF {
    file: FileSnippets
    index: number
    delfunc: (index:number, buffer:boolean) => void
    type: string
}

export default function FileSnippetsComp({file, index, delfunc, type}:FileSnippetsIF) {
  return (
    <div className='file-snippet-cont' key={index}>
    <div className={`file-snippet ${type === 'add'? 'file-snippet-add' : ''}`}>
        <p>{file.name}</p>
        <h4 onClick={()=>delfunc(index, false)} className='file-delete-snippet'>X</h4>
    </div>
    </div>
  )
}
