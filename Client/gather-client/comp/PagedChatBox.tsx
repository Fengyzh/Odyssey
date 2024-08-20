import React from 'react'

interface IPagedChatBox {

}

const PagedChatBox = ({item}) => {
  return (
    <div>
        {item.map((chatBoxInfo, index)=> {
            return <div>
                        <span>{chatBoxInfo.role}</span>
                        <span>{chatBoxInfo.content}</span>
                    </div>
        })}

    </div>
  )
}

export default PagedChatBox
