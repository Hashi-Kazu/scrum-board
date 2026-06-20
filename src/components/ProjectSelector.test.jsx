import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import ProjectSelector from './ProjectSelector'

const projects = [
  { id: 'p1', name: 'プロジェクトA' },
  { id: 'p2', name: 'プロジェクトB' },
]

function renderSelector(props = {}) {
  return render(
    <ProjectSelector
      projects={props.projects ?? projects}
      selectedId={props.selectedId ?? 'p1'}
      onSelect={props.onSelect ?? (() => {})}
      onAdd={props.onAdd ?? (() => {})}
      onRename={props.onRename ?? (() => {})}
      onDelete={props.onDelete ?? (() => {})}
      onManageAssignees={props.onManageAssignees ?? (() => {})}
    />
  )
}

function openDropdown() {
  fireEvent.click(screen.getByTitle('プロジェクトを切り替え'))
}

// ドロップダウン内に限定したクエリ（選択中プロジェクト名はトリガーにも出るため一意化が必要）
function dropdown() {
  return within(document.querySelector('.project-dropdown'))
}

// R-015 プロジェクト選択 / S-015-01 (AT-071)
describe('ProjectSelector - 選択 (R-015 / AT-071)', () => {
  it('選択中プロジェクト名がトリガーに表示される', () => {
    renderSelector({ selectedId: 'p2' })
    expect(screen.getByText('プロジェクトB')).toBeInTheDocument()
  })

  it('トリガーでドロップダウンが開き全プロジェクトが並ぶ', () => {
    renderSelector()
    openDropdown()
    // 選択中(プロジェクトA)はトリガーにも出るためドロップダウン内に限定して検証
    expect(dropdown().getByText('プロジェクトA')).toBeInTheDocument()
    expect(dropdown().getByText('プロジェクトB')).toBeInTheDocument()
  })

  it('プロジェクト名クリックで onSelect(id) が呼ばれる', () => {
    const onSelect = vi.fn()
    renderSelector({ onSelect })
    openDropdown()
    fireEvent.click(dropdown().getByText('プロジェクトB'))
    expect(onSelect).toHaveBeenCalledWith('p2')
  })
})

// R-015 プロジェクト作成 / S-015-02 (AT-072)
describe('ProjectSelector - 新規作成 (R-015 / AT-072)', () => {
  it('「新しいプロジェクト」で入力欄が出る', () => {
    renderSelector()
    openDropdown()
    fireEvent.click(screen.getByText('＋ 新しいプロジェクト'))
    expect(screen.getByPlaceholderText('プロジェクト名')).toBeInTheDocument()
  })

  it('名前未入力では追加ボタンが非活性', () => {
    renderSelector()
    openDropdown()
    fireEvent.click(screen.getByText('＋ 新しいプロジェクト'))
    expect(screen.getByRole('button', { name: '追加' })).toBeDisabled()
  })

  it('名前入力後の追加で onAdd(trimmed) が呼ばれる', () => {
    const onAdd = vi.fn()
    renderSelector({ onAdd })
    openDropdown()
    fireEvent.click(screen.getByText('＋ 新しいプロジェクト'))
    fireEvent.change(screen.getByPlaceholderText('プロジェクト名'), { target: { value: '  新規P  ' } })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))
    expect(onAdd).toHaveBeenCalledWith('新規P')
  })
})

// R-015 削除制約 / S-015-04 (AT-074)
describe('ProjectSelector - 削除制約 (R-015 / AT-074)', () => {
  it('プロジェクトが1つのみのとき削除ボタンが表示されない', () => {
    renderSelector({ projects: [{ id: 'p1', name: '唯一' }], selectedId: 'p1' })
    openDropdown()
    expect(screen.queryByTitle('削除')).not.toBeInTheDocument()
  })

  it('複数あるとき削除ボタンが表示される', () => {
    renderSelector()
    openDropdown()
    expect(screen.getAllByTitle('削除').length).toBeGreaterThan(0)
  })
})

// R-015 プロジェクト削除確認 / S-015-02,03 (AT-072, AT-073)
describe('ProjectSelector - 削除確認 (R-015 / AT-072,073)', () => {
  beforeEach(() => { vi.spyOn(window, 'confirm') })
  afterEach(() => { vi.restoreAllMocks() })

  it('確認OKで onDelete(id, projects) が呼ばれる', () => {
    window.confirm.mockReturnValue(true)
    const onDelete = vi.fn()
    renderSelector({ onDelete })
    openDropdown()
    fireEvent.click(screen.getAllByTitle('削除')[0])
    expect(onDelete).toHaveBeenCalledWith('p1', projects)
  })

  it('確認キャンセルで onDelete が呼ばれない', () => {
    window.confirm.mockReturnValue(false)
    const onDelete = vi.fn()
    renderSelector({ onDelete })
    openDropdown()
    fireEvent.click(screen.getAllByTitle('削除')[0])
    expect(onDelete).not.toHaveBeenCalled()
  })
})

// R-015 名前変更 / S-015-02 (AT-072)
describe('ProjectSelector - 名前変更 (R-015 / AT-072)', () => {
  it('鉛筆ボタンで編集入力欄が現れ、Enterで onRename が呼ばれる', () => {
    const onRename = vi.fn()
    renderSelector({ onRename })
    openDropdown()
    fireEvent.click(screen.getAllByTitle('名前を変更')[0])
    const input = document.querySelector('.project-edit-input')
    fireEvent.change(input, { target: { value: '改名後' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('p1', '改名後')
  })

  it('名前が変わらなければ onRename は呼ばれない', () => {
    const onRename = vi.fn()
    renderSelector({ onRename })
    openDropdown()
    fireEvent.click(screen.getAllByTitle('名前を変更')[0])
    const input = document.querySelector('.project-edit-input')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).not.toHaveBeenCalled()
  })
})

// R-019 担当者管理導線 / S-019-01 (AT-094)
describe('ProjectSelector - 担当者管理導線 (R-019 / AT-094)', () => {
  it('「担当者を管理」項目があり onManageAssignees が呼ばれる', () => {
    const onManageAssignees = vi.fn()
    renderSelector({ onManageAssignees })
    openDropdown()
    fireEvent.click(screen.getByText('👥 担当者を管理'))
    expect(onManageAssignees).toHaveBeenCalledTimes(1)
  })
})
