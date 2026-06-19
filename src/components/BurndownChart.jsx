import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function buildData(sprint, tasks) {
  const sprintTasks = tasks.filter(t => t.sprintId === sprint.id && (t.storyPoints ?? 0) > 0)
  const total = sprintTasks.reduce((s, t) => s + t.storyPoints, 0)
  if (total === 0) return null

  const start = new Date(sprint.startDate); start.setHours(0, 0, 0, 0)
  const end   = new Date(sprint.endDate);   end.setHours(23, 59, 59, 999)
  const now   = new Date()
  const days  = Math.round((end - start) / 86400000) + 1

  return {
    total,
    rows: Array.from({ length: days }, (_, i) => {
      const d = new Date(start.getTime() + i * 86400000)
      const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999)
      const ideal = Math.round((total - (total / Math.max(days - 1, 1)) * i) * 10) / 10

      let actual
      if (dEnd <= now) {
        const done = sprintTasks
          .filter(t => t.completedAt && new Date(t.completedAt) <= dEnd)
          .reduce((s, t) => s + t.storyPoints, 0)
        actual = total - done
      }

      return { date: `${d.getMonth() + 1}/${d.getDate()}`, ideal, actual }
    }),
  }
}

export default function BurndownChart({ sprint, tasks }) {
  const result = buildData(sprint, tasks)

  if (!result) {
    return <div className="chart-empty">タスクにストーリーポイントを設定するとバーンダウンチャートが表示されます</div>
  }

  // 遅延チェック: 直近の実績 > 理想の1.2倍
  const latest = [...result.rows].reverse().find(r => r.actual !== undefined)
  const latestIdeal = latest ? result.rows.find(r => r.date === latest.date)?.ideal : null
  const isDelayed = latest && latestIdeal != null && latest.actual > latestIdeal * 1.2

  return (
    <div className="chart-wrap">
      <div className="chart-header">
        <span className="chart-title">バーンダウンチャート</span>
        <span className="chart-meta">合計 {result.total} pt</span>
        {isDelayed && <span className="chart-warning">⚠ 遅延</span>}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={result.rows} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
          <Line type="monotone" dataKey="ideal" stroke="#475569" strokeDasharray="5 3" dot={false} name="理想" strokeWidth={1.5} />
          <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} name="実績" connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
