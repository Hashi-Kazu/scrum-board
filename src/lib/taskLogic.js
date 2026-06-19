// 純粋ロジック（UIに依存しない算出関数）。
// コンポーネントとテストの双方から参照する単一の真実源。

// ── 進捗算出（R-009 / S-009-01〜04）──────────────────────────────────────
// 「完了」カラムのタスクのみを完了としてカウントする。
export function computeProgress(tasks) {
  const total = tasks.length
  const done = tasks.filter(t => t.columnId === 'done').length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0
  return { done, total, percent }
}

// スプリントフィルタを考慮した進捗対象タスクの抽出（R-009）
export function progressTasksFor(tasks, filterSprintId) {
  return filterSprintId === 'all'
    ? tasks
    : tasks.filter(t => t.sprintId === filterSprintId)
}

// ── ストーリーポイント合計（R-012 / S-012-03）────────────────────────────
export function sumStoryPoints(tasks) {
  return tasks.reduce((s, t) => s + (t.storyPoints ?? 0), 0)
}

// ── 優先度バッジ（R-007 / S-007-01,02）───────────────────────────────────
export const PRIORITY_META = {
  high:   { label: '高', className: 'priority--high' },
  medium: { label: '中', className: 'priority--medium' },
  low:    { label: '低', className: 'priority--low' },
}

export function priorityMeta(priority) {
  return PRIORITY_META[priority] ?? PRIORITY_META.medium
}

// ── 担当者アバター色（R-008 / S-008-03）──────────────────────────────────
export const AVATAR_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

export function avatarColor(name) {
  const code = name ? name.charCodeAt(0) : 0
  return AVATAR_COLORS[(Number.isNaN(code) ? 0 : code) % AVATAR_COLORS.length]
}

// ── 期限フォーマット・色分け（R-016 / S-016-01,03,04）─────────────────────
// MM/DD 形式（先頭ゼロなし）。未設定は null。
export function formatDue(dateStr) {
  if (!dateStr) return null
  const dt = new Date(dateStr + 'T00:00:00')
  return `${dt.getMonth() + 1}/${dt.getDate()}`
}

// 期限バッジの色クラスを決定する。
// 完了カラムは色変化なし（--set）。超過:overdue / 2日以内:soon / それ以外:set
export function dueBadgeClass(task, now = new Date()) {
  if (!task.dueDate || task.columnId === 'done') return 'due-badge--set'
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const due = new Date(task.dueDate + 'T00:00:00')
  if (due < today) return 'due-badge--overdue'
  const diff = (due - today) / 86400000
  if (diff <= 2) return 'due-badge--soon'
  return 'due-badge--set'
}

// ── ストーリーポイント入力の正規化（R-012 / S-012-05,06）──────────────────
// 空文字 → null、それ以外は 1 以上の整数に丸める。不正値は null。
export function normalizeStoryPoints(raw) {
  const n = String(raw).trim()
  if (n === '') return null
  return Math.max(1, parseInt(n, 10)) || null
}

// ── ベロシティ算出（R-013 / S-013-01,05）─────────────────────────────────
// 「完了」カラムに移動したタスクのストーリーポイント合計。
// SP 未設定タスクは除外し、その件数を返す。
export function computeVelocity(sprintTasks) {
  const done = sprintTasks.filter(t => t.columnId === 'done')
  const velocity = done.reduce((s, t) => s + (t.storyPoints ?? 0), 0)
  const excludedCount = sprintTasks.filter(t => !t.storyPoints).length
  return { velocity, excludedCount }
}

// 直近スプリントの平均ベロシティ（R-013 / S-013-04）
export function averageVelocity(completedSprints) {
  const withVelocity = completedSprints.filter(s => s.velocity !== null && s.velocity !== undefined)
  if (withVelocity.length === 0) return 0
  return Math.round(withVelocity.reduce((s, d) => s + d.velocity, 0) / withVelocity.length)
}

// ── ボード表示フィルタ（R-004 / S-004-07, R-011）─────────────────────────
// backlog カラムは sprintId 未設定のみ。それ以外はフィルタ中スプリントに一致するもの。
export function boardTasksFor(tasks, filterSprintId) {
  return tasks.filter(t => {
    if (t.columnId === 'backlog') return !t.sprintId
    return filterSprintId === 'all' || t.sprintId === filterSprintId
  })
}

// ── アクティブスプリント自動選択（R-011 / S-011-10）──────────────────────
export function autoSelectedSprintId(sprints) {
  const active = sprints.find(s => s.status === 'active')
  return active ? active.id : 'all'
}
