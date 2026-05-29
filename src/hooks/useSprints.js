import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ── localStorage キー（移行用に読み取りのみ使用・変更禁止）──────────────
const SPRINTS_KEY = 'scrum-board-sprints'

const fmt    = (d) => d.toISOString().slice(0, 10)
const addDay = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
const today  = new Date()

const DEFAULT_SPRINTS = [
  { id: 'sprint-1', name: 'Sprint 1', startDate: fmt(today), endDate: fmt(addDay(today, 13)), status: 'active', velocity: null },
]

// ── DB ↔ JS 変換 ──────────────────────────────────────────────────────────
const fromRow = (r) => ({
  id:        r.id,
  name:      r.name,
  startDate: r.start_date,
  endDate:   r.end_date,
  status:    r.status,
  velocity:  r.velocity ?? null,
})

const toRow = (s) => ({
  id:         s.id,
  name:       s.name,
  start_date: s.startDate,
  end_date:   s.endDate,
  status:     s.status   ?? 'planned',
  velocity:   s.velocity ?? null,
})

function readLocal() {
  try {
    const raw = localStorage.getItem(SPRINTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_SPRINTS
}

// ─────────────────────────────────────────────────────────────────────────
export function useSprints(boardId = 'my') {
  const [sprints, setSprints] = useState([])
  const skip = useRef(new Set())

  useEffect(() => {
    let mounted = true
    setSprints([])

    const init = async () => {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: true })

      if (!mounted || error) return

      // board_id='my' かつ空なら localStorage から自動移行
      if (data.length === 0 && boardId === 'my') {
        const local = readLocal()
        if (local.length > 0) {
          const { data: migrated, error: me } = await supabase
            .from('sprints')
            .insert(local.map(s => ({ ...toRow(s), board_id: 'my' })))
            .select()
          if (!me && migrated) { setSprints(migrated.map(fromRow)); return }
        }
      }

      setSprints(data.map(fromRow))
    }

    init()

    const ch = supabase
      .channel(`sprints-${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sprints' }, ({ eventType, new: n, old: o }) => {
        if (!mounted) return
        if (eventType !== 'DELETE' && n.board_id !== boardId) return
        if (eventType === 'INSERT') {
          if (skip.current.has(n.id)) { skip.current.delete(n.id); return }
          setSprints(p => [...p, fromRow(n)])
        }
        if (eventType === 'UPDATE') {
          if (skip.current.has(n.id)) { skip.current.delete(n.id); return }
          setSprints(p => p.map(s => s.id === n.id ? fromRow(n) : s))
        }
        if (eventType === 'DELETE') {
          setSprints(p => p.filter(s => s.id !== o.id))
        }
      })
      .subscribe()

    return () => { mounted = false; supabase.removeChannel(ch) }
  }, [boardId])

  const activeSprint = sprints.find(s => s.status === 'active') ?? null

  const addSprint = useCallback(async (data) => {
    const id = crypto.randomUUID()
    const s = { id, status: 'planned', velocity: null, ...data }
    setSprints(p => [...p, s])
    skip.current.add(id)
    await supabase.from('sprints').insert({ ...toRow(s), board_id: boardId })
  }, [boardId])

  const updateSprint = useCallback(async (id, updates) => {
    setSprints(p => p.map(s => s.id === id ? { ...s, ...updates } : s))
    const row = {}
    if (updates.name      !== undefined) row.name       = updates.name
    if (updates.startDate !== undefined) row.start_date = updates.startDate
    if (updates.endDate   !== undefined) row.end_date   = updates.endDate
    if (updates.status    !== undefined) row.status     = updates.status
    if (updates.velocity  !== undefined) row.velocity   = updates.velocity
    skip.current.add(id)
    await supabase.from('sprints').update(row).eq('id', id)
  }, [])

  const deleteSprint = useCallback(async (id) => {
    setSprints(p => p.filter(s => s.id !== id))
    await supabase.from('sprints').delete().eq('id', id)
  }, [])

  const activateSprint = useCallback(async (id) => {
    setSprints(p => p.map(s => ({
      ...s,
      status: s.id === id ? 'active' : s.status === 'active' ? 'planned' : s.status,
    })))
    // 現在のアクティブを計画中に戻してから対象をアクティブに
    await supabase.from('sprints').update({ status: 'planned' }).eq('status', 'active').neq('id', id)
    skip.current.add(id)
    await supabase.from('sprints').update({ status: 'active' }).eq('id', id)
  }, [])

  const completeSprint = useCallback(async (id, velocity) => {
    setSprints(p => p.map(s => s.id === id ? { ...s, status: 'completed', velocity } : s))
    skip.current.add(id)
    await supabase.from('sprints').update({ status: 'completed', velocity }).eq('id', id)
  }, [])

  return { sprints, activeSprint, addSprint, updateSprint, deleteSprint, activateSprint, completeSprint }
}
