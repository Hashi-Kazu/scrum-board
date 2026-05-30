import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const SELECTED_KEY = 'scrum-board-project'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [selectedId, setSelectedId] = useState(
    () => localStorage.getItem(SELECTED_KEY) ?? 'my'
  )
  const skip = useRef(new Set())

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true })
      if (mounted && data) {
        setProjects(data)
        // 保存済みIDが存在しない場合は先頭に戻す
        if (data.length > 0 && !data.find(p => p.id === localStorage.getItem(SELECTED_KEY))) {
          setSelectedId(data[0].id)
          localStorage.setItem(SELECTED_KEY, data[0].id)
        }
      }
    }
    load()

    const ch = supabase
      .channel('projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, ({ eventType, new: n, old: o }) => {
        if (!mounted) return
        if (eventType === 'INSERT') {
          if (skip.current.has(n.id)) { skip.current.delete(n.id); return }
          setProjects(p => [...p, n])
        }
        if (eventType === 'UPDATE') {
          if (skip.current.has(n.id)) { skip.current.delete(n.id); return }
          setProjects(p => p.map(x => x.id === n.id ? n : x))
        }
        if (eventType === 'DELETE') {
          setProjects(p => p.filter(x => x.id !== o.id))
        }
      })
      .subscribe()

    return () => { mounted = false; supabase.removeChannel(ch) }
  }, [])

  const selectedProject = projects.find(p => p.id === selectedId) ?? null

  const selectProject = useCallback((id) => {
    setSelectedId(id)
    localStorage.setItem(SELECTED_KEY, id)
  }, [])

  const addProject = useCallback(async (name) => {
    const id = crypto.randomUUID()
    const project = { id, name }
    setProjects(p => [...p, { ...project, created_at: new Date().toISOString() }])
    selectProject(id)
    skip.current.add(id)
    await supabase.from('projects').insert(project)
  }, [selectProject])

  const renameProject = useCallback(async (id, name) => {
    setProjects(p => p.map(x => x.id === id ? { ...x, name } : x))
    skip.current.add(id)
    await supabase.from('projects').update({ name }).eq('id', id)
  }, [])

  const deleteProject = useCallback(async (id, remainingProjects) => {
    setProjects(p => p.filter(x => x.id !== id))
    const next = remainingProjects.find(x => x.id !== id)
    if (next) selectProject(next.id)
    // プロジェクトと紐づくタスク・スプリントも削除
    await supabase.from('tasks').delete().eq('board_id', id)
    await supabase.from('sprints').delete().eq('board_id', id)
    await supabase.from('projects').delete().eq('id', id)
  }, [selectProject])

  return { projects, selectedId, selectedProject, selectProject, addProject, renameProject, deleteProject }
}
