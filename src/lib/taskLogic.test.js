import { describe, it, expect } from 'vitest'
import {
  computeProgress,
  progressTasksFor,
  sumStoryPoints,
  priorityMeta,
  avatarColor,
  AVATAR_COLORS,
  formatDue,
  dueBadgeClass,
  normalizeStoryPoints,
  computeVelocity,
  averageVelocity,
  boardTasksFor,
  autoSelectedSprintId,
} from './taskLogic'

// R-009 進捗表示 / S-009-01,02,04
describe('computeProgress (S-009-01,02,04)', () => {
  it('「完了」カラムのタスクのみを完了としてカウントする (S-009-04)', () => {
    const tasks = [
      { columnId: 'todo' },
      { columnId: 'done' },
      { columnId: 'done' },
      { columnId: 'review' },
    ]
    expect(computeProgress(tasks)).toEqual({ done: 2, total: 4, percent: 50 })
  })

  it('タスクが0件のとき完了率は0%', () => {
    expect(computeProgress([])).toEqual({ done: 0, total: 0, percent: 0 })
  })

  it('完了率は四捨五入される', () => {
    const tasks = [{ columnId: 'done' }, { columnId: 'todo' }, { columnId: 'todo' }]
    expect(computeProgress(tasks).percent).toBe(33)
  })
})

// R-009 進捗対象の抽出（スプリントフィルタ）
describe('progressTasksFor (S-009-03)', () => {
  const tasks = [
    { id: 1, sprintId: 'a' },
    { id: 2, sprintId: 'b' },
    { id: 3, sprintId: null },
  ]
  it('「すべて」のときは全タスクを対象とする', () => {
    expect(progressTasksFor(tasks, 'all')).toHaveLength(3)
  })
  it('スプリント選択時は該当スプリントのみ', () => {
    expect(progressTasksFor(tasks, 'a')).toEqual([{ id: 1, sprintId: 'a' }])
  })
})

// R-012 ストーリーポイント / S-012-03
describe('sumStoryPoints (S-012-03)', () => {
  it('カラム内タスクのSP合計（未設定は0扱い）', () => {
    expect(sumStoryPoints([{ storyPoints: 3 }, { storyPoints: null }, { storyPoints: 5 }])).toBe(8)
  })
  it('空配列は0', () => {
    expect(sumStoryPoints([])).toBe(0)
  })
})

// R-012 ストーリーポイント入力正規化 / S-012-05,06
describe('normalizeStoryPoints (S-012-05,06)', () => {
  it('空文字はnull', () => {
    expect(normalizeStoryPoints('')).toBeNull()
    expect(normalizeStoryPoints('   ')).toBeNull()
  })
  it('正の整数はそのまま', () => {
    expect(normalizeStoryPoints('5')).toBe(5)
  })
  it('0以下は1に丸める', () => {
    expect(normalizeStoryPoints('0')).toBe(1)
    expect(normalizeStoryPoints('-3')).toBe(1)
  })
  it('数値でない入力はnull', () => {
    expect(normalizeStoryPoints('abc')).toBeNull()
  })
})

// R-007 優先度表示 / S-007-01,02
describe('priorityMeta (S-007-01,02)', () => {
  it('高・中・低のラベルとクラスを返す', () => {
    expect(priorityMeta('high')).toEqual({ label: '高', className: 'priority--high' })
    expect(priorityMeta('medium')).toEqual({ label: '中', className: 'priority--medium' })
    expect(priorityMeta('low')).toEqual({ label: '低', className: 'priority--low' })
  })
  it('不明な優先度は中にフォールバック', () => {
    expect(priorityMeta('unknown').label).toBe('中')
  })
})

// R-008 担当者表示 / S-008-03
describe('avatarColor (S-008-03)', () => {
  it('同じ名前は常に同じ色（一意決定）', () => {
    expect(avatarColor('田中')).toBe(avatarColor('田中'))
  })
  it('返り値はパレット内の色', () => {
    expect(AVATAR_COLORS).toContain(avatarColor('鈴木'))
  })
  it('空・未定義でもエラーにならず色を返す', () => {
    expect(AVATAR_COLORS).toContain(avatarColor(''))
    expect(AVATAR_COLORS).toContain(avatarColor(undefined))
  })
})

