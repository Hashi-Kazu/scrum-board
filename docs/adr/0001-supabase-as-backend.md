---
name: supabase-as-backend
description: ローカルストレージからSupabaseへの移行 — バックエンド選択の判断記録
metadata:
  type: project
---

# ADR-0001: バックエンドに Supabase を採用

**ステータス**: 承認済み  
**日付**: 初期commit後（git: `26edf76`）  
**確信度**: 高

## コンテキスト

初期実装（`5eee6a2`）はタスクデータを `localStorage` に保存していた。  
これはシングルユーザー・シングルデバイスの前提であり、複数デバイスや複数ユーザーでのボード共有ができない制約があった。  
`localStorage` 版には `DEFAULT_TASKS`（サンプルデータ）があり、永続化の信頼性が低かった。

## 決定

**Supabase（PostgreSQL + Realtime）をバックエンドとして採用する。**

- `tasks`・`sprints`・`projects`・`assignees` テーブルを Supabase 上に置く
- Supabase Realtime（`postgres_changes`）で全テーブルをリアルタイム購読する
- SupabaseクライアントはBFF/APIレイヤーを挟まず、フロントエンドから直接呼び出す

## 理由

- Supabase は PostgreSQL の Realtime 機能を追加コスト0で提供し、複数ブラウザ間での即時同期を実現できる
- BFF/API サーバーなしでフロントエンドから直接 REST/WebSocket 接続できるため、インフラ管理コストがゼロ
- 無料ティアでチーム規模のスクラムボードには十分なスペック

## 捨てた選択肢

- **localStorage のまま継続**: デバイス間共有不可・ブラウザデータ消失リスクあり。移行後も読み取り専用レガシーコードとして残している（`readLocal()` 関数）
- **Firebase Realtime DB / Firestore**: (調査時点で痕跡なし)
- **カスタム REST API サーバー**: インフラ管理コスト増大のため採用されなかった可能性が高い (要確認)

## 影響

- 全データアクセスは `src/hooks/` 経由に集約された（[[hooks-as-sole-data-layer]]）
- localStorage → Supabase への自動移行ロジックが `useTasks.js` 内に実装された（`board_id='my'` かつ空なら `readLocal()` でインポート）
