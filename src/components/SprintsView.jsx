import { useState } from 'react'
import SprintModal from './SprintModal'
import CompleteSprintModal from './CompleteSprintModal'

const STATUS_LABEL = { planned: '計画中', active: '進行中', completed: '完了' }

export default function SprintsView({ sprints, tasks, onAdd, onUpdate, onDelete, onActivate, onComplete }) {
  const [editTarget, setEditTarget] = useState(null) // null | 'new' | sprint object
  const [completeTarget, setCompleteTarget] = useState(null)

  const stats = (sprint) => {
    const ts = tasks.filter(t => t.sprintId === sprint.id)
    const total = ts.reduce((s, t) => s + (t.storyPoints ?? 0), 0)
    const done  = ts.filter(t => t.columnId === 'done').reduce((s, t) => s + (t.storyPoints ?? 0), 0)
    return { count: ts.length, total, done }
  }

  const handleSave = (data) => {
    if (editTarget === 'new') onAdd(data)
    else onUpdate(editTarget.id, data)
    setEditTarget(null)
  }

  return (
    <div className="sprints-view">
      <div className="sprints-header">
        <h2>スプリント管理</h2>
        <button className="btn btn-primary" onClick={() => setEditTarget('new')}>+ 新規スプリント</button>
      </div>

      {sprints.length === 0 && <p className="chart-empty">スプリントがありません</p>}

      <div className="sprints-list">
        {sprints.map(sprint => {
          const s = stats(sprint)
          return (
            <div key={sprint.id} className={`sprint-card sprint-card--${sprint.status}`}>
              <div className="sprint-card-top">
                <div>
                  <span className={`sprint-badge sprint-badge--${sprint.status}`}>
                    {STATUS_LABEL[sprint.status]}
                  </span>
                  <h3 className="sprint-name">{sprint.name}</h3>
                  <p className="sprint-dates">{sprint.startDate} 〜 {sprint.endDate}</p>
                </div>
                <div className="sprint-actions">
                  {sprint.status === 'planned' && (
                    <button className="btn btn-primary btn-sm" onClick={() => onActivate(sprint.id)}>開始</button>
                  )}
                  {sprint.status === 'active' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setCompleteTarget(sprint)}>完了にする</button>
                  )}
                  {sprint.status !== 'completed' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditTarget(sprint)}>編集</button>
                  )}
                  {sprint.status === 'planned' && (
                    <button className="btn btn-danger-ghost btn-sm" onClick={() => onDelete(sprint.id)}>削除</button>
                  )}
                </div>
              </div>
              <div className="sprint-stats-row">
                <span>{s.count} タスク</span>
                <span>{s.total} pt 計画</span>
                <span className="done-text">{s.done} pt 完了</span>
                {sprint.status === 'completed' && sprint.velocity !== null && (
                  <span className="velocity-text">ベロシティ: <strong>{sprint.velocity}</strong> pt</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {editTarget && (
        <SprintModal
          sprint={editTarget === 'new' ? null : editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}
      {completeTarget && (
        <CompleteSprintModal
          sprint={completeTarget}
          tasks={tasks}
          sprints={sprints}
          onComplete={(velocity, action, targetId) => {
            onComplete(completeTarget.id, velocity, action, targetId)
            setCompleteTarget(null)
          }}
          onClose={() => setCompleteTarget(null)}
        />
      )}
    </div>
  )
}
