import React, { SetStateAction, Dispatch, ReactNode } from 'react'
import './Modal.css'

interface IModalProp {
    modalBody: () => ReactNode;
    setIsModal: Dispatch<SetStateAction<boolean>>;
}





export const Modal:React.FC<IModalProp> = ({modalBody, setIsModal}) => {
  return (
    <div className='modal-cont' onClick={()=>(setIsModal(prev=>!prev))}>
        <div className='modal-body' onClick={(e)=>{e.stopPropagation()}}>
            <div className='modal-func'>
                <h2>Pipeline Setup</h2>
                <div className='test'>hiiii</div>

                {modalBody()}
            </div>




        </div>


    </div>
  )
}
