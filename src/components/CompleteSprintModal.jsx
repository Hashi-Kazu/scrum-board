import { useState } from 'react'

export default function CompleteSprintModal({ sprint, tasks, sprints, onComplete, onClose }) {
  const [action, setAction] = useState('backlog')
  const [targetSprintId, setTargetSprintId] = useState('')

  const sprintTasks    = tasks.filter(t => t.sprintId === sprint.id)
  const completedTasks = sprintTasks.filter(t => t.columnId === 'done')
  const incompleteTasks = sprintTasks.filter(t => t.columnId !== 'done')
  const velocity = completedTasks.reduce((s, t) => s + (t.storyPoints ?? 0), 0)
  const plannedSprints = sprints.filter(s => s.status === 'planned')

  const canSubmit = incompleteTasks.length === 0
    || action === 'backlog'
    || (action === 'next' && targetSprintId)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>スプリントを完了 — {sprint.name}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="complete-stats">
            <div className="kpi-card">
              <span className="kpi-label">完了タスク</span>
              <span className="kpi-value done">{completedTasks.length}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">未完了</span>
              <span className="kpi-value">{incompleteTasks.length}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">ベロシティ</span>
              <span className="kpi-value">{velocity} pt</span>
            </div>
          </div>

          {incompleteTasks.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <label className="form-label">未完了タスク（{incompleteTasks.length}件）の移動先</label>
              <select className="form-input" value={action} onChange={e => setAction(e.target.value)}>
                <option value="backlog">バックログへ移動</option>
                {plannedSprints.length > 0 && <option value="next">次のスプリントへ移動</option>}
              </select>
              {action === 'next' && (
                <select className="form-input" style={{ marginTop: 8 }} value={targetSprintId} onChange={e => setTargetSprintId(e.target.value)}>
                  <option value="">スプリントを選択…</option>
                  {plannedSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <div />
          <div className="modal-footer-right">
            <button className="btn btn-ghost" onClick={onClose}>キャンセル</button>
            <button
              className="btn btn-primary"
              disabled={!canSubmit}
              onClick={() => onComplete(velocity, action, targetSprintId)}
            >
              完了にする
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
