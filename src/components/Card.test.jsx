import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Card from './Card'

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  })
}))
vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } }
}))

const baseTask = {
  id: 't1',
  title: 'テストタスク',
  description: 'テスト説明',
  priority: 'high',
  assignee: '田中',
  storyPoints: 5,
  sprintId: null,
  dueDate: '2026-12-31',
  columnId: 'todo',
}

function renderCard(taskOverrides = {}, props = {}) {
  const task = { ...baseTask, ...taskOverrides }
  return render(
    <Card
      task={task}
      columnId={task.columnId}
      sprints={props.sprints ?? []}
      assignees={props.assignees ?? []}
      onUpdate={() => {}}
      onDelete={() => {}}
    />
  )
}

// R-007 優先度表示
describe('Card - 優先度表示 (R-007)', () => {
  it('priority="high" のカードに「高」バッジが表示される (S-007-01)', () => {
    renderCard({ priority: 'high' })
    expect(screen.getByText('高')).toBeInTheDocument()
  })

  it('priority="medium" のカードに「中」バッジが表示される', () => {
    renderCard({ priority: 'medium' })
    expect(screen.getByText('中')).toBeInTheDocument()
  })

  it('priority="low" のカードに「低」バッジが表示される', () => {
    renderCard({ priority: 'low' })
    expect(screen.getByText('低')).toBeInTheDocument()
  })

  it('priority="high" のバッジに priority--high クラスがある (S-007-02)', () => {
    renderCard({ priority: 'high' })
    expect(screen.getByText('高').className).toContain('priority--high')
  })

  it('priority="medium" のバッジに priority--medium クラスがある', () => {
    renderCard({ priority: 'medium' })
    expect(screen.getByText('中').className).toContain('priority--medium')
  })

  it('priority="low" のバッジに priority--low クラスがある', () => {
    renderCard({ priority: 'low' })
    expect(screen.getByText('低').className).toContain('priority--low')
  })
})

// R-008 担当者表示
describe('Card - 担当者表示 (R-008)', () => {
  it('担当者が設定されている場合、担当者名が表示される (S-008-02)', () => {
    renderCard({ assignee: '田中' })
    expect(screen.getByText('田中')).toBeInTheDocument()
  })

  it('担当者が設定されている場合、頭文字がアバターに表示される (S-008-02)', () => {
    renderCard({ assignee: '田中' })
    const avatar = document.querySelector('.assignee-avatar')
    expect(avatar).toBeTruthy()
    expect(avatar.textContent).toBe('田')
  })

  it('担当者が未設定の場合、担当者表示が存在しない (S-008-01)', () => {
    renderCard({ assignee: '' })
    expect(document.querySelector('.assignee-name')).toBeNull()
    expect(document.querySelector('.assignee-avatar')).toBeNull()
  })
})

// R-012 ストーリーポイント
describe('Card - ストーリーポイント (R-012)', () => {
  it('SP が設定されているとき「5 pt」が表示される (S-012-02)', () => {
    renderCard({ storyPoints: 5 })
    expect(screen.getByText('5 pt')).toBeInTheDocument()
  })

  it('SP が未設定のとき「– pt」が表示される (S-012-06)', () => {
    renderCard({ storyPoints: null })
    expect(screen.getByText('– pt')).toBeInTheDocument()
  })

  it('SP バッジをクリックすると number type の input が表示される (S-012-05)', () => {
    renderCard({ storyPoints: 5 })
    fireEvent.click(screen.getByText('5 pt'))
    const input = document.querySelector('input[type="number"]')
    expect(input).toBeTruthy()
  })
})

// R-016 期限
describe('Card - 期限 (R-016)', () => {
  it('dueDate が設定されているとき「📅 12/31」形式のバッジが表示される (S-016-01)', () => {
    renderCard({ dueDate: '2026-12-31' })
    expect(screen.getByText('📅 12/31')).toBeInTheDocument()
  })

  it('dueDate が未設定のとき「📅 –」が表示される', () => {
    renderCard({ dueDate: null })
    expect(screen.getByText('📅 –')).toBeInTheDocument()
  })

  it('期限バッジをクリックすると date type の input が表示される (S-016-02)', () => {
    renderCard({ dueDate: '2026-12-31' })
    fireEvent.click(screen.getByText('📅 12/31'))
    const input = document.querySelector('input[type="date"]')
    expect(input).toBeTruthy()
  })
})

// R-004 スプリントチップ
describe('Card - スプリントチップ (R-004)', () => {
  it('sprintId が設定されている場合、スプリント名チップが表示される (S-004-06)', () => {
    renderCard({ sprintId: 's1' }, {
      sprints: [{ id: 's1', name: 'Sprint 1' }]
    })
    expect(screen.getByText('🏃 Sprint 1')).toBeInTheDocument()
  })

  it('sprintId が null の場合、スプリントチップが表示されない', () => {
    renderCard({ sprintId: null }, { sprints: [{ id: 's1', name: 'Sprint 1' }] })
    expect(screen.queryByText('🏃 Sprint 1')).not.toBeInTheDocument()
  })
})

// R-002 モーダル
describe('Card - モーダル (R-002)', () => {
  it('「⋯」ボタンをクリックするとモーダル「タスクを編集」が表示される (S-002-01)', () => {
    renderCard()
    fireEvent.click(screen.getByTitle('編集'))
    expect(screen.getByText('タスクを編集')).toBeInTheDocument()
  })
})
