import { useState, useEffect } from 'react'
import api from '../lib/api'
import { CATEGORIES as FALLBACK } from '../data/products'

export function useCategories() {
  const [categories, setCategories] = useState(FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/categories/tree')
      .then(({ data }) => {
        if (data.categories?.length) setCategories(data.categories)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { categories, loading }
}

export function useFlatCategories() {
  const [categories, setCategories] = useState(FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => {
        if (data.categories?.length) setCategories(data.categories)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { categories, loading }
}
