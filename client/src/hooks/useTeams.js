import { useState, useEffect } from 'react'
import api from '../lib/api'

export function useTeams() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/teams')
      .then(({ data }) => {
        if (data.teams?.length) setTeams(data.teams)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { teams, loading }
}

export function useAllTeams() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/teams/all')
      .then(({ data }) => {
        if (data.teams?.length) setTeams(data.teams)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { teams, loading, setTeams }
}
