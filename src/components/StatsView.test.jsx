import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatsView from './StatsView'

function sprint(overrides = {}) {
  return {
    id: 's1', name: 'Sprint 1', status: 'active',
    startDate: '2026-06-01', endDate: '2026-06-14', velocity: null, ...overrides,
  }
}

function task(overrides = {}) {
  return { id: 't', sprintId: 's1', columnId: 'todo', storyPoints: null, completedAt: null, ...overrides }
}

// R-009/R-012 スプリント統計 KPI (AT-057)
describe('StatsView - KPI集計 (R-012 / AT-057)', () => {
  it('スプリントが無ければ案内メッセージ', () => {
    render(<StatsView sprints={[]} tasks={[]} />)
    expect(screen.getByText(/スプリントがありません/)).toBeInTheDocument()
  })

  it('計画pt・完了pt・残りpt・達成率を集計表示', () => {
    render(<StatsView sprints={[sprint()]} tasks={[
      task({ id: 'a', columnId: 'done', storyPoints: 4 }),
      task({ id: 'b', columnId: 'todo', storyPoints: 6 }),
    ]} />)
    expect(screen.getByText('10 pt')).toBeInTheDocument() // 計画
    expect(screen.getByText('4 pt')).toBeInTheDocument()   // 完了
    expect(screen.getByText('6 pt')).toBeInTheDocument()   // 残り
    expect(screen.getByText('40%')).toBeInTheDocument()    // 達成率 4/10
  })

  it('計画pt=0 のとき達成率は0%', () => {
    render(<StatsView sprints={[sprint()]} tasks={[]} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})

// R-013 SP未設定の除外件数明示 / S-013-05 (AT-064)
describe('StatsView - SP未設定の除外注記 (R-013 / AT-064)', () => {
  it('SP未設定タスクがあると除外件数を注記表示', () => {
    render(<StatsView sprints={[sprint()]} tasks={[
      task({ id: 'a', columnId: 'done', storyPoints: 3 }),
      task({ id: 'b', columnId: 'todo', storyPoints: null }),
      task({ id: 'c', columnId: 'todo', storyPoints: 0 }),
    ]} />)
    expect(screen.getByText(/ストーリーポイント未設定 2 件/)).toBeInTheDocument()
  })

  it('全タスクにSP設定済みなら除外注記は出ない', () => {
    render(<StatsView sprints={[sprint()]} tasks={[
      task({ id: 'a', columnId: 'done', storyPoints: 3 }),
    ]} />)
    expect(screen.queryByText(/ストーリーポイント未設定/)).not.toBeInTheDocument()
  })
})

// R-013 完了スプリントのベロシティ表示 / S-013-01 (AT-060)
describe('StatsView - 完了スプリントのベロシティKPI (R-013 / AT-060)', () => {
  it('completed かつ velocity あればベロシティKPIを表示', () => {
    render(<StatsView
      sprints={[sprint({ status: 'completed', velocity: 9 })]}
      tasks={[task({ id: 'a', columnId: 'done', storyPoints: 9 })]}
    />)
    expect(screen.getByText('ベロシティ')).toBeInTheDocument()
  })
})

// R-018 ステータス日本語表記 / S-018-04 (AT-093)
describe('StatsView - スプリント選択肢の日本語表記 (R-018 / AT-093)', () => {
  it('セレクトの選択肢に日本語ステータスが含まれる', () => {
    render(<StatsView sprints={[
      sprint({ id: 's1', name: 'S1', status: 'active' }),
      sprint({ id: 's2', name: 'S2', status: 'completed', velocity: 1 }),
      sprint({ id: 's3', name: 'S3', status: 'planned' }),
    ]} tasks={[]} />)
    expect(screen.getByRole('option', { name: 'S1（進行中）' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'S2（完了）' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'S3（計画中）' })).toBeInTheDocument()
  })

  it('既定で active スプリントが選択される', () => {
    render(<StatsView sprints={[
      sprint({ id: 's1', name: 'S1', status: 'planned' }),
      sprint({ id: 's2', name: 'S2', status: 'active' }),
    ]} tasks={[]} />)
    expect(document.querySelector('.sprint-select-stats').value).toBe('s2')
  })
})

// R-014 遅延バナー / S-014-05 (AT-069)
describe('StatsView - 遅延バナー (R-014 / AT-069)', () => {
  it('active スプリントで残りが理想を大きく超えると遅延バナーを表示', () => {
    // 期間が過去 → elapsed=total, ideal=0。残り>0 なので遅延扱い。
    render(<StatsView
      sprints={[sprint({ status: 'active', startDate: '2026-01-01', endDate: '2026-01-05' })]}
      tasks={[task({ id: 'a', columnId: 'todo', storyPoints: 8 })]}
    />)
    expect(screen.getByText(/進捗が理想ペースより遅れています/)).toBeInTheDocument()
  })
})
