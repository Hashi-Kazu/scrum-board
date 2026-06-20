import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BurndownChart from './BurndownChart'

function sprint(overrides = {}) {
  return { id: 's1', name: 'Sprint 1', startDate: '2026-06-01', endDate: '2026-06-14', ...overrides }
}

function task(overrides = {}) {
  return { id: 't', sprintId: 's1', columnId: 'todo', storyPoints: null, completedAt: null, ...overrides }
}

// R-014 バーンダウンチャート / S-014-01 (AT-065, AT-067)
describe('BurndownChart (R-014 / AT-065,067)', () => {
  it('SP設定済みタスクが無ければ案内メッセージ', () => {
    render(<BurndownChart sprint={sprint()} tasks={[task({ storyPoints: null })]} />)
    expect(screen.getByText(/バーンダウンチャートが表示されます/)).toBeInTheDocument()
  })

  it('SP=0 だけの場合も案内メッセージ（合計0は描画しない）', () => {
    render(<BurndownChart sprint={sprint()} tasks={[task({ storyPoints: 0 })]} />)
    expect(screen.getByText(/バーンダウンチャートが表示されます/)).toBeInTheDocument()
  })

  it('SP設定済みタスクがあれば合計ptをヘッダーに表示 (AT-065)', () => {
    render(<BurndownChart sprint={sprint()} tasks={[
      task({ id: 'a', storyPoints: 3 }),
      task({ id: 'b', storyPoints: 5 }),
    ]} />)
    expect(screen.getByText('合計 8 pt')).toBeInTheDocument()
    expect(screen.getByText('バーンダウンチャート')).toBeInTheDocument()
  })

  it('別スプリントのタスクは合計に含めない', () => {
    render(<BurndownChart sprint={sprint({ id: 's1' })} tasks={[
      task({ id: 'a', sprintId: 's1', storyPoints: 4 }),
      task({ id: 'b', sprintId: 'other', storyPoints: 99 }),
    ]} />)
    expect(screen.getByText('合計 4 pt')).toBeInTheDocument()
  })

  it('過去期間のスプリントで実績が理想を大きく超えると遅延警告を表示 (AT-069)', () => {
    // 期間が完全に過去で、completedAt が無い → 実績は total のまま（理想は最終日0）。
    render(<BurndownChart
      sprint={sprint({ startDate: '2026-01-01', endDate: '2026-01-05' })}
      tasks={[task({ id: 'a', storyPoints: 10, completedAt: null })]}
    />)
    expect(screen.getByText('⚠ 遅延')).toBeInTheDocument()
  })

  it('過去期間で全て完了済みなら遅延警告は出ない', () => {
    render(<BurndownChart
      sprint={sprint({ startDate: '2026-01-01', endDate: '2026-01-05' })}
      tasks={[task({ id: 'a', storyPoints: 10, completedAt: '2026-01-01T00:00:00Z' })]}
    />)
    expect(screen.queryByText('⚠ 遅延')).not.toBeInTheDocument()
  })
})
