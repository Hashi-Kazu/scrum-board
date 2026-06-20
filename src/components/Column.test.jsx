import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Column from './Column'

// Card は @dnd-kit/sortable / utilities に依存するためモックする
vi.mock('@dnd-kit/sortable', async () => {
  const actual = await vi.importActual('@dnd-kit/sortable')
  return {
    ...actual,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      transition: null,
      isDragging: false,
    }),
  }
})
vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

const column = { id: 'todo', title: '未着手', color: '#3b82f6' }

function task(overrides = {}) {
  return {
    id: 't1',
    title: 'タスク',
    description: '',
    priority: 'medium',
    assignee: '',
    storyPoints: null,
    sprintId: null,
    dueDate: null,
    columnId: 'todo',
    ...overrides,
  }
}

function renderColumn(tasks = [], props = {}) {
  return render(
    <Column
      column={column}
      tasks={tasks}
      sprints={props.sprints ?? []}
      assignees={props.assignees ?? []}
      defaultAssignee={props.defaultAssignee ?? null}
      onAddTask={props.onAddTask ?? (() => {})}
      onUpdateTask={() => {}}
      onDeleteTask={() => {}}
    />
  )
}

// R-004 カラムヘッダー / S-004-02 (AT-017)
describe('Column - ヘッダー表示 (R-004 / AT-017)', () => {
  it('カラム名が表示される', () => {
    renderColumn([])
    expect(screen.getByText('未着手')).toBeInTheDocument()
  })

  it('タスク件数バッジが表示される', () => {
    renderColumn([task({ id: 'a' }), task({ id: 'b' })])
    expect(document.querySelector('.column-count').textContent).toBe('2')
  })

  it('タスク0件のとき件数バッジは0', () => {
    renderColumn([])
    expect(document.querySelector('.column-count').textContent).toBe('0')
  })
})

// R-004 空カラム案内 / S-004-05 (AT-020)
describe('Column - 空カラム案内 (R-004 / AT-020)', () => {
  it('タスク0件のとき「タスクをここにドロップ」が表示される', () => {
    renderColumn([])
    expect(screen.getByText('タスクをここにドロップ')).toBeInTheDocument()
  })

  it('タスクがあるときは案内テキストが表示されない', () => {
    renderColumn([task()])
    expect(screen.queryByText('タスクをここにドロップ')).not.toBeInTheDocument()
  })
})

// R-012 カラム内SP合計 / S-012-03 (AT-056)
describe('Column - SP合計バッジ (R-012 / AT-056)', () => {
  it('カラム内タスクのSP合計が表示される', () => {
    renderColumn([task({ id: 'a', storyPoints: 3 }), task({ id: 'b', storyPoints: 5 })])
    expect(screen.getByText('8pt')).toBeInTheDocument()
  })

  it('SP合計が0のときptバッジは表示されない', () => {
    renderColumn([task({ storyPoints: null })])
    expect(document.querySelector('.column-pts')).toBeNull()
  })
})

// R-001 タスク追加フォーム / S-001-01,04 (AT-001, AT-002, AT-004)
describe('Column - タスク追加フォーム (R-001 / AT-001,002,004)', () => {
  it('「+ タスクを追加」ボタンが表示される (AT-001)', () => {
    renderColumn([])
    expect(screen.getByRole('button', { name: '+ タスクを追加' })).toBeInTheDocument()
  })

  it('ボタンをクリックすると追加フォームが開きタイトル欄が出る (AT-002)', () => {
    renderColumn([])
    fireEvent.click(screen.getByRole('button', { name: '+ タスクを追加' }))
    expect(screen.getByPlaceholderText('タスクのタイトル *')).toBeInTheDocument()
  })

  it('フォームを開いた状態ではボタンが消える', () => {
    renderColumn([])
    fireEvent.click(screen.getByRole('button', { name: '+ タスクを追加' }))
    expect(screen.queryByRole('button', { name: '+ タスクを追加' })).not.toBeInTheDocument()
  })

  it('キャンセルでフォームが閉じボタン表示に戻る (AT-004)', () => {
    renderColumn([])
    fireEvent.click(screen.getByRole('button', { name: '+ タスクを追加' }))
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(screen.getByRole('button', { name: '+ タスクを追加' })).toBeInTheDocument()
  })

  it('タイトル入力後「追加」で onAddTask が column.id 付きで呼ばれフォームが閉じる (AT-004)', () => {
    const onAddTask = vi.fn()
    renderColumn([], { onAddTask })
    fireEvent.click(screen.getByRole('button', { name: '+ タスクを追加' }))
    fireEvent.change(screen.getByPlaceholderText('タスクのタイトル *'), { target: { value: '新タスク' } })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))
    expect(onAddTask).toHaveBeenCalledTimes(1)
    expect(onAddTask.mock.calls[0][0]).toBe('todo')
    expect(onAddTask.mock.calls[0][1].title).toBe('新タスク')
    expect(screen.getByRole('button', { name: '+ タスクを追加' })).toBeInTheDocument()
  })
})

// R-004 タスクカード描画
describe('Column - タスクカード描画 (R-004)', () => {
  it('渡したタスクのタイトルがカードとして描画される', () => {
    renderColumn([task({ title: '描画テスト' })])
    expect(screen.getByText('描画テスト')).toBeInTheDocument()
  })
})
