# Project Overview

## 概要

スクラムチーム向けのかんばんボードアプリ。React + Vite + Supabase 構成。

## 技術スタック

- React 19 + Vite 8（JSX、TypeScript なし）
- Supabase（DB + リアルタイム）
- `@dnd-kit/core` + `@dnd-kit/sortable`
- recharts
- ESLint 10

## コマンド

```bash
npm run dev       # 開発サーバー起動 (localhost:5173)
npm run build     # プロダクションビルド -> dist/
npm run lint      # ESLint
npm run preview   # dist/ をローカルサーブ
npm test          # Vitest
```

## ディレクトリ構成

```text
src/
  components/   # UI コンポーネント（Board, Card, Column, Modal 類）
  hooks/        # Supabase との通信ロジック
  lib/          # Supabase クライアント初期化
  App.jsx       # 認証ラッパー(App) + ボード本体(BoardApp)
  main.jsx
```

## データと認証

- カラムは backlog / todo / in-progress / review / done。
- backlog カラムのタスクは `sprintId = null`。それ以外はアクティブスプリントに紐づく。
- 環境変数 `VITE_AUTH_USER` / `VITE_AUTH_PASS` が設定されている場合のみ認証画面を表示する。
- セッション情報は `sessionStorage` の `sb-auth` キーで保持する。
- データはすべて Supabase に保存し、ローカルの `localStorage` は使わない。
- hooks がデータ通信の唯一の窓口。コンポーネントから直接 Supabase を呼ばない。
