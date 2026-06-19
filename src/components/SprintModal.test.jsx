import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SprintModal from './SprintModal'

// R-011 スプリント管理 / S-011-01,02
describe('SprintModal (R-011)', () => {
  it('スプリント名・開始日・終了日の入力欄を持つ (S-011-01)', () => {
    render(<SprintModal sprint={null} onSave={() => {}} onClose={() => {}} />)
    expect(screen.getByPlaceholderText('例: Sprint 2')).toBeInTheDocument()
    expect(screen.getByText('開始日')).toBeInTheDocument()
    expect(screen.getByText('終了日')).toBeInTheDocument()
  })

  it('名前が空または終了日未入力では保存ボタンが非活性 (S-011-02)', () => {
    render(<SprintModal sprint={null} onSave={() => {}} onClose={() => {}} />)
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled()
  })

  it('名前と妥当な日付を入れると保存可能になる (S-011-02)', () => {
    render(<SprintModal sprint={null} onSave={() => {}} onClose={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText('例: Sprint 2'), { target: { value: 'Sprint 2' } })
    const dates = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dates[0], { target: { value: '2026-06-01' } })
    fireEvent.change(dates[1], { target: { value: '2026-06-14' } })
    expect(screen.getByRole('button', { name: '保存' })).toBeEnabled()
  })

  it('終了日が開始日より前なら非活性 (S-011-02)', () => {
    render(<SprintModal sprint={null} onSave={() => {}} onClose={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText('例: Sprint 2'), { target: { value: 'Sprint 2' } })
    const dates = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dates[0], { target: { value: '2026-06-14' } })
    fireEvent.change(dates[1], { target: { value: '2026-06-01' } })
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled()
  })
})
