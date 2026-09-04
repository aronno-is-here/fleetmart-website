import { useState, useEffect } from 'react'
import api from '../lib/api'

export function useBrands() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/brands')
      .then(({ data }) => {
        if (data.brands?.length) setBrands(data.brands)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { brands, loading }
}

export function useAllBrands() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/brands/all')
      .then(({ data }) => {
        if (data.brands?.length) setBrands(data.brands)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { brands, loading, setBrands }
}
