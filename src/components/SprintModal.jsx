import { useState } from 'react'

export default function SprintModal({ sprint, onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10)
  const [name, setName] = useState(sprint?.name ?? '')
  const [startDate, setStartDate] = useState(sprint?.startDate ?? today)
  const [endDate, setEndDate] = useState(sprint?.endDate ?? '')

  const valid = name.trim() && startDate && endDate && endDate >= startDate

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{sprint ? 'スプリントを編集' : '新規スプリント'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label className="form-label">スプリント名</label>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例: Sprint 2"
            autoFocus
          />
          <label className="form-label">開始日</label>
          <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label className="form-label">終了日</label>
          <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div className="modal-footer">
          <div />
          <div className="modal-footer-right">
            <button className="btn btn-ghost" onClick={onClose}>キャンセル</button>
            <button className="btn btn-primary" disabled={!valid} onClick={() => onSave({ name: name.trim(), startDate, endDate })}>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
