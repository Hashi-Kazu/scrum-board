import { useState } from 'react'
import Board from './components/Board'
import SprintsView from './components/SprintsView'
import StatsView from './components/StatsView'
import ProjectSelector from './components/ProjectSelector'
import LoginScreen from './components/LoginScreen'
import { useTasks } from './hooks/useTasks'
import { useSprints } from './hooks/useSprints'
import { useProjects } from './hooks/useProjects'
import './App.css'

// 環境変数が設定されている場合のみ認証を要求
const AUTH_USER = import.meta.env.VITE_AUTH_USER
const AUTH_PASS = import.meta.env.VITE_AUTH_PASS
const AUTH_REQUIRED = !!(AUTH_USER && AUTH_PASS)

const COLUMNS = [
  { id: 'backlog',     title: 'プロダクトバックログ', color: '#6b7280' },
  { id: 'todo',        title: 'TODO',       color: '#3b82f6' },
  { id: 'in-progress', title: '進行中',     color: '#f59e0b' },
  { id: 'review',      title: 'レビュー',   color: '#8b5cf6' },
  { id: 'done',        title: '完了',       color: '#10b981' },
]

const VIEWS = [
  { id: 'board',   label: '📋 ボード' },
  { id: 'stats',   label: '📊 統計' },
  { id: 'sprints', label: '⚙️ スプリント' },
]

export default function App() {
  const [authed, setAuthed] = useState(
    () => !AUTH_REQUIRED || sessionStorage.getItem('sb-auth') === '1'
  )

  const handleLogin = (user, pass) => {
    if (user === AUTH_USER && pass === AUTH_PASS) {
      sessionStorage.setItem('sb-auth', '1')
      setAuthed(true)
      return true
    }
    return false
  }

  if (!authed) return <LoginScreen onLogin={handleLogin} />

  const { projects, selectedId, selectedProject, selectProject, addProject, renameProject, deleteProject } = useProjects()

  const { tasks, loading, addTask, updateTask, deleteTask, moveTask, reorderTasks } = useTasks(selectedId)
  const { sprints, addSprint, updateSprint, deleteSprint, activateSprint, completeSprint } = useSprints(selectedId)

  const [view, setView] = useState('board')
  const [filterSprintId, setFilterSprintId] = useState('all')

  // ボード表示用タスク
  // バックログ = スプリント未割り当てのみ / 他カラム = スプリントフィルタに従う
  const boardTasks = tasks.filter(t => {
    if (t.columnId === 'backlog') return !t.sprintId
    return filterSprintId === 'all' || t.sprintId === filterSprintId
  })

  // タスク追加時：バックログ以外 + スプリントフィルタ中 → 自動割り当て
  const handleAddTask = (columnId, taskData) => {
    addTask(columnId, {
      ...taskData,
      sprintId: (columnId !== 'backlog' && filterSprintId !== 'all')
        ? filterSprintId
        : (taskData.sprintId ?? null),
    })
  }

  // ドラッグ移動時のスプリント自動制御
  const handleMoveTask = (taskId, newColumnId) => {
    const task = tasks.find(t => t.id === taskId)
    moveTask(taskId, newColumnId)
    if (newColumnId === 'backlog') {
      // バックログへ → スプリントから外す
      if (task?.sprintId) updateTask(taskId, { sprintId: null })
    } else if (task?.columnId === 'backlog' && filterSprintId !== 'all' && !task?.sprintId) {
      // バックログから他カラムへ + スプリントフィルタ中 → 自動割り当て
      updateTask(taskId, { sprintId: filterSprintId })
    }
  }

  const handleReorderTasks = (activeId, overId, newColumnId) => {
    const task = tasks.find(t => t.id === activeId)
    reorderTasks(activeId, overId, newColumnId)
    if (newColumnId === 'backlog') {
      if (task?.sprintId) updateTask(activeId, { sprintId: null })
    } else if (task?.columnId === 'backlog' && filterSprintId !== 'all' && !task?.sprintId) {
      updateTask(activeId, { sprintId: filterSprintId })
    }
  }

  // スプリント完了：未完了タスクの移動 + velocity 記録
  const handleCompleteSprint = (sprintId, velocity, action, targetSprintId) => {
    tasks
      .filter(t => t.sprintId === sprintId && t.columnId !== 'done')
      .forEach(t => updateTask(t.id, {
        sprintId: action === 'next' && targetSprintId ? targetSprintId : null,
        ...(action === 'backlog' && { columnId: 'backlog' }),
      }))
    completeSprint(sprintId, velocity)
  }

  const totalDone = boardTasks.filter(t => t.columnId === 'done').length
  const progress  = boardTasks.length > 0 ? Math.round((totalDone / boardTasks.length) * 100) : 0

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-title-group">
            <h1 className="app-title">📋 スクラムボード</h1>
            <ProjectSelector
              projects={projects}
              selectedId={selectedId}
              onSelect={selectProject}
              onAdd={addProject}
              onRename={renameProject}
              onDelete={deleteProject}
            />
          </div>

          <nav className="app-nav">
            {VIEWS.map(v => (
              <button
                key={v.id}
                className={`nav-tab ${view === v.id ? 'nav-tab--active' : ''}`}
                onClick={() => setView(v.id)}
              >
                {v.label}
              </button>
            ))}
          </nav>

          <div className="app-stats">
            <select
              className="sprint-filter"
              value={filterSprintId}
              onChange={e => setFilterSprintId(e.target.value)}
            >
              <option value="all">すべて</option>
              {sprints.map(s => (
                <option key={s.id} value={s.id}>
                  {s.status === 'active' ? '● ' : ''}{s.name}
                </option>
              ))}
            </select>
            <div className="progress-bar-wrap">
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="progress-label">{progress}%</span>
            </div>
            <span className="stat-chip done">{totalDone}/{boardTasks.length}</span>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /><p>読み込み中…</p></div>
      ) : (
        <main className="app-main">
          {view === 'board' && (
            <Board
              columns={COLUMNS}
              tasks={boardTasks}
              sprints={sprints}
              onAddTask={handleAddTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onMoveTask={handleMoveTask}
              onReorderTasks={handleReorderTasks}
            />
          )}
          {view === 'stats' && (
            <StatsView sprints={sprints} tasks={tasks} />
          )}
          {view === 'sprints' && (
            <SprintsView
              sprints={sprints}
              tasks={tasks}
              onAdd={addSprint}
              onUpdate={updateSprint}
              onDelete={deleteSprint}
              onActivate={activateSprint}
              onComplete={handleCompleteSprint}
            />
          )}
        </main>
      )}
    </div>
  )
}
