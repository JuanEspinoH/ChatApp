import React from 'react'
import { useColorScheme } from '@mui/material/styles'
import useGlobalStore from '../ContextStore/Store'
import { useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import { socket } from '../utils/socket'

const Navbar = () => {
  const navigate = useNavigate()
  const { mode, setMode } = useColorScheme()
  const {
    _,
    actions: { storeFunc, fetchFunc },
  } = useGlobalStore()

  const handleChange = (event) => {
    const value = event.target.checked
    setMode(value ? 'dark' : 'light')
  }
  const handleLogOut = async () => {
    await fetchFunc.logout()
    await socket.disconnect()
    storeFunc.clean()
    navigate('/login')
  }
  return (
    <AppBar
      position="static"
      sx={{
        height: '10%',
        minHeight: '10vh',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        padding: '10px 20px',
      }}
    >
      <FormControlLabel
        sx={{ width: '200px' }}
        control={<Switch checked={mode === 'dark'} onChange={handleChange} />}
        label={mode === 'light' ? 'Dark Mode' : 'Light Mode'}
      />
      <Button
        onClick={() => handleLogOut()}
        sx={{ width: 'auto' }}
        variant="contained"
      >
        Log Out
      </Button>
    </AppBar>
  )
}

export default Navbar
