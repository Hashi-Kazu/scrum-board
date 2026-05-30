import { useState, useCallback, useEffect, useRef } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { supabase } from '../lib/supabase'

// ── localStorage キー（移行用に読み取りのみ使用・変更禁止）──────────────
const STORAGE_KEY = 'scrum-board-tasks'
const DEFAULT_TASKS = [
  { id: '1', columnId: 'backlog',     title: 'ユーザー認証機能',       description: 'ログイン・ログアウト・パスワードリセット', priority: 'high',   assignee: '田中', position: 1000 },
  { id: '2', columnId: 'backlog',     title: 'ダッシュボード設計',     description: 'KPIウィジェットのレイアウト',              priority: 'medium', assignee: '',     position: 2000 },
  { id: '3', columnId: 'todo',        title: 'APIエンドポイント実装',  description: 'REST API の設計と実装',                    priority: 'high',   assignee: '鈴木', position: 3000 },
  { id: '4', columnId: 'todo',        title: 'データベーススキーマ',   description: 'ER図の作成とマイグレーション',              priority: 'medium', assignee: '佐藤', position: 4000 },
  { id: '5', columnId: 'in-progress', title: 'フロントエンド実装',     description: 'React コンポーネントの作成',               priority: 'high',   assignee: '田中', position: 5000 },
  { id: '6', columnId: 'in-progress', title: 'テスト作成',             description: 'ユニットテストとE2Eテスト',                priority: 'low',    assignee: '山田', position: 6000 },
  { id: '7', columnId: 'review',      title: 'CI/CD パイプライン',     description: 'GitHub Actions のワークフロー設定',        priority: 'medium', assignee: '鈴木', position: 7000 },
  { id: '8', columnId: 'done',        title: '要件定義',               description: 'ステークホルダーとの要件確認完了',         priority: 'high',   assignee: '佐藤', position: 8000 },
]

// ── DB ↔ JS 変換 ──────────────────────────────────────────────────────────
const fromRow = (r) => ({
  id:          r.id,
  columnId:    r.column_id,
  title:       r.title,
  description: r.description ?? '',
  priority:    r.priority ?? 'medium',
  assignee:    r.assignee ?? '',
  storyPoints: r.story_points ?? null,
  sprintId:    r.sprint_id ?? null,
  position:    r.position,
  completedAt: r.completed_at ?? null,
})

const toRow = (t) => ({
  id:           t.id,
  column_id:    t.columnId,
  title:        t.title,
  description:  t.description  ?? '',
  priority:     t.priority     ?? 'medium',
  assignee:     t.assignee     ?? '',
  story_points: t.storyPoints  ?? null,
  sprint_id:    t.sprintId     ?? null,
  position:     t.position     ?? Date.now(),
  completed_at: t.completedAt  ?? null,
})

// ── localStorage からデータを読み出す（移行専用）──────────────────────────
function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_TASKS
}

