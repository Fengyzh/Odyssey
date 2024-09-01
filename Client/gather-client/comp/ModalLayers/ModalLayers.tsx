'use client'
import { useSidebar } from '@/app/context/sidebarContext';
import React, { Dispatch, ReactNode, SetStateAction, useState } from 'react'
import { IModelOptions } from '../Types';

interface IModalLayers {
    layer:any
    layers: any[]
    setLayers: Dispatch<SetStateAction<any>>
    index:number
    optionalTextField?: (index:number, layer:any) => ReactNode
}





export const ModalLayers:React.FC<IModalLayers> = ({layer, layers, setLayers, index, optionalTextField}) => {

const [isModelSelect, setIsModelSelect] = useState<boolean[]>([false])


const { modelList } = useSidebar();

const ToggleLayerModelPanel = (index:number) => {
  setIsModelSelect((prev)=>{
    let temp = [...prev]
    temp[index] = !temp[index]
    return temp
  })
 }

const handleModelSelect = (index:number, modelName:string) => {
const newLayer = [...layers]
newLayer[index].model = modelName
setLayers(newLayer)
}
  
const handleRAGOption = (index:number, isWeb:boolean) => {
    let tempLayer = [...layers]
    
    if (isWeb) {
      tempLayer[index].isWeb = !tempLayer[index].isWeb
    } else {
      tempLayer[index].isDoc = !tempLayer[index].isDoc
    }
    setLayers(tempLayer)
  
  }


  const handleLayerOptions = (index:number, options:keyof IModelOptions, e:React.ChangeEvent<HTMLInputElement>) => {
    let tempLayer = [...layers]
    let tempOptions = tempLayer[index]
    if (tempOptions.modelOptions) {
      tempOptions.modelOptions[options] = e.target.value
      setLayers(tempLayer)
    }    
  }
  
  const handleSysPrompt = (e:React.ChangeEvent<HTMLTextAreaElement>, index:number) => {
    let temp = [...layers]
    temp[index].modelOptions!.systemPrompt = e.target.value
    setLayers(temp)
   }
  
  
   const handleLayerDelete = (index:number) => {
    let temp = [...layers]
    temp.splice(index,1)
    setLayers(temp)
  }
  
  const swapElement = (arr:any[], el1:any, el2:any) => {
    let tempArr = [...arr]
    let temp = tempArr[el1]
    tempArr[el1] = tempArr[el2]
    tempArr[el2] = temp
    return tempArr
   }
  
  const handleLayerOrdering = (isUp:boolean, index:number) => {
    if (isUp) {
      setLayers(swapElement(layers, index, index-1))
    } else {
      setLayers(swapElement(layers, index, index+1))
    }
  
   }

  return (
    <div className='pipeline-layers'>
      <div>

        <div  className='pipeline-model-options'>

            <div className='layer-title'>
              <div className='pipeline-model-select' > 
                {layer.model} 
              </div>
              <div className='layer-options-btn' onClick={()=>ToggleLayerModelPanel(index)}> Options</div>
            </div>

            <div className={`layer-model-select-cont ${isModelSelect[index]? `model-option-toggle` : ``}`}>
              <div className='layer-model-select'>
              {modelList.map((model, modelindex) => {
                return <h4 key={modelindex} className='layer-model-items' onClick={()=>handleModelSelect(index, model.name)}>{model.name} {model.details.parameter_size}</h4>
                })}
              </div>
       

              <div className='layer-model-option-cont'>
                <div className='layer-model-options'>
                  <button className={`layer-model-option-toggle ${layers[index].isWeb? `layer-model-option-open` : ``}`} onClick={()=>handleRAGOption(index, true)}>Web</button>
                  <button className={`layer-model-option-toggle ${layers[index].isDoc? `layer-model-option-open` : ``}`} onClick={()=>handleRAGOption(index, false)}>Document</button>
                </div>

                <div className='layer-model-options'>
                    <p>Temperature</p>
                    <input className='layer-option-inputs' onChange={(e)=>handleLayerOptions(index, 'temperature', e)} value={layers[index].modelOptions?.temperature}/>
                  </div>
                  <div className='layer-model-options'>
                    <p>Top K</p>
                    <input className='layer-option-inputs' onChange={(e)=>handleLayerOptions(index, 'top_k', e)} value={layers[index].modelOptions?.top_k}/>
                  </div>
                  <div className='layer-model-options'>
                    <p>Top P</p>
                    <input className='layer-option-inputs' onChange={(e)=>handleLayerOptions(index, 'top_p', e)} value={layers[index].modelOptions?.top_p}/>
                  </div>
              </div>
            </div>

        </div>

        
       {optionalTextField? optionalTextField(index,layer): ''}
        <div>
          <textarea className='pipeline-sysprompt-text' onChange={(e)=>handleSysPrompt(e, index)} value={layer.modelOptions?.systemPrompt}/>
        </div>

      </div>
      <div className='pipeline-delete-cont'>
        <div className='pipeline-layers-delete'>
          <button onClick={()=>handleLayerDelete(index)} className='pipeline-layers-btn pipeline-layers-btn-delete'>X</button>
        </div>
      </div>
      <div className='pipeline-layers-control'>

        {index != 0? 
        <button onClick={()=>handleLayerOrdering(true, index)} className='pipeline-layers-btn'>U</button> : ""}

        {index != layers.length-1? 
        <button onClick={()=>handleLayerOrdering(false, index)} className='pipeline-layers-btn'>D</button>
                : ""}

      </div>
    </div>
  )
}
