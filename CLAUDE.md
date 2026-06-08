# scrum-board

スクラムチーム向けのかんばんボードアプリ。React + Vite + Supabase 構成。

## 技術スタック

- **フレームワーク**: React 19 + Vite 8（JSX、TypeScript なし）
- **バックエンド**: Supabase（DB + リアルタイム）
- **DnD**: @dnd-kit/core + @dnd-kit/sortable
- **チャート**: recharts
- **リント**: ESLint 10

## コマンド

```bash
npm run dev       # 開発サーバー起動 (localhost:5173)
npm run build     # プロダクションビルド → dist/
npm run lint      # ESLint
npm run preview   # dist/ をローカルサーブ
```

## ディレクトリ構成

```
src/
  components/   # UI コンポーネント（Board, Card, Column, Modal 類）
  hooks/        # カスタムフック（Supabase との通信ロジック）
    useProjects.js   # プロジェクト CRUD
    useSprints.js    # スプリント CRUD + activate/complete
    useTasks.js      # タスク CRUD + 移動・並び替え
    useAssignees.js  # 担当者 CRUD
  lib/
    supabase.js   # Supabase クライアント初期化
  App.jsx         # ルート。認証ラッパー(App) + ボード本体(BoardApp)
  main.jsx
```

## カラム構成

| id | 表示名 |
|----|--------|
| backlog | プロダクトバックログ |
| todo | 未着手 |
| in-progress | 進行中 |
| review | レビュー |
| done | 完了 |

backlog カラムのタスクは `sprintId = null`。それ以外はアクティブスプリントに紐づく。

## 認証

環境変数 `VITE_AUTH_USER` / `VITE_AUTH_PASS` が設定されている場合のみ認証画面を表示。
セッション情報は `sessionStorage` の `sb-auth` キーで保持。

## 環境変数（.env）

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_AUTH_USER=（任意）
VITE_AUTH_PASS=（任意）
```

## 注意事項

- **データはすべて Supabase に保存**。ローカルの `localStorage` は使っていない。
- hooks がデータ通信の唯一の窓口。コンポーネントから直接 Supabase を呼ばない。
- タスクを backlog に移動すると自動で `sprintId = null` にリセットされる（`handleMoveTask` / `handleReorderTasks` 参照）。
