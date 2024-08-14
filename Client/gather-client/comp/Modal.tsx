import React, { SetStateAction, Dispatch, ReactNode } from 'react'
import './Modal.css'

interface IModalProp {
    modalBody: () => ReactNode;
    setIsModal: Dispatch<SetStateAction<boolean>>;
    modalExternalControlPanel: () => ReactNode;
    modalTitle: string;
    modelLeftBody?: () => ReactNode;
}





export const Modal:React.FC<IModalProp> = ({modalBody, setIsModal, modalExternalControlPanel, modalTitle, modelLeftBody}) => {
  return (
    <div className='modal-cont' onClick={()=>(setIsModal(prev=>!prev))}>

      {modelLeftBody? 
      <div className='modal-left-panel'>
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

            {modalExternalControlPanel()}
        </div>


    </div>
  )
}
