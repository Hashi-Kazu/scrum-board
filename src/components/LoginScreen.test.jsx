import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginScreen from './LoginScreen'

// R-017 ログイン認証
describe('LoginScreen (R-017)', () => {
  it('ユーザーIDとパスワード両方が空のとき、ログインボタンが disabled (S-017-01)', () => {
    render(<LoginScreen onLogin={() => true} />)
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeDisabled()
  })

  it('ユーザーIDのみ入力でログインボタンが disabled', () => {
    render(<LoginScreen onLogin={() => true} />)
    fireEvent.change(screen.getByLabelText('ユーザーID'), { target: { value: 'admin' } })
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeDisabled()
  })

  it('パスワードのみ入力でログインボタンが disabled', () => {
    render(<LoginScreen onLogin={() => true} />)
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'pass' } })
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeDisabled()
  })

  it('両方入力するとログインボタンが enabled (S-017-04)', () => {
    render(<LoginScreen onLogin={() => true} />)
    fireEvent.change(screen.getByLabelText('ユーザーID'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'pass' } })
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeEnabled()
  })

  it('正しい入力でsubmitすると onLogin(user, pass) が呼ばれる (S-017-04)', () => {
    const onLogin = vi.fn().mockReturnValue(true)
    render(<LoginScreen onLogin={onLogin} />)
    fireEvent.change(screen.getByLabelText('ユーザーID'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))
    expect(onLogin).toHaveBeenCalledWith('admin', 'secret')
  })

  it('onLogin が false を返すとエラーメッセージが表示される', () => {
    const onLogin = vi.fn().mockReturnValue(false)
    render(<LoginScreen onLogin={onLogin} />)
    fireEvent.change(screen.getByLabelText('ユーザーID'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))
    expect(screen.getByText('ユーザーIDまたはパスワードが違います')).toBeInTheDocument()
  })

  it('onLogin が false を返すとパスワード欄がクリアされる', () => {
    const onLogin = vi.fn().mockReturnValue(false)
    render(<LoginScreen onLogin={onLogin} />)
    fireEvent.change(screen.getByLabelText('ユーザーID'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))
    expect(screen.getByLabelText('パスワード').value).toBe('')
  })

  it('onLogin が false を返してもユーザーID欄は保持される', () => {
    const onLogin = vi.fn().mockReturnValue(false)
    render(<LoginScreen onLogin={onLogin} />)
    fireEvent.change(screen.getByLabelText('ユーザーID'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))
    expect(screen.getByLabelText('ユーザーID').value).toBe('admin')
  })

  it('エラー後に入力を変えるとエラーが消える', () => {
    const onLogin = vi.fn().mockReturnValue(false)
    render(<LoginScreen onLogin={onLogin} />)
    fireEvent.change(screen.getByLabelText('ユーザーID'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))
    expect(screen.getByText('ユーザーIDまたはパスワードが違います')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('ユーザーID'), { target: { value: 'admin2' } })
    expect(screen.queryByText('ユーザーIDまたはパスワードが違います')).not.toBeInTheDocument()
  })
})
