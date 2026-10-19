import { useState, useEffect } from 'react'
import api from '../lib/api'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/categories/tree')
      .then(({ data }) => {
        if (data.categories?.length) setCategories(data.categories)
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { categories, loading, error }
}

export function useFlatCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => {
        if (data.categories?.length) setCategories(data.categories)
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { categories, loading, error }
}

export function useCategoryCounts() {
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/categories/counts')
      .then(({ data }) => setCounts(data.counts || {}))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { counts, loading, error }
}
