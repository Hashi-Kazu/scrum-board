---
name: hooks-as-sole-data-layer
description: カスタムフックをデータ通信の唯一の窓口とする設計判断
metadata:
  type: project
---

# ADR-0003: カスタムフックをデータ通信の唯一の窓口とする

**ステータス**: 承認済み  
**日付**: Supabase 移行時（git: `26edf76`）  
**確信度**: 高

## コンテキスト

Supabase 移行（ADR-0001）によりデータアクセス層が必要になった。  
コンポーネントから直接 Supabase を呼ぶ実装と、中間層を設ける実装の2択があった。

## 決定

**`src/hooks/` 配下のカスタムフックのみが Supabase と通信する。コンポーネントは hooks 経由でデータを取得・更新し、直接 Supabase を呼ばない。**

| フック | 責務 |
|--------|------|
| `useProjects.js` | プロジェクト CRUD |
| `useSprints.js` | スプリント CRUD + activate/complete |
| `useTasks.js` | タスク CRUD・移動・並び替え |
| `useAssignees.js` | 担当者 CRUD |

## 理由

- 関心の分離: UIロジックとデータ通信ロジックを明確に分けることでコンポーネントをシンプルに保つ
- テスト容易性: hooks をモックすることでコンポーネントテストが Supabase に依存しなくなる
- 変更の局所化: バックエンドが変わっても hooks 内部を修正するだけでUIに影響しない

## 捨てた選択肢

- **コンポーネントから直接 Supabase を呼ぶ**: 通信ロジックが分散し保守性が低下する
- **Redux / Zustand などのグローバルストア**: 小規模アプリのため過剰な状態管理ライブラリは採用されなかった (要確認)
- **React Query / SWR**: (調査時点で痕跡なし)

## 影響

- `architecture.md` に「`src/hooks/` がデータ通信の唯一の窓口」として明文化されている
- `CLAUDE.md` にも同ルールが記載されており、AI エージェントへの制約として機能している
- `App.jsx`（BoardApp）がすべての hooks を呼び出す頂点となっている（[[app-boardapp-split]] 参照）
