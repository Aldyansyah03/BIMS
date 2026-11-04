import { useState, useEffect } from 'react'
import { getPackages } from '../services/packageService'

export function usePackages() {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPackages()
      .then((res) => {
        if (res.success) setPackages(res.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { packages, loading }
}
