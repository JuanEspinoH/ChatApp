import React, { useState } from 'react'
import { socket } from '../utils/socket.js'
import useGlobalStore from '../ContextStore/Store.jsx'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const navigation = useNavigate()
  const {
    _,
    actions: { storeFunc, fetchFunc },
  } = useGlobalStore()

  const [data, setData] = useState({ email: '', password: '' })
  const handleChange = (e) => {
    setData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await fetchFunc.login(data)
    if (res) {
      storeFunc.modifyCurrentUser(res)

      socket.connect()

      navigation('/')
    } else {
      // Opcional: mostrar error
      alert('Login incorrecto')
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Email:
          <input
            type="text"
            name="email"
            onChange={handleChange}
            value={data.email}
          />
        </label>
        <label>
          Password:
          <input
            type="text"
            name="password"
            onChange={handleChange}
            value={data.password}
          />
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default Login
