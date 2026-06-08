import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useAssignees(projectId = 'my') {
  const [assignees, setAssignees] = useState([])
  const skip = useRef(new Set())

  useEffect(() => {
    let mounted = true
    setAssignees([])

    const load = async () => {
      const { data } = await supabase
        .from('assignees')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
      if (mounted && data) setAssignees(data)
    }
    load()

    const ch = supabase
      .channel(`assignees-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignees' }, ({ eventType, new: n, old: o }) => {
        if (!mounted) return
        if (eventType !== 'DELETE' && n.project_id !== projectId) return
        if (eventType === 'INSERT') {
          if (skip.current.has(n.id)) { skip.current.delete(n.id); return }
          setAssignees(p => [...p, n])
        }
        if (eventType === 'UPDATE') {
          if (skip.current.has(n.id)) { skip.current.delete(n.id); return }
          setAssignees(p => p.map(a => a.id === n.id ? n : a))
        }
        if (eventType === 'DELETE') {
          setAssignees(p => p.filter(a => a.id !== o.id))
        }
      })
      .subscribe()

    return () => { mounted = false; supabase.removeChannel(ch) }
  }, [projectId])

  const defaultAssignee = assignees.find(a => a.is_default) ?? null

  const addAssignee = useCallback(async (name) => {
    const id = crypto.randomUUID()
    const row = { id, project_id: projectId, name, is_default: false }
    setAssignees(p => [...p, { ...row, created_at: new Date().toISOString() }])
    skip.current.add(id)
    await supabase.from('assignees').insert(row)
  }, [projectId])

  const renameAssignee = useCallback(async (id, name) => {
    setAssignees(p => p.map(a => a.id === id ? { ...a, name } : a))
    skip.current.add(id)
    await supabase.from('assignees').update({ name }).eq('id', id)
  }, [])

  const deleteAssignee = useCallback(async (id) => {
    const name = assignees.find(a => a.id === id)?.name
    setAssignees(p => p.filter(a => a.id !== id))
    await supabase.from('assignees').delete().eq('id', id)
    if (name) {
      await supabase.from('tasks').update({ assignee: '' }).eq('board_id', projectId).eq('assignee', name)
    }
  }, [assignees, projectId])

  // デフォルト担当者を設定（null を渡すと未設定に戻す）
  const setDefaultAssignee = useCallback(async (id) => {
    setAssignees(p => p.map(a => ({ ...a, is_default: a.id === id })))
    // 全件 false → 対象 true の2ステップ
    await supabase.from('assignees').update({ is_default: false }).eq('project_id', projectId)
    if (id) await supabase.from('assignees').update({ is_default: true }).eq('id', id)
  }, [projectId])

  const clearDefault = useCallback(async () => {
    setAssignees(p => p.map(a => ({ ...a, is_default: false })))
    await supabase.from('assignees').update({ is_default: false }).eq('project_id', projectId)
  }, [projectId])

  return { assignees, defaultAssignee, addAssignee, renameAssignee, deleteAssignee, setDefaultAssignee, clearDefault }
}
