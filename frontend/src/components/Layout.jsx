import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import useGlobalStore from '../ContextStore/Store.jsx'
import Navbar from '../components/Navbar.jsx'
import Sidebar from './Sidebar.jsx'
import { socket } from '../utils/socket.js'
import useFetchData from '../utils/useFetchData.jsx'
import { isValidUserData } from '../utils/utils.jsx'

export default function RootLayout() {
  const navigate = useNavigate()
  const {
    store,
    actions: { storeFunc, fetchFunc, socketsEvent },
  } = useGlobalStore()
  const [data, setData] = useState(null)
  const [pending, setPending] = useState(true)
  const [error, setError] = useState(null)
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchFunc.self()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err)
        setData(null)
      } finally {
        setPending(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const bindAsync = async () => {
      await socketsEvent.bindActions()
      return
    }
    if (!error && isValidUserData(data)) {
      storeFunc.modifyCurrentUser(data)
      bindAsync()

      store.socketsEvent
      socketsEvent
        .init()
        .then((res) => {
          if (store.selectedChannelId === undefined) {
            navigate(`/c/${res}`)
          }
        })
        .catch((err) => console.log(err))
    } else if (!pending && !isValidUserData(data)) {
      navigate('/login')
    }
  }, [data, pending, error])

  useEffect(() => {
    socket.on('connect', () => storeFunc.modifyIsInitialized(true))
    socket.on('connect_error', (err) => {
      if (err.context?.status === 401) {
        socket.disconnect()
        navigate('/login')
      }
    })

    socket.on('disconnect', (reason) => {
      storeFunc.modifyIsInitialized(false)
      storeFunc.modifyCurrentUser({})
      if (reason === 'io server disconnect') {
        navigate('/login')
      }
    })
    return () => {
      socket.off('connect')
      socket.off('connect_error')
      socket.off('disconnect')
    }
  }, [])
  return (
    <div
      style={{
        minHeight: '100vh',
        // height: '100%',
        backgroundColor: 'orange',
      }}
    >
      <Navbar />
      <main
        style={{
          display: 'flex',
          flexDirection: 'row',
          minHeight: '90vh',
          height: '90%',
          // backgroundColor: 'blue',
        }}
      >
        <Sidebar />
        <Outlet />
      </main>
    </div>
  )
}