// R-016 期限管理 / S-016-01,03,04
describe('formatDue (S-016-01)', () => {
  it('MM/DD 形式（先頭ゼロなし）で返す', () => {
    expect(formatDue('2026-03-05')).toBe('3/5')
    expect(formatDue('2026-12-25')).toBe('12/25')
  })
  it('未設定はnull', () => {
    expect(formatDue(null)).toBeNull()
    expect(formatDue('')).toBeNull()
  })
})

describe('dueBadgeClass (S-016-03,04)', () => {
  const now = new Date('2026-06-19T10:00:00')
  it('期限超過は overdue (S-016-03)', () => {
    expect(dueBadgeClass({ dueDate: '2026-06-10', columnId: 'todo' }, now)).toBe('due-badge--overdue')
  })
  it('2日以内は soon (S-016-03)', () => {
    expect(dueBadgeClass({ dueDate: '2026-06-20', columnId: 'todo' }, now)).toBe('due-badge--soon')
    expect(dueBadgeClass({ dueDate: '2026-06-21', columnId: 'todo' }, now)).toBe('due-badge--soon')
  })
  it('3日以上先は set (S-016-03)', () => {
    expect(dueBadgeClass({ dueDate: '2026-06-30', columnId: 'todo' }, now)).toBe('due-badge--set')
  })
  it('完了カラムは期限超過でも色変化しない (S-016-04)', () => {
    expect(dueBadgeClass({ dueDate: '2026-06-10', columnId: 'done' }, now)).toBe('due-badge--set')
  })
  it('期限未設定は set', () => {
    expect(dueBadgeClass({ dueDate: null, columnId: 'todo' }, now)).toBe('due-badge--set')
  })
})

// R-013 ベロシティ / S-013-01,05
describe('computeVelocity (S-013-01,05)', () => {
  it('「完了」カラムのタスクのSP合計をベロシティとする (S-013-01)', () => {
    const tasks = [
      { columnId: 'done', storyPoints: 3 },
      { columnId: 'done', storyPoints: 5 },
      { columnId: 'todo', storyPoints: 8 },
    ]
    expect(computeVelocity(tasks).velocity).toBe(8)
  })
  it('SP未設定タスクの件数を除外件数として返す (S-013-05)', () => {
    const tasks = [
      { columnId: 'done', storyPoints: 3 },
      { columnId: 'done', storyPoints: null },
      { columnId: 'todo', storyPoints: 0 },
    ]
    const { velocity, excludedCount } = computeVelocity(tasks)
    expect(velocity).toBe(3)
    expect(excludedCount).toBe(2)
  })
})

// R-013 平均ベロシティ / S-013-04
describe('averageVelocity (S-013-04)', () => {
  it('完了スプリントのベロシティ平均（四捨五入）', () => {
    expect(averageVelocity([{ velocity: 10 }, { velocity: 13 }])).toBe(12)
  })
  it('対象なしは0', () => {
    expect(averageVelocity([])).toBe(0)
    expect(averageVelocity([{ velocity: null }])).toBe(0)
  })
})

// R-004 ボード表示 / S-004-07, R-011
describe('boardTasksFor (S-004-07, S-011-08,09)', () => {
  const tasks = [
    { id: 1, columnId: 'backlog', sprintId: null },
    { id: 2, columnId: 'backlog', sprintId: 'a' }, // 割り当て済みはバックログに出ない
    { id: 3, columnId: 'todo', sprintId: 'a' },
    { id: 4, columnId: 'todo', sprintId: 'b' },
  ]
  it('バックログは sprintId 未設定のタスクのみ (S-004-07)', () => {
    const result = boardTasksFor(tasks, 'all')
    expect(result.find(t => t.id === 1)).toBeTruthy()
    expect(result.find(t => t.id === 2)).toBeFalsy()
  })
  it('スプリントフィルタ中は該当スプリントの非バックログのみ', () => {
    const result = boardTasksFor(tasks, 'a')
    expect(result.map(t => t.id).sort()).toEqual([1, 3])
  })
})

// R-011 アクティブスプリント自動選択 / S-011-10
describe('autoSelectedSprintId (S-011-10)', () => {
  it('アクティブなスプリントがあればそのIDを返す', () => {
    const sprints = [
      { id: 's1', status: 'planned' },
      { id: 's2', status: 'active' },
    ]
    expect(autoSelectedSprintId(sprints)).toBe('s2')
  })
  it('アクティブがなければ「all」', () => {
    expect(autoSelectedSprintId([{ id: 's1', status: 'planned' }])).toBe('all')
    expect(autoSelectedSprintId([])).toBe('all')
  })
})
