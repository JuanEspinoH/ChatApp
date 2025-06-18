import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { socket } from './utils/socket.js'
import useGlobalStore from './ContextStore/Store.jsx'

const checkUser = async (selfFn, storeSetter, navigate, socket) => {
  try {
    const response = await selfFn()

    if (!response.ok) {
      if (response.status === 401) {
        socket.disconnect()
        navigate('/login')
        return
      }
    }

    storeSetter(response)
    socket.connect()
  } catch (error) {
    console.error('Error al verificar usuario:', error)

    // if (error.status === 401 || error.message.includes('401')) {
    //   navigate('/login')
    // }
  }
}

function App() {
  const navigate = useNavigate()
  const {
    _,
    actions: { fetchFunc, storeFunc },
  } = useGlobalStore()
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [fooEvents, setFooEvents] = useState([])
  const [isPending, setIsPending] = useState(true)

  useEffect(() => {
    checkUser(
      fetchFunc.self,
      storeFunc.modifyCurrentUser,
      navigate,
      socket
    ).then(() => setIsPending(false))

    function onConnect() {
      setIsConnected(true)
    }

    function onDisconnect() {
      console.log('conectado front')

      setIsConnected(false)
    }

    function onFooEvent(value) {
      setFooEvents((previous) => [...previous, value])
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('foo', onFooEvent)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('foo', onFooEvent)
    }
  }, [])

  if (isPending) {
    return <div>Cargando...</div>
  }

  return <section> totalmente cargado Cargado</section>
}

export default App
