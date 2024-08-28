'use client'
import React, { SetStateAction, Dispatch, ReactNode, useState } from 'react'
import './Modal.css'

interface IModalProp {
    modalBody: () => ReactNode;
    setIsModal: Dispatch<SetStateAction<boolean>>;
    modalExternalControlPanel: ReactNode;
    modalLeftBody?: () => ReactNode;
    modalLeftName?: string;
}





export const Modal:React.FC<IModalProp> = ({modalBody, setIsModal, modalExternalControlPanel, modalLeftBody, modalLeftName}) => {
  const [isLeftPanel, setIsLeftPanel] = useState<boolean>(false)
  
  return (
    <div className='modal-cont' onClick={()=>(setIsModal(prev=>!prev))}>

      {modalLeftBody? 
      <div onClick={(e)=>{e.stopPropagation()}} className={`modal-left-panel ${isLeftPanel? "" : `panel-closed`}`}>
          <div className='modal-left-title-cont'>
            <h3 className='modal-left-title'>Saved</h3>
          </div>
          <div className='model-left-func'>
              {modalLeftBody()}
          </div>
        </div> : ""}


        <div className='modal-body' onClick={(e)=>{e.stopPropagation()}}>
            <div className='modal-func'>
                {modalBody()}

            </div>
            <div className='modal-btn-panel'>
            {modalLeftBody? <button onClick={()=>setIsLeftPanel((prev)=>!prev)} className='modal-left-panel-toggle'>{modalLeftName}</button> : ""}
              {modalExternalControlPanel}
            </div>

        </div>


    </div>
  )
}


export const modalExBtnPanel = (handleSubmit:()=>void, btnTxt: string) => {
  return (
    
    <div className='pipeline-ex-btn-panel'>
      <button onClick={()=>handleSubmit()} className='pipeline-submit'>{btnTxt}</button>
    </div>
  )
}


