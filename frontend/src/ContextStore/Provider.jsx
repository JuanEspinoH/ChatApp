import { useState, useEffect } from 'react'
import { StoreContext } from './Store'
import { socket } from '../utils/socket'

const insertAtRightOffset = (messages, message) => {
  message.mid = message.id ? parseInt(message.id, 10) : Infinity

  for (let i = 0; i < messages.length; i++) {
    if (messages[i].id === message.id) {
      return false
    }
    if (messages[i].mid > message.mid) {
      messages.splice(i, 0, message)
      return true
    }
  }

  messages.push(message)
  return true
}

export function ProviderContextComponent({ children }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentUser, setCurrentUser] = useState({})
  const [channels, setChannels] = useState(new Map())
  const [users, setUsers] = useState(new Map())
  const [pendingUsers, setPendingUsers] = useState(new Map())
  const [selectedChannelId, setSelectedChannelId] = useState(undefined)
  const [showJoinOrCreateChannelModel, setShowJoinOrCreateChannelModel] =
    useState(false)
  const [showSearchUserModal, setShowSearchUserModal] = useState(false)
  const [conectionState, setConectionState] = useState(socket.connected)
  // STORE MODIFICATION FUNCTIONS
  const modifyCurrentUser = (data) => {
    return setCurrentUser(data)
  }
  const modifyConectionState = (state) => {
    return setConectionState(state)
  }
  const modifyIsInitialized = (state) => {
    return setIsInitialized(state)
  }

  // FETCH FUNCTIONS
  const login = async (body) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Error en la respuesta del servidor`)
      }

      const data = await response.json()

      return data
    } catch (error) {
      console.log(error)
      throw error
    }
  }
  const logout = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Error en la respuesta del servidor`)
      }

      //   const data = await response.json()

      return
    } catch (error) {
      console.log(error)
      throw error
    }
  }
  const self = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/self', {
        method: 'GET',
        credentials: 'include',
      })
      // console.log(response)

      if (!response.ok) {
        return response
      }

      const data = await response.json()

      return data
    } catch (error) {
      console.log('Error en fetch:', error)
      throw error
    }
  }

  // SOCKETS EVENTS

  const init = () => {
    socket.connect()
  }

  const selectedChannel = () => {
    return channels.get(selectedChannelId)
  }
  const isChannelIsSelected = () => {
    return (channelId) => selectedChannelId === channelId
  }

  const selectChannel = (channelId) => {
    setSelectedChannelId(channelId)

    // await loadMessagesForSelectedChannel()
    // await ackLastMessageIfNecessary()
  }

  const bindActions = () => {
    if (import.meta.env.VITE_NODE_ENV !== 'production') {
      socket.onAny((...args) => {
        console.log('incoming', args)
      })

      socket.onAnyOutgoing((...args) => {
        console.log('outgoing', args)
      })
    }

    socket.on('connect', async () => {
      if (isInitialized) {
        const res = await socket.emitWithAck('channel:list', {
          size: 100,
        })

        if (res.status === 'OK') {
          res.data.forEach((channel) => addChannel(channel))
        }

        await loadMessagesForSelectedChannel('forward')
      }
    })

    socket.on('channel:created', () => console.log('channel:cerated'))
    socket.on('channel:joined', () => console.log('channel:joined'))
    socket.on('message:sent', () => console.log('message:sent'))
    socket.on('user:connected', () => console.log('user:connected'))
    socket.on('user:disconnected', () => console.log('user:disconnected'))
    socket.on('message:typing', () => console.log('message:typing'))
  }

  const addChannel = (channel) => {
    setChannels((channels) => {
      const newChannels = new Map(channels)

      if (newChannels.has(channel.id)) {
        const existingChannel = newChannels.get(channel.id)

        Object.keys(channel).forEach((key) => {
          existingChannel[key] = channel[key]
        })

        existingChannel.isLoaded = false
        existingChannel.typingUsers.clear()
      } else {
        const newChannel = {
          ...channel,
          messageInput: '',
          messages: [],
          hasMore: false,
          isLoaded: false,
          typingUsers: new Map(),
          unreadCount: 0,
        }

        newChannels.set(channel.id, newChannel)
      }

      return newChannels
    })
  }

  const ackLastMessageIfNecessary = async () => {
    await socket.emitWithAck('message:ack', {
      channelId: this.selectedChannel.id,
      messageId: this.selectedChannel.messages.at(-1).id,
    })
  }

  const addMessage = (message, countAsUnread = false) => {
    const channel = channels.get(message.channelId)

    if (!channel) {
      return
    }
    const inserted = insertAtRightOffset(channel.messages, message)

    if (inserted && countAsUnread && message.from !== this.currentUser.id) {
      channel.unreadCount++
      ackLastMessageIfNecessary()
    }
  }

  const loadMessagesForSelectedChannel = async (
    order = 'backward',
    force = false
  ) => {
    const channel = selectedChannel()

    if (!channel || (channel.isLoaded && !force)) {
      return
    }
    const query = {
      size: 20,
      channelId: this.selectedChannelId,
    }

    if (order === 'backward') {
      query.orderBy = 'id:desc'
      if (channel.messages.length) {
        query.after = channel.messages[0].id
      }
    } else {
      query.orderBy = 'id:asc'
      if (channel.messages.length) {
        query.after = channel.messages[channel.messages.length - 1].id
      }
    }

    const res = await socket.emitWithAck('message:list', query)
    console.log(res)

    if (res.status !== 'OK') {
      return
    }
  }

  const store = {
    store: { currentUser, isInitialized, channels, selectedChannelId },
    actions: {
      storeFunc: {
        modifyConectionState,
        modifyCurrentUser,
        modifyIsInitialized,
      },
      fetchFunc: {
        login,
        logout,
        self,
      },
      socketsEvent: {
        bindActions,
        init,
      },
    },
  }
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
