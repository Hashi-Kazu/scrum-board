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

// R-009 progressTasksFor 追加ケース
describe('progressTasksFor 追加 (S-009-03)', () => {
  const tasks = [
    { id: 1, sprintId: 'a' },
    { id: 2, sprintId: null },
  ]
  it('null の sprintId を持つタスクは "all" のとき含まれる', () => {
    const result = progressTasksFor(tasks, 'all')
    expect(result.find(t => t.id === 2)).toBeTruthy()
  })
  it('スプリントフィルタ中に sprintId=null のタスクは除外される', () => {
    const result = progressTasksFor(tasks, 'a')
    expect(result.find(t => t.id === 2)).toBeFalsy()
  })
})

// R-004 boardTasksFor 追加ケース
describe('boardTasksFor 追加 (S-004-07)', () => {
  const tasks = [
    { id: 1, columnId: 'backlog', sprintId: null },
    { id: 2, columnId: 'backlog', sprintId: 'a' },
    { id: 3, columnId: 'todo', sprintId: 'a' },
    { id: 4, columnId: 'todo', sprintId: 'b' },
  ]
  it('"all" フィルタでは backlog 以外の全タスクも含まれる（id=3,4 が含まれる）', () => {
    const result = boardTasksFor(tasks, 'all')
    expect(result.find(t => t.id === 3)).toBeTruthy()
    expect(result.find(t => t.id === 4)).toBeTruthy()
  })
  it('バックログに sprintId ありのタスクは "all" でも除外される（id=2）', () => {
    const result = boardTasksFor(tasks, 'all')
    expect(result.find(t => t.id === 2)).toBeFalsy()
  })
})

// R-009 computeProgress 追加ケース
describe('computeProgress 追加 (S-009-01,02)', () => {
  it('全タスクが done のとき 100%', () => {
    const tasks = [{ columnId: 'done' }, { columnId: 'done' }]
    expect(computeProgress(tasks).percent).toBe(100)
  })
  it('done が0のとき 0%', () => {
    const tasks = [{ columnId: 'todo' }, { columnId: 'review' }]
    expect(computeProgress(tasks).percent).toBe(0)
  })
})

// R-012 normalizeStoryPoints 追加ケース
describe('normalizeStoryPoints 追加 (S-012-05,06)', () => {
  it('"1.5" のような小数は parseInt で 1 になる', () => {
    expect(normalizeStoryPoints('1.5')).toBe(1)
  })
  it('"10" は 10 を返す', () => {
    expect(normalizeStoryPoints('10')).toBe(10)
  })
})

