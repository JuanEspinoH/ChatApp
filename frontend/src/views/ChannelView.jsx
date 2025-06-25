import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import useGlobalStore from '../ContextStore/Store'

import MessagesView from '../components/MessagesView'
import MessagesKeyboard from '../components/MessagesKeyboard'
const ChannelView = () => {
  const {
    store,
    actions: { socketsEvent },
  } = useGlobalStore()
  // const isLoading = useRef(false)
  // const isTyping = useRef(false)
  const { channelId } = useParams()
  const res = socketsEvent.selectedChannel()
  const [messagesList, setMessagesList] = useState([])

  useEffect(() => {
    if (res?.isLoaded === true) {
      setMessagesList(res.messages)
    }
  }, [res])
  useEffect(() => {
    console.log('cambio channels', Date.now())
  }, [store.channels.messages])

  useEffect(() => {
    socketsEvent.selectChannel(channelId)
  }, [channelId, socketsEvent])

  if (res?.isLoaded !== true && messagesList.length === 0) {
    return <div>Cargando...</div>
  }

  return (
    <div
      style={{
        width: '80%',
        // height: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'baseline',
        backgroundColor: 'aqua',
      }}
    >
      {messagesList.length > 0 && <MessagesView messages={messagesList} />}
      <MessagesKeyboard />
    </div>
  )
}

export default ChannelView
