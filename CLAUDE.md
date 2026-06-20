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

## 開発ルール

**コード修正・機能追加・バグ修正など、あらゆる開発タスクは必ず `feature-dev` エージェントを通して行うこと。**

- `feature-dev` がコード修正・仕様書更新（ステータス `■■□`）・バージョンバンプ・受け入れテスト更新を一括で行う
- バグ調査が必要な場合は `debugger` を呼ぶ（**すべてのエージェント起動は main が行う**。サブエージェント間で直接指示はできない）
- **開発完了後の自動フロー**（すべて main が順に起動する）:
  1. `feature-dev` が成功報告（lint/build 通過、ステータス `■■□` 更新済み）
  2. main が `acceptance-test` を起動 → テスト実行・ステータス `■■■` 反映・結果返却
     - **FAIL あり**: main が `feature-dev` を再起動して修正させる（FAIL 詳細を渡す）
     - **PASS / SKIP のみ**: 手順 3 へ進む
  3. main が `publisher` を起動 → commit〜push まで完了
  - 停止するケース: `feature-dev` が失敗・中断、または「`debugger` 必要」と報告した場合は以降を起動せず停止して報告する
  - 最終ゲート（バージョン整合・lint/build 失敗時は push せず停止）は `publisher` 側で従来どおり機能する
- バージョンポリシー: 要件変更あり → マイナーアップ / コード修正のみ → パッチアップ
- 検証は `npm run lint`（ESLint）と `npm run build`。画面に出る変更は dev サーバー（localhost:5173）でブラウザ確認する
- **`feature-dev` はテストを実行しない**（`npm test` / `vitest` 等の実行は `acceptance-test` の責務。テストコードの更新・追加は行ってよいが、実行はしない）

## エージェント一覧

| エージェント | 役割 |
|---|---|
| `feature-dev` | 開発全部（コード・仕様書・バージョン・受け入れテスト更新） |
| `debugger` | バグ調査のみ（読み取り専用） |
| `acceptance-test` | 受け入れテスト実行・ステータス `■■■` 反映 |
| `publisher` | git push（このアプリはプラグインではなく**自動公開なし**。push＝リモート反映まで） |

> **エージェント定義の管理**: `.claude/agents/*.md` は `C:\Claude Code\_agent-templates`（正本）から同期されたコピー。**直接編集せず**、正本を編集して `_agent-templates\sync-agents.ps1` を実行すること（直接編集は次回同期で上書きされる）。プロジェクト固有の事情はエージェントではなくこの CLAUDE.md に書く。

## 注意事項

- **データはすべて Supabase に保存**。ローカルの `localStorage` は使っていない。
- hooks がデータ通信の唯一の窓口。コンポーネントから直接 Supabase を呼ばない。
- タスクを backlog に移動すると自動で `sprintId = null` にリセットされる（`handleMoveTask` / `handleReorderTasks` 参照）。
