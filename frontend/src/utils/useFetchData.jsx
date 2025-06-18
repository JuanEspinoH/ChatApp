// useFetchData.js
import { useState, useEffect } from 'react'

const useFetchData = (fetchFunction) => {
  const [data, setData] = useState(null)
  const [pending, setPending] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchFunction()
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
  }, [fetchFunction])

  return { data, pending, error }
}

export default useFetchData
