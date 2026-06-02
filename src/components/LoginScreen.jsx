import { useState } from 'react'

export default function LoginScreen({ onLogin }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const ok = onLogin(user, pass)
    if (!ok) {
      setError(true)
      setPass('')
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <span className="login-icon">📋</span>
          <h1 className="login-title">スクラムボード</h1>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label className="form-label">ユーザーID</label>
            <input
              className="form-input"
              type="text"
              value={user}
              onChange={e => { setUser(e.target.value); setError(false) }}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div>
            <label className="form-label">パスワード</label>
            <input
              className="form-input"
              type="password"
              value={pass}
              onChange={e => { setPass(e.target.value); setError(false) }}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="login-error">ユーザーIDまたはパスワードが違います</p>
          )}

          <button
            className="btn btn-primary login-submit"
            type="submit"
            disabled={!user || !pass}
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  )
}
