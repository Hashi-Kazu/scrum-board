import { useState } from 'react'
import BurndownChart from './BurndownChart'
import VelocityChart from './VelocityChart'

export default function StatsView({ sprints, tasks }) {
  const defaultId = sprints.find(s => s.status === 'active')?.id ?? sprints[0]?.id ?? ''
  const [selectedId, setSelectedId] = useState(defaultId)

  const sprint = sprints.find(s => s.id === selectedId)
  const sprintTasks = sprint ? tasks.filter(t => t.sprintId === sprint.id) : []
  const totalPt     = sprintTasks.reduce((s, t) => s + (t.storyPoints ?? 0), 0)
  const donePt      = sprintTasks.filter(t => t.columnId === 'done').reduce((s, t) => s + (t.storyPoints ?? 0), 0)
  const noPtCount   = sprintTasks.filter(t => !t.storyPoints).length

  // 遅延判定
  let isDelayed = false
  if (sprint?.status === 'active' && totalPt > 0) {
    const start = new Date(sprint.startDate); start.setHours(0, 0, 0, 0)
    const end   = new Date(sprint.endDate);   end.setHours(23, 59, 59, 999)
    const now   = new Date()
    const total = (end - start) / 86400000
    const elapsed = Math.min((now - start) / 86400000, total)
    const ideal = totalPt * (1 - elapsed / total)
    isDelayed = (totalPt - donePt) > ideal * 1.2
  }

  if (sprints.length === 0) {
    return <div className="stats-view"><div className="chart-empty">スプリントがありません。スプリント管理から作成してください。</div></div>
  }

  return (
    <div className="stats-view">
      <div className="stats-topbar">
        <h2>スプリント統計</h2>
        <select
          className="form-input sprint-select-stats"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {sprints.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}（{s.status === 'active' ? '進行中' : s.status === 'completed' ? '完了' : '計画中'}）
            </option>
          ))}
        </select>
      </div>

      {sprint && (
        <>
          {isDelayed && (
            <div className="delay-banner">
              ⚠️ 進捗が理想ペースより遅れています — 残り <strong>{totalPt - donePt}</strong> pt
            </div>
          )}

          <div className="kpi-row">
            <div className="kpi-card"><span className="kpi-label">計画</span><span className="kpi-value">{totalPt} pt</span></div>
            <div className="kpi-card"><span className="kpi-label">完了</span><span className="kpi-value kpi-done">{donePt} pt</span></div>
            <div className="kpi-card"><span className="kpi-label">残り</span><span className={`kpi-value ${isDelayed ? 'kpi-warn' : ''}`}>{totalPt - donePt} pt</span></div>
            <div className="kpi-card"><span className="kpi-label">達成率</span><span className="kpi-value">{totalPt > 0 ? Math.round(donePt / totalPt * 100) : 0}%</span></div>
            {sprint.status === 'completed' && sprint.velocity !== null && (
              <div className="kpi-card"><span className="kpi-label">ベロシティ</span><span className="kpi-value kpi-done">{sprint.velocity} pt</span></div>
            )}
          </div>

          {noPtCount > 0 && (
            <p className="no-pt-note">※ ストーリーポイント未設定 {noPtCount} 件はベロシティ計算から除外されています</p>
          )}

          <div className="charts-grid">
            <BurndownChart sprint={sprint} tasks={tasks} />
            <VelocityChart sprints={sprints} />
          </div>
        </>
      )}
    </div>
  )
}
