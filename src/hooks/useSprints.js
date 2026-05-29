import { useState, useCallback, useEffect } from 'react'

const SPRINTS_KEY = 'scrum-board-sprints'

const fmt = (d) => d.toISOString().slice(0, 10)
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
const today = new Date()

const DEFAULT_SPRINTS = [
  {
    id: 'sprint-1',
    name: 'Sprint 1',
    startDate: fmt(today),
    endDate: fmt(addDays(today, 13)),
    status: 'active', // 'planned' | 'active' | 'completed'
    velocity: null,
  },
]

function load() {
  try {
    const raw = localStorage.getItem(SPRINTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_SPRINTS
}

function save(sprints) {
  try { localStorage.setItem(SPRINTS_KEY, JSON.stringify(sprints)) } catch {}
}

export function useSprints() {
  const [sprints, setSprints] = useState(load)
  useEffect(() => { save(sprints) }, [sprints])

  const activeSprint = sprints.find(s => s.status === 'active') ?? null

  const addSprint = useCallback((data) => {
    setSprints(prev => [...prev, { id: crypto.randomUUID(), status: 'planned', velocity: null, ...data }])
  }, [])

  const updateSprint = useCallback((id, updates) => {
    setSprints(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }, [])

  const deleteSprint = useCallback((id) => {
    setSprints(prev => prev.filter(s => s.id !== id))
  }, [])

  const activateSprint = useCallback((id) => {
    // アクティブなスプリントを計画中に戻し、指定IDをアクティブに
    setSprints(prev => prev.map(s => ({
      ...s,
      status: s.id === id ? 'active' : s.status === 'active' ? 'planned' : s.status,
    })))
  }, [])

  const completeSprint = useCallback((id, velocity) => {
    setSprints(prev => prev.map(s => s.id === id ? { ...s, status: 'completed', velocity } : s))
  }, [])

  return { sprints, activeSprint, addSprint, updateSprint, deleteSprint, activateSprint, completeSprint }
}
