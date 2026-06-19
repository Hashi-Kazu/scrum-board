# スクラムボード アーキテクチャ

## 構成図

```
┌──────────────────────────────────────────────────────────┐
│  ブラウザ (React SPA)                                      │
│                                                           │
│  App.jsx ─── 認証ラッパー（VITE_AUTH_USER/PASS）           │
│       │                                                   │
│  BoardApp ─── プロジェクトセレクター・スプリント切替        │
│       │                                                   │
│  src/components/                                          │
│    Board.jsx      ─── カンバン全体レイアウト               │
│    Column.jsx     ─── 各カラム（ドロップ領域）              │
│    Card.jsx       ─── タスクカード（ドラッグ対象）          │
│    Modal 類       ─── タスク追加・編集・スプリント管理等    │
│       │                                                   │
│  src/hooks/  ─── データ通信の唯一の窓口                    │
│    useProjects.js  ─── プロジェクト CRUD                  │
│    useSprints.js   ─── スプリント CRUD + activate/complete │
│    useTasks.js     ─── タスク CRUD・移動・並び替え         │
│    useAssignees.js ─── 担当者 CRUD                        │
│       │                                                   │
│  src/lib/supabase.js ─── Supabase クライアント初期化       │
└──────────────────────────────────────────────────────────┘
                        │  REST / Realtime
┌──────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL + Realtime)                         │
│                                                           │
│  projects  sprints  tasks  assignees                      │
└──────────────────────────────────────────────────────────┘
```

## データモデル

```javascript
// tasks テーブル
Task {
  id:          string          // UUID
  columnId:    'backlog' | 'todo' | 'in-progress' | 'review' | 'done'
  title:       string
  description: string
  priority:    'high' | 'medium' | 'low'
  assignee:    string          // 担当者名（未設定は空文字）
  storyPoints: number | null
  sprintId:    string | null   // null = プロダクトバックログ
  dueDate:     string | null   // YYYY-MM-DD
  position:    number          // カラム内表示順（数値が小さいほど上）
  completedAt: string | null   // ISO datetime（完了カラム移動時に記録）
}

// sprints テーブル
Sprint {
  id:        string
  projectId: string
  name:      string
  startDate: string   // YYYY-MM-DD
  endDate:   string   // YYYY-MM-DD
  isActive:  boolean
  velocity:  number | null  // 完了スプリントのベロシティ（SP合計）
}

// projects テーブル
Project {
  id:   string
  name: string
}

// assignees テーブル
Assignee {
  id:          string
  projectId:   string
  name:        string
  isDefault:   boolean
}
```

## ファイル構成

```
scrum-board/
├── src/
│   ├── App.jsx                  ← 認証ラッパー(App) + ボード本体(BoardApp)
│   ├── main.jsx
│   ├── components/              ← UI コンポーネント
│   │   ├── Board.jsx
│   │   ├── Column.jsx
│   │   ├── Card.jsx
│   │   └── ...（Modal 類）
│   ├── hooks/                   ← Supabase 通信ロジック
│   │   ├── useProjects.js
│   │   ├── useSprints.js
│   │   ├── useTasks.js
│   │   └── useAssignees.js
│   └── lib/
│       └── supabase.js          ← Supabase クライアント初期化
├── docs/
│   ├── requirements.md          ← 要求仕様書（原本）
│   ├── requirements-usdm.md     ← 要求仕様書（USDM形式）
│   └── architecture.md          ← 本文書
├── package.json
├── vite.config.js
└── CLAUDE.md
```

## 設計上の制約

| 制約 | 内容 |
|------|------|
| データ通信の窓口 | `src/hooks/` が唯一の窓口。コンポーネントから直接 Supabase を呼ばない |
| backlog の定義 | `sprintId = null` のタスクがプロダクトバックログ。backlog カラムへドロップすると自動で `sprintId = null` にリセットされる |
| リアルタイム同期 | Supabase Realtime（postgres_changes）で全テーブルを購読。自分の書き込みエコーは `skip` セットで除外する |
| 認証 | `VITE_AUTH_USER` / `VITE_AUTH_PASS` 環境変数が未設定の場合は認証をスキップ。認証状態は `sessionStorage` の `sb-auth` キーで保持 |
