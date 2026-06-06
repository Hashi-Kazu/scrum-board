import { useState, useRef, useEffect } from 'react'

export default function ProjectSelector({ projects, selectedId, onSelect, onAdd, onRename, onDelete, onManageAssignees }) {
  const [open, setOpen]         = useState(false)
  const [adding, setAdding]     = useState(false)
  const [newName, setNewName]   = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const ref = useRef(null)

  // クリック外で閉じる
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = projects.find(p => p.id === selectedId)
  const label = current?.name ?? '…'

  const handleAdd = () => {
    if (!newName.trim()) return
    onAdd(newName.trim())
    setNewName('')
    setAdding(false)
    setOpen(false)
  }

  const handleRename = (id) => {
    if (editName.trim() && editName.trim() !== projects.find(p => p.id === id)?.name) {
      onRename(id, editName.trim())
    }
    setEditingId(null)
  }

  const handleDelete = (p) => {
    if (window.confirm(`「${p.name}」を削除しますか？\nこのプロジェクトのタスクとスプリントもすべて削除されます。`)) {
      onDelete(p.id, projects)
      setOpen(false)
    }
  }

  return (
    <div className="project-selector" ref={ref}>
      <button className="project-trigger" onClick={() => setOpen(o => !o)} title="プロジェクトを切り替え">
        <span className="project-trigger-icon">🗂</span>
        <span className="project-trigger-meta">
          <span className="project-trigger-label">PROJECT</span>
          <span className="project-trigger-name">{label}</span>
        </span>
        <span className="project-trigger-arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="project-dropdown">
          {projects.map(p => (
            <div key={p.id} className={`project-item ${p.id === selectedId ? 'project-item--active' : ''}`}>
              {editingId === p.id ? (
                <input
                  className="project-edit-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRename(p.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onBlur={() => handleRename(p.id)}
                  autoFocus
                />
              ) : (
                <button
                  className="project-item-name"
                  onClick={() => { onSelect(p.id); setOpen(false) }}
                >
                  {p.id === selectedId && <span className="project-check">✓</span>}
                  {p.name}
                </button>
              )}
              <div className="project-item-actions">
                <button
                  className="project-action-btn"
                  title="名前を変更"
                  onClick={(e) => { e.stopPropagation(); setEditingId(p.id); setEditName(p.name) }}
                >✏️</button>
                {projects.length > 1 && (
                  <button
                    className="project-action-btn"
                    title="削除"
                    onClick={(e) => { e.stopPropagation(); handleDelete(p) }}
                  >🗑</button>
                )}
              </div>
            </div>
          ))}

          <div className="project-divider" />

          {adding ? (
            <div className="project-add-form">
              <input
                className="project-edit-input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Escape') { setAdding(false); setNewName('') }
                }}
                placeholder="プロジェクト名"
                autoFocus
              />
              <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={!newName.trim()}>追加</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setNewName('') }}>✕</button>
            </div>
          ) : (
            <button className="project-add-btn" onClick={() => setAdding(true)}>
              ＋ 新しいプロジェクト
            </button>
          )}
          <div className="project-divider" />
          <button className="project-add-btn" onClick={() => { setOpen(false); onManageAssignees?.() }}>
            👥 担当者を管理
          </button>
        </div>
      )}
    </div>
  )
}
