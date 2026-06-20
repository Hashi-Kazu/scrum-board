import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import VelocityChart from './VelocityChart'

// recharts の ResponsiveContainer は jsdom で幅0のため SVG 内部は描画されない。
// ここでは空状態とヘッダー(平均値)の算出を検証する。

// R-013 ベロシティグラフ / S-013-03,04 (AT-062, AT-063)
describe('VelocityChart (R-013 / AT-062,063)', () => {
  it('完了スプリントが無ければ案内メッセージ', () => {
    render(<VelocityChart sprints={[]} />)
    expect(screen.getByText(/スプリントを完了するとベロシティが記録されます/)).toBeInTheDocument()
  })

  it('velocity が null の完了スプリントしか無い場合も案内メッセージ', () => {
    render(<VelocityChart sprints={[{ id: 's1', name: 'S1', status: 'completed', velocity: null }]} />)
    expect(screen.getByText(/ベロシティが記録されます/)).toBeInTheDocument()
  })

  it('完了スプリントがあれば平均ベロシティをヘッダーに表示 (AT-063)', () => {
    render(<VelocityChart sprints={[
      { id: 's1', name: 'S1', status: 'completed', velocity: 10 },
      { id: 's2', name: 'S2', status: 'completed', velocity: 14 },
    ]} />)
    // (10+14)/2 = 12
    expect(screen.getByText('平均 12 pt / スプリント')).toBeInTheDocument()
    expect(screen.getByText('ベロシティ推移')).toBeInTheDocument()
  })

  it('active / planned スプリントは集計対象外', () => {
    render(<VelocityChart sprints={[
      { id: 's1', name: 'S1', status: 'completed', velocity: 8 },
      { id: 's2', name: 'S2', status: 'active', velocity: null },
      { id: 's3', name: 'S3', status: 'planned', velocity: null },
    ]} />)
    expect(screen.getByText('平均 8 pt / スプリント')).toBeInTheDocument()
  })
})
