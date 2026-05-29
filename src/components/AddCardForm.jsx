import { useState } from 'react'

export default function AddCardForm({ onAdd, onCancel }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [assignee, setAssignee] = useState('')
  const [storyPoints, setStoryPoints] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({
      title: title.trim(),
      description: description.trim(),
      priority,
      assignee: assignee.trim(),
      storyPoints: storyPoints !== '' ? Number(storyPoints) : null,
    })
  }

  return (
    <form className="add-card-form" onSubmit={handleSubmit}>
      <input
        className="form-input"
        placeholder="タスクのタイトル *"
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
      />
      <textarea
        className="form-input form-textarea"
        placeholder="説明（任意）"
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={2}
      />
      <div className="form-row">
        <select className="form-input form-select" value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="high">優先度: 高</option>
          <option value="medium">優先度: 中</option>
          <option value="low">優先度: 低</option>
        </select>
        <input
          className="form-input"
          placeholder="担当者"
          value={assignee}
          onChange={e => setAssignee(e.target.value)}
        />
      </div>
      <input
        className="form-input"
        type="number"
        min="1"
        placeholder="ストーリーポイント（任意）"
        value={storyPoints}
        onChange={e => setStoryPoints(e.target.value)}
      />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={!title.trim()}>追加</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>キャンセル</button>
      </div>
    </form>
  )
}
