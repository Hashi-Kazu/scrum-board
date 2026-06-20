import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AssigneesModal from './AssigneesModal'

afterEach(() => vi.restoreAllMocks())

const baseAssignees = [
  { id: 'a1', name: '田中' },
  { id: 'a2', name: '鈴木' },
]

// R-019 担当者マスタ管理
describe('AssigneesModal (R-019)', () => {
  it('担当者リストが空のとき「担当者が登録されていません」が表示される (S-019-02)', () => {
    render(
      <AssigneesModal
        assignees={[]}
        defaultAssignee={null}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSetDefault={() => {}}
        onClearDefault={() => {}}
        onClose={() => {}}
      />
    )
    expect(screen.getByText('担当者が登録されていません')).toBeInTheDocument()
  })

  it('担当者リストに名前が表示される', () => {
    render(
      <AssigneesModal
        assignees={baseAssignees}
        defaultAssignee={null}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSetDefault={() => {}}
        onClearDefault={() => {}}
        onClose={() => {}}
      />
    )
    expect(screen.getAllByText('田中').length).toBeGreaterThan(0)
    expect(screen.getAllByText('鈴木').length).toBeGreaterThan(0)
  })

  it('「担当者名を入力」フィールドが空のとき「追加」ボタンが disabled', () => {
    render(
      <AssigneesModal
        assignees={[]}
        defaultAssignee={null}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSetDefault={() => {}}
        onClearDefault={() => {}}
        onClose={() => {}}
      />
    )
    expect(screen.getByRole('button', { name: '追加' })).toBeDisabled()
  })

  it('担当者名を入力して追加ボタンクリックで onAdd が呼ばれる (S-019-02)', () => {
    const onAdd = vi.fn()
    render(
      <AssigneesModal
        assignees={[]}
        defaultAssignee={null}
        onAdd={onAdd}
        onRename={() => {}}
        onDelete={() => {}}
        onSetDefault={() => {}}
        onClearDefault={() => {}}
        onClose={() => {}}
      />
    )
    fireEvent.change(screen.getByPlaceholderText('担当者名を入力'), { target: { value: '佐藤' } })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))
    expect(onAdd).toHaveBeenCalledWith('佐藤')
  })

  it('Enterキーでも onAdd が呼ばれる', () => {
    const onAdd = vi.fn()
    render(
      <AssigneesModal
        assignees={[]}
        defaultAssignee={null}
        onAdd={onAdd}
        onRename={() => {}}
        onDelete={() => {}}
        onSetDefault={() => {}}
        onClearDefault={() => {}}
        onClose={() => {}}
      />
    )
    fireEvent.change(screen.getByPlaceholderText('担当者名を入力'), { target: { value: '佐藤' } })
    fireEvent.keyDown(screen.getByPlaceholderText('担当者名を入力'), { key: 'Enter' })
    expect(onAdd).toHaveBeenCalledWith('佐藤')
  })

  it('追加後に入力フィールドがクリアされる', () => {
    render(
      <AssigneesModal
        assignees={[]}
        defaultAssignee={null}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSetDefault={() => {}}
        onClearDefault={() => {}}
        onClose={() => {}}
      />
    )
    const input = screen.getByPlaceholderText('担当者名を入力')
    fireEvent.change(input, { target: { value: '佐藤' } })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))
    expect(input.value).toBe('')
  })

  it('鉛筆ボタンクリックでその担当者の編集インプットが表示される (S-019-02)', () => {
    render(
      <AssigneesModal
        assignees={baseAssignees}
        defaultAssignee={null}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSetDefault={() => {}}
        onClearDefault={() => {}}
        onClose={() => {}}
      />
    )
    const editBtns = screen.getAllByTitle('名前を変更')
    fireEvent.click(editBtns[0])
    expect(screen.getByDisplayValue('田中')).toBeInTheDocument()
  })

  it('編集インプットでEnterを押すと onRename が呼ばれる', () => {
    const onRename = vi.fn()
    render(
      <AssigneesModal
        assignees={baseAssignees}
        defaultAssignee={null}
        onAdd={() => {}}
        onRename={onRename}
        onDelete={() => {}}
        onSetDefault={() => {}}
        onClearDefault={() => {}}
        onClose={() => {}}
      />
    )
    const editBtns = screen.getAllByTitle('名前を変更')
    fireEvent.click(editBtns[0])
    const input = screen.getByDisplayValue('田中')
    fireEvent.change(input, { target: { value: '田中太郎' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('a1', '田中太郎')
  })

  it('ゴミ箱ボタンクリックで確認ダイアログ → confirm=true で onDelete が呼ばれる (S-019-02)', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onDelete = vi.fn()
    render(
      <AssigneesModal
        assignees={baseAssignees}
        defaultAssignee={null}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={onDelete}
        onSetDefault={() => {}}
        onClearDefault={() => {}}
        onClose={() => {}}
      />
    )
    const deleteBtns = screen.getAllByTitle('削除')
    fireEvent.click(deleteBtns[0])
    expect(onDelete).toHaveBeenCalledWith('a1')
  })

  it('デフォルト担当者が設定されているとき、そのラジオボタンがchecked (S-019-04)', () => {
    render(
      <AssigneesModal
        assignees={baseAssignees}
        defaultAssignee={{ id: 'a1', name: '田中' }}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSetDefault={() => {}}
        onClearDefault={() => {}}
        onClose={() => {}}
      />
    )
    const radios = screen.getAllByRole('radio')
    // 最初のラジオは「未設定」、次が田中、その次が鈴木
    expect(radios[1].checked).toBe(true)
  })

  it('デフォルト担当者なしのとき「未設定」ラジオがchecked (S-019-05)', () => {
    render(
      <AssigneesModal
        assignees={baseAssignees}
        defaultAssignee={null}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSetDefault={() => {}}
        onClearDefault={() => {}}
        onClose={() => {}}
      />
    )
    const radios = screen.getAllByRole('radio')
    expect(radios[0].checked).toBe(true)
  })

  it('担当者のラジオボタンをクリックすると onSetDefault が呼ばれる (S-019-04)', () => {
    const onSetDefault = vi.fn()
    render(
      <AssigneesModal
        assignees={baseAssignees}
        defaultAssignee={null}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSetDefault={onSetDefault}
        onClearDefault={() => {}}
        onClose={() => {}}
      />
    )
    const radios = screen.getAllByRole('radio')
    fireEvent.click(radios[1])
    expect(onSetDefault).toHaveBeenCalledWith('a1')
  })

  it('「未設定」ラジオをクリックすると onClearDefault が呼ばれる (S-019-05)', () => {
    const onClearDefault = vi.fn()
    render(
      <AssigneesModal
        assignees={baseAssignees}
        defaultAssignee={{ id: 'a1', name: '田中' }}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSetDefault={() => {}}
        onClearDefault={onClearDefault}
        onClose={() => {}}
      />
    )
    const radios = screen.getAllByRole('radio')
    fireEvent.click(radios[0])
    expect(onClearDefault).toHaveBeenCalled()
  })

  it('Escキーで onClose が呼ばれる', () => {
    const onClose = vi.fn()
    render(
      <AssigneesModal
        assignees={[]}
        defaultAssignee={null}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSetDefault={() => {}}
        onClearDefault={() => {}}
        onClose={onClose}
      />
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('閉じるボタンで onClose が呼ばれる', () => {
    const onClose = vi.fn()
    render(
      <AssigneesModal
        assignees={[]}
        defaultAssignee={null}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSetDefault={() => {}}
        onClearDefault={() => {}}
        onClose={onClose}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '✕' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('背景クリックで onClose が呼ばれる', () => {
    const onClose = vi.fn()
    const { container } = render(
      <AssigneesModal
        assignees={[]}
        defaultAssignee={null}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSetDefault={() => {}}
        onClearDefault={() => {}}
        onClose={onClose}
      />
    )
    const backdrop = container.querySelector('.modal-backdrop')
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })
})
