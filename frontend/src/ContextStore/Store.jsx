import { createContext } from 'react'
import { useContext } from 'react'

export const StoreContext = createContext(null)

const useGlobalStore = () => useContext(StoreContext)

export default useGlobalStore
