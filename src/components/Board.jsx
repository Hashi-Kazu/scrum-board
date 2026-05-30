import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import Column from './Column'
import Card from './Card'

export default function Board({ columns, tasks, sprints, onAddTask, onUpdateTask, onDeleteTask, onMoveTask, onReorderTasks }) {
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // スマホ：長押し 200ms でドラッグ開始（スクロールと干渉しない）
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find(t => t.id === active.id) ?? null)
  }

  const handleDragOver = ({ active, over }) => {
    if (!over || active.id === over.id) return

    const activeTask = tasks.find(t => t.id === active.id)
    if (!activeTask) return

    // over がカードかカラムかを判定
    const overTask = tasks.find(t => t.id === over.id)
    const targetColumnId = overTask?.columnId ?? over.id

    if (overTask) {
      // 別のカードの上にいる → 並び替え（カラムをまたぐ場合も含む）
      onReorderTasks(active.id, over.id, targetColumnId)
    } else if (activeTask.columnId !== targetColumnId) {
      // カラムの空白エリアに入った → カラム移動
      onMoveTask(active.id, targetColumnId)
    }
  }

  const handleDragEnd = () => {
    setActiveTask(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="board">
        {columns.map(col => (
          <Column
            key={col.id}
            column={col}
            tasks={tasks.filter(t => t.columnId === col.id)}
            sprints={sprints}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && <Card task={activeTask} isOverlay />}
      </DragOverlay>
    </DndContext>
  )
}
