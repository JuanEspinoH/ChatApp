import { useEffect } from 'react'
import useGlobalStore from '../ContextStore/Store.jsx'
import useFetchData from '../utils/useFetchData.jsx'
import { socket } from '../utils/socket.js'
import { useNavigate } from 'react-router-dom'
import { isValidUserData } from '../utils/utils.jsx'

function App() {
  const navigate = useNavigate()
  const {
    _,
    actions: { storeFunc, fetchFunc, socketsEvent },
  } = useGlobalStore()
  socketsEvent.bindActions()
  const { data, pending, error } = useFetchData(fetchFunc.self)

  useEffect(() => {
    socketsEvent.init()
  }, [])

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

    if (!error && isValidUserData(data)) {
      storeFunc.modifyCurrentUser(data)
      socket.connect()
    } else if (!pending && !isValidUserData(data)) {
      navigate('/login')
    }
  }, [data, pending, error, storeFunc, navigate])

  if (pending) {
    return <div>Cragando</div>
  }

  return <div>hi</div>
}

export default App
