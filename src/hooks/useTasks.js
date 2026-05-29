import { useState, useCallback, useEffect } from 'react'
import { arrayMove } from '@dnd-kit/sortable'

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

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_TASKS
}

function save(tasks) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) } catch {}
}

export function useTasks() {
  const [tasks, setTasks] = useState(load)

  // localStorage に書き込む
  useEffect(() => { save(tasks) }, [tasks])

  const addTask = useCallback((columnId, taskData) => {
    setTasks(prev => [
      ...prev,
      { id: crypto.randomUUID(), columnId, position: Date.now(), ...taskData },
    ])
  }, [])

  const updateTask = useCallback((taskId, updates) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
  }, [])

  const deleteTask = useCallback((taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }, [])

  const moveTask = useCallback((taskId, newColumnId) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      return {
        ...t,
        columnId: newColumnId,
        // 完了カラムへ移動→記録、完了から外れる→クリア
        completedAt: newColumnId === 'done'
          ? (t.completedAt ?? new Date().toISOString())
          : null,
      }
    }))
  }, [])

  // 同じカラム内での並び替え、またはカラムをまたぐ挿入
  const reorderTasks = useCallback((activeId, overId, newColumnId) => {
    setTasks(prev => {
      const oldIndex = prev.findIndex(t => t.id === activeId)
      const newIndex = prev.findIndex(t => t.id === overId)
      if (oldIndex === -1 || newIndex === -1) return prev
      const updated = prev.map(t => {
        if (t.id !== activeId) return t
        return {
          ...t,
          columnId: newColumnId,
          completedAt: newColumnId === 'done'
            ? (t.completedAt ?? new Date().toISOString())
            : null,
        }
      })
      return arrayMove(updated, oldIndex, newIndex)
    })
  }, [])

  return { tasks, loading: false, error: null, addTask, updateTask, deleteTask, moveTask, reorderTasks }
}
