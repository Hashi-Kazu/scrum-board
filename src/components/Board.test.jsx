import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Board from './Board'

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

const columns = [
  { id: 'backlog', title: 'プロダクトバックログ', color: '#64748b' },
  { id: 'todo', title: '未着手', color: '#3b82f6' },
  { id: 'in-progress', title: '進行中', color: '#f59e0b' },
  { id: 'review', title: 'レビュー', color: '#8b5cf6' },
  { id: 'done', title: '完了', color: '#10b981' },
]

function task(overrides = {}) {
  return {
    id: 't1', title: 'タスク', description: '', priority: 'medium',
    assignee: '', storyPoints: null, sprintId: null, dueDate: null,
    columnId: 'todo', ...overrides,
  }
}

function renderBoard(tasks = [], props = {}) {
  return render(
    <Board
      columns={columns}
      tasks={tasks}
      sprints={props.sprints ?? []}
      assignees={props.assignees ?? []}
      defaultAssignee={null}
      onAddTask={() => {}}
      onUpdateTask={() => {}}
      onDeleteTask={() => {}}
      onMoveTask={() => {}}
      onReorderTasks={() => {}}
    />
  )
}

// R-004 ボード5カラム / S-004-01 (AT-016)
describe('Board - 5カラム表示 (R-004 / AT-016)', () => {
  it('5つのカラム名がすべて表示される', () => {
    renderBoard([])
    expect(screen.getByText('プロダクトバックログ')).toBeInTheDocument()
    expect(screen.getByText('未着手')).toBeInTheDocument()
    expect(screen.getByText('進行中')).toBeInTheDocument()
    expect(screen.getByText('レビュー')).toBeInTheDocument()
    expect(screen.getByText('完了')).toBeInTheDocument()
  })

  it('.column 要素が5つ描画される', () => {
    renderBoard([])
    expect(document.querySelectorAll('.column')).toHaveLength(5)
  })
})

// R-004 カラムごとのタスク振り分け / columnId フィルタ (AT-017)
describe('Board - カラム別タスク振り分け (R-004)', () => {
  it('columnId に応じて各カラムへタスクが振り分けられる', () => {
    renderBoard([
      task({ id: 'a', title: '未着手タスク', columnId: 'todo' }),
      task({ id: 'b', title: '完了タスク', columnId: 'done' }),
    ])
    expect(screen.getByText('未着手タスク')).toBeInTheDocument()
    expect(screen.getByText('完了タスク')).toBeInTheDocument()
  })

  it('各カラムの件数バッジが columnId 別の件数を反映する', () => {
    renderBoard([
      task({ id: 'a', columnId: 'todo' }),
      task({ id: 'b', columnId: 'todo' }),
      task({ id: 'c', columnId: 'done' }),
    ])
    const counts = [...document.querySelectorAll('.column-count')].map(e => e.textContent)
    // backlog, todo, in-progress, review, done の順
    expect(counts).toEqual(['0', '2', '0', '0', '1'])
  })
})

// R-018 ステータス日本語化 / S-018-01,02 (AT-090, AT-091)
describe('Board - ステータス日本語表記 (R-018 / AT-090,091)', () => {
  it('英語表記(TODO / In Progress / Done)が存在しない', () => {
    renderBoard([])
    expect(screen.queryByText('TODO')).not.toBeInTheDocument()
    expect(screen.queryByText('In Progress')).not.toBeInTheDocument()
    expect(screen.queryByText('Done')).not.toBeInTheDocument()
  })
})
