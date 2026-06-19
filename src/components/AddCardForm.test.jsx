import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AddCardForm from './AddCardForm'

// R-001 タスク作成
describe('AddCardForm (R-001)', () => {
  it('タイトル・説明・優先度・担当者・SPの入力欄を持つ (S-001-02, S-001-06)', () => {
    render(<AddCardForm onAdd={() => {}} onCancel={() => {}} />)
    expect(screen.getByPlaceholderText('タスクのタイトル *')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('説明（任意）')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('担当者')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ストーリーポイント（任意）')).toBeInTheDocument()
  })

  it('タイトルが空のとき追加ボタンは非活性 (S-001-03)', () => {
    render(<AddCardForm onAdd={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('button', { name: '追加' })).toBeDisabled()
  })

  it('タイトル入力で追加ボタンが活性化する (S-001-03)', () => {
    render(<AddCardForm onAdd={() => {}} onCancel={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText('タスクのタイトル *'), { target: { value: '新タスク' } })
    expect(screen.getByRole('button', { name: '追加' })).toBeEnabled()
  })

  it('優先度の初期値は「中」(S-001-05)', () => {
    render(<AddCardForm onAdd={() => {}} onCancel={() => {}} />)
    const priority = screen.getByDisplayValue('優先度: 中')
    expect(priority).toBeInTheDocument()
  })

  it('追加時にトリムされた値で onAdd を呼ぶ (S-001-02,06)', () => {
    const onAdd = vi.fn()
    render(<AddCardForm onAdd={onAdd} onCancel={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText('タスクのタイトル *'), { target: { value: '  作業A  ' } })
    fireEvent.change(screen.getByPlaceholderText('ストーリーポイント（任意）'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: '作業A',
      priority: 'medium',
      storyPoints: 5,
    }))
  })

  it('担当者が登録済みのときは担当者欄がドロップダウン (S-019-06)', () => {
    render(
      <AddCardForm
        onAdd={() => {}}
        onCancel={() => {}}
        assignees={[{ id: '1', name: '田中' }, { id: '2', name: '鈴木' }]}
      />
    )
    expect(screen.queryByPlaceholderText('担当者')).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: '田中' })).toBeInTheDocument()
  })

  it('担当者未登録のときは自由入力テキスト欄 (S-019-07)', () => {
    render(<AddCardForm onAdd={() => {}} onCancel={() => {}} assignees={[]} />)
    expect(screen.getByPlaceholderText('担当者')).toBeInTheDocument()
  })

  it('デフォルト担当者が初期値として入る (S-019-04)', () => {
    render(
      <AddCardForm
        onAdd={() => {}}
        onCancel={() => {}}
        assignees={[{ id: '1', name: '田中' }]}
        defaultAssignee={{ id: '1', name: '田中' }}
      />
    )
    expect(screen.getByDisplayValue('田中')).toBeInTheDocument()
  })
})
