import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import CardModal from './CardModal'
import { priorityMeta, avatarColor, formatDue, dueBadgeClass as computeDueBadgeClass, normalizeStoryPoints } from '../lib/taskLogic'

export default function Card({ task, columnId, sprints, assignees, onUpdate, onDelete, isOverlay }) {
  const [showModal, setShowModal] = useState(false)
  const [editingSP,  setEditingSP]  = useState(false)
  const [spVal,      setSpVal]      = useState('')
  const [editingDue, setEditingDue] = useState(false)
  const [dueVal,     setDueVal]     = useState('')

  const sprint = sprints?.find(s => s.id === task.sprintId)

  const dueBadgeClass = () => computeDueBadgeClass(task)

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
    onUpdate(task.id, { storyPoints: normalizeStoryPoints(spVal) })
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

  const meta = priorityMeta(task.priority)

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`card ${isOverlay ? 'card--overlay' : ''}`}
      >
        <div className="card-top">
          <span className={`priority-badge ${meta.className}`}>{meta.label}</span>
          <div className="card-top-right">
            {/* ドラッグハンドル：タッチではここだけDnD有効 */}
            <span
              className="drag-handle"
              {...attributes}
              {...listeners}
              title="ドラッグして移動"
            >⠿</span>
            <button
              className="card-menu-btn"
              onPointerDown={e => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setShowModal(true) }}
              title="編集"
            >
              ⋯
            </button>
          </div>
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
              📅 {formatDue(task.dueDate) ?? '–'}
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
          assignees={assignees}
          onSave={(updates) => { onUpdate(task.id, updates); setShowModal(false) }}
          onDelete={() => { onDelete(task.id); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}