import { useState, useEffect } from 'react'
import { avatarColor } from '../lib/taskLogic'

export default function AssigneesModal({ assignees, defaultAssignee, onAdd, onRename, onDelete, onSetDefault, onClearDefault, onClose }) {
  const [newName, setNewName]     = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName]   = useState('')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleAdd = () => {
    if (!newName.trim()) return
    onAdd(newName.trim())
    setNewName('')
  }

  const handleRename = (id) => {
    if (editName.trim() && editName.trim() !== assignees.find(a => a.id === id)?.name) {
      onRename(id, editName.trim())
    }
    setEditingId(null)
  }

  const handleDelete = (a) => {
    if (window.confirm(`「${a.name}」を削除しますか？\nこの担当者が設定されているタスクは未設定になります。`)) {
      onDelete(a.id)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>👥 担当者を管理</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* デフォルト設定 */}
          <div className="assignee-default-row">
            <span className="form-label" style={{ margin: 0 }}>デフォルト担当者</span>
            <div className="assignee-default-options">
              <label className="assignee-radio">
                <input
                  type="radio"
                  checked={!defaultAssignee}
                  onChange={onClearDefault}
                />
                <span>未設定</span>
              </label>
              {assignees.map(a => (
                <label key={a.id} className="assignee-radio">
                  <input
                    type="radio"
                    checked={defaultAssignee?.id === a.id}
                    onChange={() => onSetDefault(a.id)}
                  />
                  <span
                    className="assignee-avatar-sm"
                    style={{ background: avatarColor(a.name) }}
                  >{a.name[0]}</span>
                  <span>{a.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="project-divider" />

          {/* 担当者リスト */}
          <div className="assignee-list">
            {assignees.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                担当者が登録されていません
              </p>
            )}
            {assignees.map(a => (
              <div key={a.id} className="assignee-row">
                <span className="assignee-avatar-sm" style={{ background: avatarColor(a.name) }}>
                  {a.name[0]}
                </span>
                {editingId === a.id ? (
                  <input
                    className="project-edit-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(a.id); if (e.key === 'Escape') setEditingId(null) }}
                    onBlur={() => handleRename(a.id)}
                    autoFocus
                  />
                ) : (
                  <span className="assignee-name-text">{a.name}</span>
                )}
                <div className="assignee-row-actions">
                  <button className="project-action-btn" onClick={() => { setEditingId(a.id); setEditName(a.name) }} title="名前を変更">✏️</button>
                  <button className="project-action-btn project-action-btn--danger" onClick={() => handleDelete(a)} title="削除">🗑</button>
                </div>
              </div>
            ))}
          </div>

          {/* 追加フォーム */}
          <div className="assignee-add-form">
            <input
              className="form-input"
              placeholder="担当者名を入力"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={!newName.trim()}>追加</button>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  )
}
