---
name: dnd-kit
description: ドラッグ&ドロップライブラリとして @dnd-kit を採用
metadata:
  type: project
---

# ADR-0007: ドラッグ&ドロップに @dnd-kit を採用

**ステータス**: 承認済み  
**日付**: 初期commit（git: `5eee6a2`）  
**確信度**: 中（初期から採用されており明示的な選択理由の記述なし）

## コンテキスト

かんばんボードの中核機能として、タスクカードのドラッグ&ドロップ（カラム間移動・カラム内並べ替え）が必要。  
モバイルでのタッチ操作とデスクトップ両対応が求められる（`6f27f77: fix mobile landscape layout and DnD vs scroll conflict`）。

## 決定

**`@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` を採用する。**

## 理由

- `@dnd-kit` はアクセシビリティ対応（キーボード操作）を標準でサポート
- `SortableContext` によるリスト内並べ替えとカラム間移動を宣言的に記述できる
- モバイルタッチと PC マウスを同一 API で扱える
- react-beautiful-dnd は React 18+ との互換性問題があるため採用されなかった可能性がある (要確認)
- モバイルでのスクロールと DnD のコンフリクト問題が発生し後から修正が入っている（`6f27f77`）

## 捨てた選択肢

- **react-beautiful-dnd**: React 18+ での非推奨化・メンテナンス停滞の可能性 (要確認)
- **HTML5 Drag and Drop API 直接実装**: タッチデバイス対応が煩雑
- **react-dnd**: (調査時点で痕跡なし)

## 影響

- `Column.jsx` が `useDroppable` のドロップゾーン、`Card.jsx` が `useSortable` のドラッグ対象となっている
- `arrayMove`（`@dnd-kit/sortable`）がカラム内並べ替えロジック（`useTasks.js`）で使われている
- モバイルでスクロールと DnD が競合する問題に対処するための修正が入った（`6f27f77`）