// ─────────────────────────────────────────────────────────────────────────
export function useTasks(projectId = 'my') {
  const [tasks, setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const skip = useRef(new Set())

  useEffect(() => {
    let mounted = true
    setTasks([])
    setLoading(true)

    const init = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('board_id', projectId)
        .order('position', { ascending: true })

      if (!mounted) return
      if (error) { setError(error.message); setLoading(false); return }

      // board_id='my' かつ空なら localStorage から自動移行
      if (data.length === 0 && projectId === 'my') {
        const local = readLocal()
        if (local.length > 0) {
          const { data: migrated, error: me } = await supabase
            .from('tasks')
            .insert(local.map(t => ({ ...toRow(t), board_id: 'my' })))
            .select()
          if (!me && migrated) { setTasks(migrated.map(fromRow)); setLoading(false); return }
        }
      }

      setTasks(data.map(fromRow))
      setLoading(false)
    }

    init()

    const ch = supabase
      .channel(`tasks-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, ({ eventType, new: n, old: o }) => {
        if (!mounted) return
        // 別ボードのイベントは無視
        if (eventType !== 'DELETE' && n.board_id !== projectId) return
        if (eventType === 'INSERT') {
          if (skip.current.has(n.id)) { skip.current.delete(n.id); return }
          setTasks(p => [...p, fromRow(n)])
        }
        if (eventType === 'UPDATE') {
          if (skip.current.has(n.id)) { skip.current.delete(n.id); return }
          setTasks(p => p.map(t => t.id === n.id ? fromRow(n) : t))
        }
        if (eventType === 'DELETE') {
          setTasks(p => p.filter(t => t.id !== o.id))
        }
      })
      .subscribe()

    return () => { mounted = false; supabase.removeChannel(ch) }
  }, [projectId])

  // ── CRUD ────────────────────────────────────────────────────────────────

  const addTask = useCallback(async (columnId, taskData) => {
    const tmp = { id: crypto.randomUUID(), columnId, position: Date.now(), ...taskData }
    setTasks(p => [...p, tmp])
    const { data, error } = await supabase.from('tasks').insert({ ...toRow(tmp), board_id: projectId }).select().single()
    if (error) { setTasks(p => p.filter(t => t.id !== tmp.id)); return }
    skip.current.add(data.id)
    setTasks(p => p.map(t => t.id === tmp.id ? fromRow(data) : t))
  }, [projectId])

  const updateTask = useCallback(async (taskId, updates) => {
    setTasks(p => p.map(t => t.id === taskId ? { ...t, ...updates } : t))
    const row = {}
    if (updates.columnId    !== undefined) row.column_id    = updates.columnId
    if (updates.title       !== undefined) row.title        = updates.title
    if (updates.description !== undefined) row.description  = updates.description
    if (updates.priority    !== undefined) row.priority     = updates.priority
    if (updates.assignee    !== undefined) row.assignee     = updates.assignee
    if (updates.storyPoints !== undefined) row.story_points = updates.storyPoints
    if (updates.sprintId    !== undefined) row.sprint_id    = updates.sprintId
    if (updates.completedAt !== undefined) row.completed_at = updates.completedAt
    skip.current.add(taskId)
    await supabase.from('tasks').update(row).eq('id', taskId)
  }, [])

  const deleteTask = useCallback(async (taskId) => {
    setTasks(p => p.filter(t => t.id !== taskId))
    await supabase.from('tasks').delete().eq('id', taskId)
  }, [])

  const moveTask = useCallback(async (taskId, newColumnId) => {
    let completedAt = null
    setTasks(p => p.map(t => {
      if (t.id !== taskId) return t
      completedAt = newColumnId === 'done' ? (t.completedAt ?? new Date().toISOString()) : null
      return { ...t, columnId: newColumnId, completedAt }
    }))
    skip.current.add(taskId)
    await supabase.from('tasks').update({ column_id: newColumnId, completed_at: completedAt }).eq('id', taskId)
  }, [])

  const reorderTasks = useCallback(async (activeId, overId, newColumnId) => {
    let movedTask = null
    let reordered = []

    setTasks(p => {
      const oldIdx = p.findIndex(t => t.id === activeId)
      const newIdx = p.findIndex(t => t.id === overId)
      if (oldIdx === -1 || newIdx === -1) return p
      const updated = p.map(t => {
        if (t.id !== activeId) return t
        const completedAt = newColumnId === 'done' ? (t.completedAt ?? new Date().toISOString()) : null
        movedTask = { ...t, columnId: newColumnId, completedAt }
        return movedTask
      })
      reordered = arrayMove(updated, oldIdx, newIdx)
      return reordered
    })

    // カラム内の並び順を position で DB に保存
    setTimeout(async () => {
      const colTasks = reordered.filter(t => t.columnId === newColumnId)
      for (let i = 0; i < colTasks.length; i++) {
        const t = colTasks[i]
        const newPos = (i + 1) * 1000
        skip.current.add(t.id)
        await supabase.from('tasks').update({
          position:     newPos,
          column_id:    t.columnId,
          completed_at: t.completedAt ?? null,
        }).eq('id', t.id)
      }
    }, 0)
  }, [])

  return { tasks, loading, error, addTask, updateTask, deleteTask, moveTask, reorderTasks }
}
