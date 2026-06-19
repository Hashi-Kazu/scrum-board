import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CardModal from './CardModal'

const baseTask = {
  id: 't1',
  title: 'タスク',
  description: '説明',
  priority: 'high',
  assignee: '田中',
  storyPoints: 3,
  sprintId: null,
  dueDate: null,
  columnId: 'todo',
}

// R-002 タスク編集 / R-003 タスク削除
describe('CardModal (R-002, R-003)', () => {
  it('タイトル・説明・優先度・担当者を編集できる (S-002-02)', () => {
    render(<CardModal task={baseTask} onSave={() => {}} onDelete={() => {}} onClose={() => {}} />)
    expect(screen.getByDisplayValue('タスク')).toBeInTheDocument()
    expect(screen.getByDisplayValue('説明')).toBeInTheDocument()
    expect(screen.getByDisplayValue('田中')).toBeInTheDocument()
  })

  it('タイトルが空のとき保存ボタンは非活性 (S-002-03)', () => {
    render(<CardModal task={baseTask} onSave={() => {}} onDelete={() => {}} onClose={() => {}} />)
    fireEvent.change(screen.getByDisplayValue('タスク'), { target: { value: '' } })
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled()
  })

  it('Escキーでモーダルを閉じる (S-002-04)', () => {
    const onClose = vi.fn()
    render(<CardModal task={baseTask} onSave={() => {}} onDelete={() => {}} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('SPと期限を編集して保存できる (S-002-06, S-016-05)', () => {
    const onSave = vi.fn()
    render(<CardModal task={baseTask} onSave={onSave} onDelete={() => {}} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      title: 'タスク',
      storyPoints: 3,
    }))
  })

  it('削除は二段階確認（押下後に確認メッセージ）(S-003-01,02)', () => {
    const onDelete = vi.fn()
    render(<CardModal task={baseTask} onSave={() => {}} onDelete={onDelete} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '削除' }))
    expect(screen.getByText('本当に削除しますか？')).toBeInTheDocument()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('確認後に削除を実行する (S-003-03)', () => {
    const onDelete = vi.fn()
    render(<CardModal task={baseTask} onSave={() => {}} onDelete={onDelete} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '削除' }))
    fireEvent.click(screen.getByRole('button', { name: '削除する' }))
    expect(onDelete).toHaveBeenCalled()
  })
})