// R-016 dueBadgeClass 追加ケース
describe('dueBadgeClass 追加 (S-016-03,04)', () => {
  const now = new Date('2026-06-20T10:00:00')
  it('dueDate が当日と同じ日のとき soon（2日以内なので）', () => {
    expect(dueBadgeClass({ dueDate: '2026-06-20', columnId: 'todo' }, now)).toBe('due-badge--soon')
  })
  it('columnId が "in-progress" のとき超過は overdue になる（done 以外）', () => {
    expect(dueBadgeClass({ dueDate: '2026-06-10', columnId: 'in-progress' }, now)).toBe('due-badge--overdue')
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
  it('completed のみでも active が無ければ「all」', () => {
    expect(autoSelectedSprintId([{ id: 's1', status: 'completed' }])).toBe('all')
  })
  it('active が複数あれば先頭の active を返す', () => {
    const sprints = [
      { id: 's1', status: 'active' },
      { id: 's2', status: 'active' },
    ]
    expect(autoSelectedSprintId(sprints)).toBe('s1')
  })
})

// ── 以下、境界値・異常系の追加カバレッジ ─────────────────────────────────

// R-009 computeProgress 境界値
describe('computeProgress 境界値 (S-009-01,02,04)', () => {
  it('done と todo が混在し四捨五入が切り上がる（2/3=67%）', () => {
    const tasks = [{ columnId: 'done' }, { columnId: 'done' }, { columnId: 'todo' }]
    expect(computeProgress(tasks).percent).toBe(67)
  })
  it('backlog のタスクは完了にカウントされない', () => {
    const tasks = [{ columnId: 'backlog' }, { columnId: 'done' }]
    expect(computeProgress(tasks)).toEqual({ done: 1, total: 2, percent: 50 })
  })
})

// R-012 sumStoryPoints 異常系
describe('sumStoryPoints 異常系 (S-012-03)', () => {
  it('storyPoints が undefined のタスクは0扱い', () => {
    expect(sumStoryPoints([{ storyPoints: undefined }, { storyPoints: 4 }])).toBe(4)
  })
  it('storyPoints プロパティ自体が無いタスクも0扱い', () => {
    expect(sumStoryPoints([{}, { storyPoints: 2 }])).toBe(2)
  })
})

// R-008 avatarColor 異常系
describe('avatarColor 異常系 (S-008-03)', () => {
  it('null を渡してもエラーにならずパレット内の色を返す', () => {
    expect(AVATAR_COLORS).toContain(avatarColor(null))
  })
  it('異なる頭文字は異なる色になりうる（決定的マッピング）', () => {
    // 同じ頭文字なら必ず同じ色
    expect(avatarColor('Alice')).toBe(avatarColor('Andrew'))
  })
})

// R-016 formatDue 境界値
describe('formatDue 境界値 (S-016-01)', () => {
  it('1月1日は 1/1', () => {
    expect(formatDue('2026-01-01')).toBe('1/1')
  })
  it('先頭ゼロの月日でもゼロを落とす', () => {
    expect(formatDue('2026-09-08')).toBe('9/8')
  })
})

// R-013 computeVelocity 異常系
describe('computeVelocity 異常系 (S-013-01,05)', () => {
  it('空配列は velocity=0, excludedCount=0', () => {
    expect(computeVelocity([])).toEqual({ velocity: 0, excludedCount: 0 })
  })
  it('done でない SP 設定済みタスクはベロシティに含めない', () => {
    const tasks = [
      { columnId: 'in-progress', storyPoints: 5 },
      { columnId: 'review', storyPoints: 3 },
    ]
    expect(computeVelocity(tasks).velocity).toBe(0)
  })
  it('storyPoints=0 は除外件数にカウントされる（falsy）', () => {
    const tasks = [{ columnId: 'done', storyPoints: 0 }]
    const { velocity, excludedCount } = computeVelocity(tasks)
    expect(velocity).toBe(0)
    expect(excludedCount).toBe(1)
  })
  it('SP未設定（undefined）も除外件数にカウントされる', () => {
    const tasks = [{ columnId: 'done' }, { columnId: 'done', storyPoints: 2 }]
    expect(computeVelocity(tasks).excludedCount).toBe(1)
  })
})

// R-013 averageVelocity 異常系
describe('averageVelocity 異常系 (S-013-04)', () => {
  it('velocity=undefined のスプリントは平均算出から除外', () => {
    expect(averageVelocity([{ velocity: undefined }, { velocity: 10 }])).toBe(10)
  })
  it('velocity=0 は有効な値として平均に含まれる', () => {
    expect(averageVelocity([{ velocity: 0 }, { velocity: 10 }])).toBe(5)
  })
  it('平均は四捨五入される（10と11の平均=11）', () => {
    expect(averageVelocity([{ velocity: 10 }, { velocity: 11 }])).toBe(11)
  })
})

// R-004 boardTasksFor 異常系
describe('boardTasksFor 異常系 (S-004-07)', () => {
  it('backlog で sprintId が空文字のタスクも表示される（falsy）', () => {
    const tasks = [{ id: 1, columnId: 'backlog', sprintId: '' }]
    expect(boardTasksFor(tasks, 'all')).toHaveLength(1)
  })
  it('スプリントフィルタ中、非バックログで sprintId 不一致は除外', () => {
    const tasks = [{ id: 1, columnId: 'todo', sprintId: 'b' }]
    expect(boardTasksFor(tasks, 'a')).toHaveLength(0)
  })
  it('空配列は空配列を返す', () => {
    expect(boardTasksFor([], 'all')).toEqual([])
  })
})

// R-007 priorityMeta 異常系
describe('priorityMeta 異常系 (S-007-01,02)', () => {
  it('null/undefined は中にフォールバック', () => {
    expect(priorityMeta(null).label).toBe('中')
    expect(priorityMeta(undefined).label).toBe('中')
  })
})

// R-012 normalizeStoryPoints 異常系
describe('normalizeStoryPoints 異常系 (S-012-05,06)', () => {
  it('数値型の入力も文字列化して処理する', () => {
    expect(normalizeStoryPoints(5)).toBe(5)
    expect(normalizeStoryPoints(0)).toBe(1)
  })
  it('前後に空白がある数値も解釈する', () => {
    expect(normalizeStoryPoints('  7  ')).toBe(7)
  })
})
