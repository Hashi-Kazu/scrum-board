import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import Card from './Card'
import AddCardForm from './AddCardForm'

export default function Column({ column, tasks, sprints, onAddTask, onUpdateTask, onDeleteTask }) {
  const [showForm, setShowForm] = useState(false)

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { columnId: column.id },
  })

  const handleAdd = (taskData) => {
    onAddTask(column.id, taskData)
    setShowForm(false)
  }

  const totalPt = tasks.reduce((s, t) => s + (t.storyPoints ?? 0), 0)

  return (
    <div className={`column ${isOver ? 'column--over' : ''}`}>
      <div className="column-header" style={{ borderTopColor: column.color }}>
        <div className="column-title-row">
          <h2 className="column-title">{column.title}</h2>
          <div className="column-badges">
            {totalPt > 0 && <span className="column-pts">{totalPt}pt</span>}
            <span className="column-count" style={{ background: column.color }}>{tasks.length}</span>
          </div>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="column-body"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <Card
              key={task.id}
              task={task}
              columnId={column.id}
              sprints={sprints}
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !showForm && (
          <div className="column-empty">タスクをここにドロップ</div>
        )}

        {showForm ? (
          <AddCardForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
        ) : (
          <button className="add-card-btn" onClick={() => setShowForm(true)}>
            + タスクを追加
          </button>
        )}
      </div>
    </div>
  )
}
