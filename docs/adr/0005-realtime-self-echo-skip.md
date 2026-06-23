---
name: realtime-self-echo-skip
description: Supabase Realtime の自己エコースキップパターン
metadata:
  type: project
---

# ADR-0005: Supabase Realtime で自己書き込みエコーをスキップする

**ステータス**: 承認済み  
**日付**: Supabase 移行後（git: `26edf76` 〜）  
**確信度**: 高

## コンテキスト

Supabase Realtime（`postgres_changes`）はテーブルへの INSERT/UPDATE/DELETE を購読者全員に配信する。  
自分自身の書き込みも配信されるため、「書き込み → ローカル state を楽観的更新 → Realtime エコーが届いてもう一度 setTasks」が起きると、二重更新や不要な再レンダリングが発生する。

## 決定

**`useRef(new Set())` で「自分が発行した書き込みのID」を追跡し、RealtimeイベントがそのIDを含む場合はスキップする。**

```js
const skip = useRef(new Set())

// 書き込み時
skip.current.add(id)

// Realtime イベント受信時
if (skip.current.has(payload.new?.id)) {
  skip.current.delete(payload.new?.id)
  return
}
```

## 理由

- 楽観的UIアップデート（書き込み後すぐにローカル state を更新）と Realtime を組み合わせる際に必須のパターン
- `useRef` を使うことで `Set` の変更が再レンダリングを起こさない
- サブスクリプションの重複購読による無限ループを防止できる

## 捨てた選択肢

- **自己書き込みを Realtime でも受け取って上書き**: 二重更新・ちらつきが発生する
- **楽観的更新をやめてサーバー応答後に state 更新**: UX が遅くなる
- **Supabase の `self` オプションで自己エコーを無効化**: (調査時点でコードに `self` オプションの使用なし)

## 影響

- `useTasks.js` の `skip` ref は `useEffect` の依存配列に含まれず、コメント不要のパターンとして機能している
- 同様のパターンが `useSprints.js`・`useAssignees.js` にも存在する可能性がある (要確認)
