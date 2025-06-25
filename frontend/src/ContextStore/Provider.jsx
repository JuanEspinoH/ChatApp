import { useState, useEffect } from 'react'
import { StoreContext } from './Store'
import { socket } from '../utils/socket'
import useFetchData from '../utils/useFetchData'
import { useNavigate } from 'react-router-dom'
import { isValidUserData } from '../utils/utils.jsx'

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

  // const [conectionState, setConectionState] = useState(socket.connected)
  // const [conectionState, setConectionState] = useState(socket.connected)
  // const [conectionState, setConectionState] = useState(socket.connected)

  // USEEFFECT GLOBAL
  // useEffect(() => {}, [])

  // STORE MODIFICATION FUNCTIONS
  const modifyCurrentUser = (data) => {
    return setCurrentUser(data)
  }
  const modifyChannels = (data) => {
    return setChannels((prev) => {
      return data(prev)
    })
  }
  const modifyConectionState = (state) => {
    return setConectionState(state)
  }
  const modifyIsInitialized = (state) => {
    return setIsInitialized(state)
  }
  const modifySelectedChannelId = (state) => {
    return setSelectedChannelId(state)
  }

  const clean = () => {
    setIsInitialized(false)
    setCurrentUser({})
    setChannels(new Map())
    setUsers(new Map())
    setSelectedChannelId(undefined)
  }
  const publicChannels = () => {
    const publicChannels = []
    channels.forEach((channel) => {
      if (channel.type === 'PUBLIC') {
        publicChannels.push(channel)
      }
    })
    // publicChannels.sort((a, b) => {
    //   if (a.name === 'General') {
    //     return -1
    //   } else if (b.name === 'General') {
    //     return 1
    //   }
    //   return b.name < a.name ? 1 : -1
    // })

    return publicChannels[0].id
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

  const init = async () => {
    socket.connect()

    const res = await socket.emitWithAck('channel:list', { size: 100 })
    res.data.forEach((channel) => addChannel(channel))
    if (selectedChannelId) {
      await loadMessagesForSelectedChannel()
    }
    setIsInitialized(true)
    return publicChannels()
  }

  const selectedChannel = () => {
    return channels.get(selectedChannelId)
  }
  const isChannelIsSelected = () => {
    return (channelId) => selectedChannelId === channelId
  }

  const selectChannel = async (channelId) => {
    setSelectedChannelId(channelId)

    await loadMessagesForSelectedChannel()
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
        console.log(res)

        if (res.status === 'OK') {
          res.data.forEach((channel) => addChannel(channel))
        }

        await loadMessagesForSelectedChannel('forward')
      }
    })

    socket.on('channel:created', () => console.log('channel:cerated'))
    socket.on('channel:joined', () => console.log('channel:joined'))
    socket.on('message:sent', (message) => addMessage(message, true))
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
    const channel = { ...selectedChannel() }

    if (!channel || (channel.isLoaded && !force)) {
      return
    }

    const query = {
      size: 20,
      channelId: selectedChannelId,
    }

    if (order === 'backward') {
      query.orderBy = 'id:desc'
      if (channel.messages?.length) {
        query.after = channel.messages[0].id
      }
    } else {
      query.orderBy = 'id:asc'
      if (channel.messages.length) {
        query.after = channel.messages[channel.messages.length - 1].id
      }
    }

    const res = await socket.emitWithAck('message:list', query)

    if (res.status !== 'OK') {
      return
    }

    res.data.forEach((message) => addMessage(message))

    const newSelectedChannel = {
      ...channel,
      isLoaded: true,
      hasMore: res.hasMore,
    }
    if (newSelectedChannel.id !== undefined) {
      setChannels((prev) => {
        const newMap = new Map(prev)
        const channel = newSelectedChannel

        newMap.set(newSelectedChannel.id, {
          ...channel,
          isLoaded: true,
          hasMore: res.hasMore,
        })

        return newMap
      })
    }
  }

  const sendMessage = async (content) => {
    const message = {
      id: undefined,
      from: currentUser.id,
      channelId: selectedChannelId,
      content,
    }

    addMessage(message)

    const payload = {
      channelId: selectedChannelId,
      content,
    }

    const res = await socket.emitWithAck('message:send', payload)

    if (res.status === 'OK') {
      message.id = res.data.id
      message.mid = parseInt(message.id, 10)
    }
  }

  const getUser = async (userId) => {
    if (currentUser?.id) {
      return currentUser
    }

    if (users.has(userId)) {
      return users.get(userId)
    }

    if (pendingUsers.has(userId)) {
      return pendingUsers.get(userId)
    }

    const promise = socket
      .emitWithAck('user:get', { userId })
      .then((res) => {
        if (res.status === 'OK') {
          const user = res.data
          setUsers((prev) => {
            prev.set(userId, res.data)
          })
          return user
        }
      })
      .catch((err) => console.log('Error al en getUser', err))
      .finally(() => {
        setPendingUsers((prev) => {
          prev.delete(userId)
        })
      })
    setPendingUsers((prev) => {
      prev.set(userId, promise)
    })

    return promise
  }

  const store = {
    store: { currentUser, isInitialized, channels, selectedChannelId },
    actions: {
      storeFunc: {
        modifyConectionState,
        modifyCurrentUser,
        modifyIsInitialized,
        modifySelectedChannelId,
        clean,
        modifyChannels,
      },
      fetchFunc: {
        login,
        logout,
        self,
      },
      socketsEvent: {
        bindActions,
        init,
        selectChannel,
        selectedChannel,
        sendMessage,
      },
    },
  }
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
