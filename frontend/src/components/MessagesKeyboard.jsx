import React, { useState, useEffect } from 'react'
import useGlobalStore from '../ContextStore/Store'
import TextareaAutosize from '@mui/material/TextareaAutosize'

const MessagesKeyboard = () => {
  const {
    store,
    actions: { socketsEvent, storeFunc },
  } = useGlobalStore()
  // const [isTyping, setIsTyping] = useState(false)
  const [messageInputChannel, setMessageInputChannel] = useState(
    socketsEvent.selectedChannel().messageInput
  )

  useEffect(() => {
    setMessageInputChannel(socketsEvent.selectedChannel().messageInput)
  }, [store.channels, socketsEvent])

  const handleChange = (e) => {
    let value = e.target.value
    storeFunc.modifyChannels((prev) => {
      const newMap = new Map(prev)
      const prevChannelInfo = socketsEvent.selectedChannel()
      newMap.set(store.selectedChannelId, {
        ...prevChannelInfo,
        messageInput: value,
      })
      return newMap
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const content = socketsEvent.selectedChannel().messageInput
    if (!content) {
      return
    }
    try {
      await socketsEvent.sendMessage(content)
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: '100%',
        height: '20vh',
      }}
    >
      <TextareaAutosize
        value={messageInputChannel}
        onChange={handleChange}
        maxRows={5}
        style={{
          width: '100%',
          height: '20%',
        }}
      />
      <button type="submit">Send</button>
    </form>
  )
}

export default MessagesKeyboard
