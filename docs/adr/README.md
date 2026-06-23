# ADR インデックス

このディレクトリにはスクラムボードのアーキテクチャ判断記録（ADR）を格納しています。  
新機能実装や既存コードの変更前に、関連する ADR を確認してください。

## 一覧

| # | タイトル | 概要 | 確信度 |
|---|---------|------|--------|
| [0001](0001-supabase-as-backend.md) | Supabase をバックエンドとして採用 | localStorage → Supabase（PostgreSQL + Realtime）へ移行 | 高 |
| [0002](0002-react-vite-no-typescript.md) | React 19 + Vite 8、TypeScript なし | JSX のみ使用。速度優先でTypeScript不採用 | 高 |
| [0003](0003-hooks-as-sole-data-layer.md) | カスタムフックをデータ通信の唯一の窓口とする | コンポーネントから直接 Supabase を呼ばない | 高 |
| [0004](0004-app-boardapp-split.md) | App / BoardApp コンポーネントを分離 | hooks-after-login reload issue を解決するための分割 | 高 |
| [0005](0005-realtime-self-echo-skip.md) | Supabase Realtime 自己エコースキップ | `useRef(Set)` で自分の書き込みエコーを無視 | 高 |
| [0006](0006-env-var-auth.md) | 環境変数ベースの簡易認証 | Supabase Auth 不使用。`VITE_AUTH_USER/PASS` で制御 | 高 |
| [0007](0007-dnd-kit.md) | ドラッグ&ドロップに @dnd-kit を採用 | カラム間移動・並び替えをアクセシブルに実現 | 中 |
| [0008](0008-backlog-as-null-sprint.md) | バックログは `sprintId = null` で表現 | backlog 専用フラグなし。NULL で区別 | 高 |
| [0009](0009-vitest-testing.md) | テストに Vitest + Testing Library を採用 | Vite と設定共有。仕様ステータス自動検証のため後付けで導入 | 高 |
| [0010](0010-ai-coder-workflow.md) | AI Coder ワークフロー（GitHub Issues → Claude → PR） | claude-code-action@v1 で Issues を自動実装 | 高 |

## (要確認) 項目

以下の ADR に不確実な記述（`(要確認)` 付き）が含まれています。実際の判断理由を確認して更新してください。

| ADR | 要確認内容 |
|-----|----------|
| [0002](0002-react-vite-no-typescript.md) | TypeScript を採用しなかった明示的な理由 |
| [0002](0002-react-vite-no-typescript.md) | Next.js / Remix を採用しなかった理由 |
| [0003](0003-hooks-as-sole-data-layer.md) | Redux/Zustand を採用しなかった理由 |
| [0006](0006-env-var-auth.md) | ルーティングライブラリを使わなかった理由 |
| [0007](0007-dnd-kit.md) | react-beautiful-dnd を採用しなかった理由 |
| [0005](0005-realtime-self-echo-skip.md) | useSprints / useAssignees でも同パターンを使っているか |
