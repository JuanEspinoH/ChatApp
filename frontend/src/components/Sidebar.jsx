import React from 'react'
import { Link } from 'react-router-dom'
import useGlobalStore from '../ContextStore/Store'

const Sidebar = () => {
  const {
    store,
    actions: { storeFunc },
  } = useGlobalStore()
  let mapChannels = []
  store.channels.forEach((valor, clave) => mapChannels.push(valor))

  return (
    <aside
      style={{
        width: '20%',
        minHeight: '100%',
        // height: '100%',
        backgroundColor: 'red',
      }}
    >
      <ul style={{ display: 'flex', flexDirection: 'column' }}>
        {mapChannels.map((channel) => (
          <Link key={channel.id} to={`/c/${channel.id}`}>
            {channel.name}
          </Link>
        ))}
      </ul>
    </aside>
  )
}

export default Sidebar
