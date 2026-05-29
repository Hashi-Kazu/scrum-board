import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

export default function VelocityChart({ sprints }) {
  const completed = sprints.filter(s => s.status === 'completed' && s.velocity !== null)

  if (completed.length === 0) {
    return <div className="chart-empty">スプリントを完了するとベロシティが記録されます</div>
  }

  const data = completed.map(s => ({ name: s.name, velocity: s.velocity }))
  const avg  = Math.round(data.reduce((s, d) => s + d.velocity, 0) / data.length)

  return (
    <div className="chart-wrap">
      <div className="chart-header">
        <span className="chart-title">ベロシティ推移</span>
        <span className="chart-meta">平均 {avg} pt / スプリント</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <ReferenceLine y={avg} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: `平均 ${avg}`, fill: '#f59e0b', fontSize: 11 }} />
          <Bar dataKey="velocity" name="ベロシティ" radius={[4, 4, 0, 0]} maxBarSize={60}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === data.length - 1 ? '#6366f1' : '#3b82f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
