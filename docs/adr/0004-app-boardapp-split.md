---
name: app-boardapp-split
description: App（認証ラッパー）とBoardApp（ボード本体）の分離 — フック呼び出し順序問題の解決
metadata:
  type: project
---

# ADR-0004: App（認証ラッパー）と BoardApp（ボード本体）を分離する

**ステータス**: 承認済み  
**日付**: git: `6934be4`  
**確信度**: 高

## コンテキスト

ログイン後に `window.location.reload()` を実行する設計（ブラウザのパスワード保存ダイアログを表示するため、ADR-0008 参照）を採用したところ、「hooks-after-login reload issue」が発生した。  
ログイン前に条件分岐でフックの呼び出しを制御しようとすると、Reactの「フックはコンポーネントのトップレベルで常に同じ順序で呼ぶ」というルールに違反する。

## 決定

**`App.jsx` を2つの関数コンポーネントに分割する:**

- `App`（デフォルトエクスポート）: 認証状態のチェックのみ。認証済みなら `<BoardApp />` をレンダリング
- `BoardApp`: すべての hooks（`useTasks`, `useSprints`, `useProjects`, `useAssignees`）をここで呼ぶ

```jsx
export default function App() {
  if (!authed) return <LoginScreen onLogin={handleLogin} />
  return <BoardApp />
}

function BoardApp() {
  const { tasks, ... } = useTasks(selectedId)
  // ...
}
```

## 理由

- `BoardApp` は認証済みの場合のみマウントされるため、hooks は常にマウント後の安定した環境で呼ばれる
- `App` は `authed` という単純な状態だけ持てばよく、`useState` 1つのみで済む
- React の「フックのルール」に完全準拠する形で認証フローを実現できる

## 捨てた選択肢

- **単一コンポーネントで条件分岐**: フックをトップレベルで呼びつつ条件付きでSkipする実装は Rules of Hooks 違反
- **Context API で認証状態を管理**: より大規模だが、このアプリでは過剰
- **ルーティングライブラリ（React Router 等）で認証ガード**: 小規模アプリのため採用されなかった (要確認)

## 影響

- `src/App.jsx` に2つのコンポーネント（`App` と `BoardApp`）が同居している
- すべての hooks の呼び出しが `BoardApp` に集中しており、データフローの起点が1箇所に集約されている
