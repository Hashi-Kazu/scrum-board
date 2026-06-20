import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SprintsView from './SprintsView'

function sprint(overrides = {}) {
  return {
    id: 's1', name: 'Sprint 1', status: 'planned',
    startDate: '2026-06-01', endDate: '2026-06-14', velocity: null, ...overrides,
  }
}

function task(overrides = {}) {
  return { id: 't', sprintId: 's1', columnId: 'todo', storyPoints: null, ...overrides }
}

function renderView(sprints = [], tasks = [], props = {}) {
  return render(
    <SprintsView
      sprints={sprints}
      tasks={tasks}
      onAdd={props.onAdd ?? (() => {})}
      onUpdate={props.onUpdate ?? (() => {})}
      onDelete={props.onDelete ?? (() => {})}
      onActivate={props.onActivate ?? (() => {})}
      onComplete={props.onComplete ?? (() => {})}
    />
  )
}

// R-011 スプリント一覧 / S-011-06 (AT-049)
describe('SprintsView - 一覧表示 (R-011 / AT-049)', () => {
  it('スプリントが無いとき空メッセージを表示', () => {
    renderView([], [])
    expect(screen.getByText('スプリントがありません')).toBeInTheDocument()
  })

  it('完了済みを含むスプリント履歴が一覧表示される', () => {
    renderView([
      sprint({ id: 's1', name: 'Sprint 1', status: 'completed', velocity: 12 }),
      sprint({ id: 's2', name: 'Sprint 2', status: 'active' }),
    ], [])
    expect(screen.getByText('Sprint 1')).toBeInTheDocument()
    expect(screen.getByText('Sprint 2')).toBeInTheDocument()
  })

  it('ステータスバッジが日本語表記（計画中/進行中/完了）', () => {
    renderView([
      sprint({ id: 's1', status: 'planned' }),
      sprint({ id: 's2', status: 'active' }),
      sprint({ id: 's3', status: 'completed', velocity: 5 }),
    ], [])
    expect(screen.getByText('計画中')).toBeInTheDocument()
    expect(screen.getByText('進行中')).toBeInTheDocument()
    expect(screen.getByText('完了')).toBeInTheDocument()
  })
})

// R-012 スプリントSP合計 / S-012-04 (AT-057)
describe('SprintsView - スプリント統計 (R-012 / AT-057)', () => {
  it('スプリントの計画pt・完了ptを集計表示', () => {
    renderView([sprint()], [
      task({ id: 'a', columnId: 'done', storyPoints: 3 }),
      task({ id: 'b', columnId: 'todo', storyPoints: 5 }),
    ])
    expect(screen.getByText('8 pt 計画')).toBeInTheDocument()
    expect(screen.getByText('3 pt 完了')).toBeInTheDocument()
    expect(screen.getByText('2 タスク')).toBeInTheDocument()
  })

  it('別スプリントのタスクは集計対象外', () => {
    renderView([sprint({ id: 's1' })], [
      task({ id: 'a', sprintId: 's1', storyPoints: 4 }),
      task({ id: 'b', sprintId: 'other', storyPoints: 99 }),
    ])
    expect(screen.getByText('4 pt 計画')).toBeInTheDocument()
    expect(screen.getByText('1 タスク')).toBeInTheDocument()
  })
})

// R-013 ベロシティ一覧表示 / S-013-02 (AT-061)
describe('SprintsView - ベロシティ表示 (R-013 / AT-061)', () => {
  it('完了済みスプリントはベロシティ値を表示', () => {
    renderView([sprint({ status: 'completed', velocity: 13 })], [])
    expect(screen.getByText('13')).toBeInTheDocument()
    expect(screen.getByText(/ベロシティ:/)).toBeInTheDocument()
  })
})

// R-011 スプリント操作ボタン / S-011-02 (AT-045)
describe('SprintsView - 状態別アクション (R-011 / AT-045)', () => {
  it('planned は「開始」「編集」「削除」ボタンを持つ', () => {
    renderView([sprint({ status: 'planned' })], [])
    expect(screen.getByRole('button', { name: '開始' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument()
  })

  it('active は「完了にする」「編集」を持つが「開始」「削除」は無い', () => {
    renderView([sprint({ status: 'active' })], [])
    expect(screen.getByRole('button', { name: '完了にする' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '開始' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '削除' })).not.toBeInTheDocument()
  })

  it('completed は操作ボタン（開始/編集/削除/完了にする）を持たない', () => {
    renderView([sprint({ status: 'completed', velocity: 1 })], [])
    expect(screen.queryByRole('button', { name: '開始' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '編集' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '削除' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '完了にする' })).not.toBeInTheDocument()
  })

  it('「開始」で onActivate(sprintId) が呼ばれる', () => {
    const onActivate = vi.fn()
    renderView([sprint({ id: 's1', status: 'planned' })], [], { onActivate })
    fireEvent.click(screen.getByRole('button', { name: '開始' }))
    expect(onActivate).toHaveBeenCalledWith('s1')
  })

  it('「削除」で onDelete(sprintId) が呼ばれる', () => {
    const onDelete = vi.fn()
    renderView([sprint({ id: 's1', status: 'planned' })], [], { onDelete })
    fireEvent.click(screen.getByRole('button', { name: '削除' }))
    expect(onDelete).toHaveBeenCalledWith('s1')
  })

  it('「+ 新規スプリント」で SprintModal が開く', () => {
    renderView([], [])
    fireEvent.click(screen.getByRole('button', { name: '+ 新規スプリント' }))
    expect(screen.getByPlaceholderText('例: Sprint 2')).toBeInTheDocument()
  })

  it('「完了にする」で CompleteSprintModal が開く', () => {
    renderView([sprint({ status: 'active' })], [])
    fireEvent.click(screen.getByRole('button', { name: '完了にする' }))
    expect(screen.getByText(/スプリントを完了/)).toBeInTheDocument()
  })
})
