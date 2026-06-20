import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CompleteSprintModal from './CompleteSprintModal'

const sprint = { id: 's1', name: 'Sprint 1', status: 'active' }

function task(overrides = {}) {
  return { id: 't', sprintId: 's1', columnId: 'todo', storyPoints: null, ...overrides }
}

function renderModal(tasks = [], props = {}) {
  return render(
    <CompleteSprintModal
      sprint={sprint}
      tasks={tasks}
      sprints={props.sprints ?? [sprint]}
      onComplete={props.onComplete ?? (() => {})}
      onClose={props.onClose ?? (() => {})}
    />
  )
}

// R-013 ベロシティ算出 / S-013-01 (AT-060)
describe('CompleteSprintModal - KPI集計 (R-013 / AT-060)', () => {
  it('完了タスク数・未完了数・ベロシティを集計表示する', () => {
    renderModal([
      task({ id: 'a', columnId: 'done', storyPoints: 3 }),
      task({ id: 'b', columnId: 'done', storyPoints: 5 }),
      task({ id: 'c', columnId: 'todo', storyPoints: 2 }),
    ])
    const values = [...document.querySelectorAll('.kpi-value')].map(e => e.textContent)
    // 完了2件 / 未完了1件 / ベロシティ8pt
    expect(values).toEqual(['2', '1', '8 pt'])
  })

  it('ベロシティは「完了」カラムのSP合計（SP未設定は0扱い）', () => {
    renderModal([
      task({ id: 'a', columnId: 'done', storyPoints: 5 }),
      task({ id: 'b', columnId: 'done', storyPoints: null }),
    ])
    expect(screen.getByText('5 pt')).toBeInTheDocument()
  })

  it('別スプリントのタスクは集計対象外', () => {
    renderModal([
      task({ id: 'a', sprintId: 's1', columnId: 'done', storyPoints: 4 }),
      task({ id: 'b', sprintId: 'other', columnId: 'done', storyPoints: 99 }),
    ])
    expect(screen.getByText('4 pt')).toBeInTheDocument()
    expect(screen.queryByText('103 pt')).not.toBeInTheDocument()
  })
})

// R-011 未完了タスク移動 / S-011-05 (AT-048)
describe('CompleteSprintModal - 未完了タスクの移動先 (R-011 / AT-048)', () => {
  it('未完了タスクがあるとき移動先セレクトが表示される', () => {
    renderModal([task({ columnId: 'todo' })])
    expect(screen.getByText(/未完了タスク（1件）の移動先/)).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'バックログへ移動' })).toBeInTheDocument()
  })

  it('未完了タスクが無ければ移動先セレクトは出ない', () => {
    renderModal([task({ columnId: 'done', storyPoints: 1 })])
    expect(screen.queryByText(/の移動先/)).not.toBeInTheDocument()
  })

  it('planned スプリントが無ければ「次のスプリントへ移動」が選べない', () => {
    renderModal([task({ columnId: 'todo' })], { sprints: [sprint] })
    expect(screen.queryByRole('option', { name: '次のスプリントへ移動' })).not.toBeInTheDocument()
  })

  it('planned スプリントがあれば「次のスプリントへ移動」が選べる', () => {
    renderModal([task({ columnId: 'todo' })], {
      sprints: [sprint, { id: 's2', name: 'Sprint 2', status: 'planned' }],
    })
    expect(screen.getByRole('option', { name: '次のスプリントへ移動' })).toBeInTheDocument()
  })

  it('「次のスプリントへ移動」選択時、対象スプリント未選択だと完了ボタンが非活性', () => {
    renderModal([task({ columnId: 'todo' })], {
      sprints: [sprint, { id: 's2', name: 'Sprint 2', status: 'planned' }],
    })
    const select = document.querySelector('select')
    fireEvent.change(select, { target: { value: 'next' } })
    expect(screen.getByRole('button', { name: '完了にする' })).toBeDisabled()
  })

  it('「次のスプリントへ移動」で対象を選ぶと完了ボタンが活性化', () => {
    renderModal([task({ columnId: 'todo' })], {
      sprints: [sprint, { id: 's2', name: 'Sprint 2', status: 'planned' }],
    })
    const actionSelect = document.querySelector('select')
    fireEvent.change(actionSelect, { target: { value: 'next' } })
    const targetSelect = document.querySelectorAll('select')[1]
    fireEvent.change(targetSelect, { target: { value: 's2' } })
    expect(screen.getByRole('button', { name: '完了にする' })).toBeEnabled()
  })
})

// R-011 完了確定 / S-011-05
describe('CompleteSprintModal - 完了確定 (R-011)', () => {
  it('未完了が無ければ既定(backlog)で完了ボタンが活性', () => {
    renderModal([task({ columnId: 'done', storyPoints: 3 })])
    expect(screen.getByRole('button', { name: '完了にする' })).toBeEnabled()
  })

  it('完了ボタンで onComplete(velocity, action, targetId) が呼ばれる', () => {
    const onComplete = vi.fn()
    renderModal([task({ columnId: 'done', storyPoints: 7 })], { onComplete })
    fireEvent.click(screen.getByRole('button', { name: '完了にする' }))
    expect(onComplete).toHaveBeenCalledWith(7, 'backlog', '')
  })

  it('キャンセル・背景クリックで onClose が呼ばれる (AT-010相当)', () => {
    const onClose = vi.fn()
    renderModal([task({ columnId: 'done', storyPoints: 1 })], { onClose })
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    fireEvent.click(document.querySelector('.modal-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
