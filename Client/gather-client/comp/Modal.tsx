'use client'
import React, { SetStateAction, Dispatch, ReactNode, useState } from 'react'
import './Modal.css'

interface IModalProp {
    modalBody: () => ReactNode;
    setIsModal: Dispatch<SetStateAction<boolean>>;
    modalExternalControlPanel: () => ReactNode;
    modelLeftBody?: () => ReactNode;
}





export const Modal:React.FC<IModalProp> = ({modalBody, setIsModal, modalExternalControlPanel, modelLeftBody}) => {
  const [isLeftPanel, setIsLeftPanel] = useState<boolean>(false)
  
  return (
    <div className='modal-cont' onClick={()=>(setIsModal(prev=>!prev))}>

      {modelLeftBody? 
      <div className={`modal-left-panel ${isLeftPanel? "" : `panel-closed`}`}>
          <div className='modal-left-title-cont'>
            <h3 className='modal-left-title'>Saved</h3>
          </div>
          <div className='model-left-func'>
              {modelLeftBody()}
          </div>
        </div> : ""}


        <div className='modal-body' onClick={(e)=>{e.stopPropagation()}}>
            <div className='modal-func'>
                {modalBody()}

            </div>
            <div className='modal-btn-panel'>
            {modelLeftBody? <button onClick={()=>setIsLeftPanel((prev)=>!prev)} className='modal-left-panel-toggle'>Saved Pipeline</button> : ""}
              {modalExternalControlPanel()}
            </div>

        </div>


    </div>
  )
}
