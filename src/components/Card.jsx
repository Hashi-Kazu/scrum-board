import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import CardModal from './CardModal'

const PRIORITY_META = {
  high:   { label: '高', className: 'priority--high' },
  medium: { label: '中', className: 'priority--medium' },
  low:    { label: '低', className: 'priority--low' },
}

const AVATAR_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']
const avatarColor = (name) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

export default function Card({ task, columnId, sprints, onUpdate, onDelete, isOverlay }) {
  const [showModal, setShowModal] = useState(false)
  const [editingSP,  setEditingSP]  = useState(false)
  const [spVal,      setSpVal]      = useState('')
  const [editingDue, setEditingDue] = useState(false)
  const [dueVal,     setDueVal]     = useState('')

  const sprint = sprints?.find(s => s.id === task.sprintId)

  // 期限の表示フォーマット
  const formatDue = (d) => {
    if (!d) return null
    const dt = new Date(d + 'T00:00:00')
    return `${dt.getMonth() + 1}/${dt.getDate()}`
  }
  const dueBadgeClass = () => {
    if (!task.dueDate || task.columnId === 'done') return 'due-badge--set'
    const today = new Date(); today.setHours(0,0,0,0)
    const due   = new Date(task.dueDate + 'T00:00:00')
    if (due < today) return 'due-badge--overdue'
    const diff = (due - today) / 86400000
    if (diff <= 2) return 'due-badge--soon'
    return 'due-badge--set'
  }

  const startEditDue = (e) => {
    e.stopPropagation()
    setDueVal(task.dueDate ?? '')
    setEditingDue(true)
  }
  const commitDue = () => {
    setEditingDue(false)
    onUpdate(task.id, { dueDate: dueVal || null })
  }

  const startEditSP = (e) => {
    e.stopPropagation()
    setSpVal(task.storyPoints != null ? String(task.storyPoints) : '')
    setEditingSP(true)
  }
  const commitSP = () => {
    setEditingSP(false)
    const n = spVal.trim()
    const val = n === '' ? null : Math.max(1, parseInt(n, 10)) || null
    onUpdate(task.id, { storyPoints: val })
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { columnId },
    disabled: isOverlay,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const meta = PRIORITY_META[task.priority] ?? PRIORITY_META.medium

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`card ${isOverlay ? 'card--overlay' : ''}`}
        {...attributes}
        {...listeners}
      >
        <div className="card-top">
          <span className={`priority-badge ${meta.className}`}>{meta.label}</span>
          <button
            className="card-menu-btn"
            onPointerDown={e => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setShowModal(true) }}
            title="編集"
          >
            ⋯
          </button>
        </div>
        <p className="card-title">{task.title}</p>
        {task.description && <p className="card-desc">{task.description}</p>}
        {sprint && (
          <div className="card-sprint">
            <span className="sprint-chip">🏃 {sprint.name}</span>
          </div>
        )}
        <div className="card-footer">
          {task.assignee && (
            <>
              <span className="assignee-avatar" style={{ background: avatarColor(task.assignee) }}>
                {task.assignee[0]}
              </span>
              <span className="assignee-name">{task.assignee}</span>
            </>
          )}
          {/* 期限：クリックでインライン編集 */}
          {editingDue ? (
            <input
              className="due-input"
              type="date"
              autoFocus
              value={dueVal}
              onPointerDown={e => e.stopPropagation()}
              onChange={e => setDueVal(e.target.value)}
              onBlur={commitDue}
              onKeyDown={e => { if (e.key === 'Enter') commitDue(); if (e.key === 'Escape') setEditingDue(false) }}
            />
          ) : (
            <span
              className={`due-badge ${task.dueDate ? dueBadgeClass() : ''}`}
              onPointerDown={e => e.stopPropagation()}
              onClick={startEditDue}
              title="期限をクリックして設定"
            >
              <svg className="due-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="12" height="11" rx="1.5"/>
                <path d="M2 7h12"/>
                <path d="M5 1v4M11 1v4"/>
              </svg>
              {formatDue(task.dueDate) ?? '–'}
            </span>
          )}

          {/* ストーリーポイント：クリックでインライン編集 */}
          {editingSP ? (
            <input
              className="sp-input"
              type="number"
              min="1"
              autoFocus
              value={spVal}
              onPointerDown={e => e.stopPropagation()}
              onChange={e => setSpVal(e.target.value)}
              onBlur={commitSP}
              onKeyDown={e => { if (e.key === 'Enter') commitSP(); if (e.key === 'Escape') setEditingSP(false) }}
            />
          ) : (
            <span
              className={`sp-badge ${task.storyPoints == null ? 'sp-badge--empty' : ''}`}
              onPointerDown={e => e.stopPropagation()}
              onClick={startEditSP}
              title="クリックして編集"
            >
              {task.storyPoints != null ? `${task.storyPoints} pt` : '– pt'}
            </span>
          )}
        </div>
      </div>

      {showModal && (
        <CardModal
          task={task}
          sprints={sprints}
          onSave={(updates) => { onUpdate(task.id, updates); setShowModal(false) }}
          onDelete={() => { onDelete(task.id); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
