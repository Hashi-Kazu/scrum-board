import { useState, useEffect } from 'react'

export default function CardModal({ task, sprints = [], onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority] = useState(task.priority)
  const [assignee, setAssignee] = useState(task.assignee ?? '')
  const [storyPoints, setStoryPoints] = useState(task.storyPoints ?? '')
  const [sprintId, setSprintId] = useState(task.sprintId ?? '')
  const [dueDate, setDueDate] = useState(task.dueDate ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      assignee: assignee.trim(),
      storyPoints: storyPoints !== '' ? Number(storyPoints) : null,
      sprintId: sprintId || null,
      dueDate: dueDate || null,
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>タスクを編集</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <label className="form-label">タイトル</label>
          <input
            className="form-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />

          <label className="form-label">説明</label>
          <textarea
            className="form-input form-textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />

          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label className="form-label">優先度</label>
              <select className="form-input form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">担当者</label>
              <input className="form-input" value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="名前" />
            </div>
          </div>
          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label className="form-label">ストーリーポイント</label>
              <input
                className="form-input"
                type="number"
                min="1"
                placeholder="未設定"
                value={storyPoints}
                onChange={e => setStoryPoints(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">期限</label>
              <input
                className="form-input"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>
          {sprints.length > 0 && (
            <div>
              <label className="form-label">スプリント</label>
              <select className="form-input form-select" value={sprintId} onChange={e => setSprintId(e.target.value)}>
                <option value="">未割り当て</option>
                {sprints.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {confirmDelete ? (
            <div className="delete-confirm">
              <span>本当に削除しますか？</span>
              <button className="btn btn-danger" onClick={onDelete}>削除する</button>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>キャンセル</button>
            </div>
          ) : (
            <>
              <button className="btn btn-danger-ghost" onClick={() => setConfirmDelete(true)}>削除</button>
              <div className="modal-footer-right">
                <button className="btn btn-ghost" onClick={onClose}>キャンセル</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={!title.trim()}>保存</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
