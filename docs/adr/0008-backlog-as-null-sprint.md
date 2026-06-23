---
name: backlog-as-null-sprint
description: バックログをsprintId=nullで表現するデータモデル設計
metadata:
  type: project
---

# ADR-0008: バックログは `sprintId = null` で表現する

**ステータス**: 承認済み  
**日付**: 初期commit（git: `5eee6a2`）以降、設計として定着  
**確信度**: 高

## コンテキスト

かんばんボードには `backlog`（プロダクトバックログ）カラムと、スプリントに紐づくカラム（`todo`, `in-progress`, `review`, `done`）が共存している。  
バックログのタスクとスプリント中のタスクを DB上でどう区別するかを決める必要があった。

## 決定

**`tasks.sprint_id = null` のタスクをプロダクトバックログとして扱う。**

- `backlog` カラムにドラッグするとアプリが自動で `sprintId = null` にリセットする
- `todo` 以降のカラムのタスクはアクティブスプリントの `id` が設定されている

## 理由

- `backlog` 専用の boolean フラグや別テーブルを設けるより、`sprint_id` の NULL を再利用した方がスキーマがシンプル
- スプリントへの割り当て（`sprint_id = <id>`）とバックログ戻し（`sprint_id = null`）が対称的な操作になる
- SQL での絞り込みが `WHERE sprint_id IS NULL` / `WHERE sprint_id = $1` と直感的

## 捨てた選択肢

- **`is_backlog: boolean` フラグを持つ**: `sprint_id` と二重管理になりデータ不整合リスクがある
- **backlog 専用テーブル**: 別テーブルへの移動コストが高い
- **`sprint_id = 'backlog'` という特殊文字列**: NULL の意味論を文字列で代替するアンチパターン

## 影響

- `handleMoveTask` / `handleReorderTasks` で `columnId === 'backlog'` の場合に `sprintId: null` をセットする処理が必要
- フィルタリングロジック（`boardTasksFor`、`src/lib/taskLogic.js`）がこの設計に依存している
- `architecture.md` の設計上の制約に明記されている
