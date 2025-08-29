import React from 'react';

export default function TaskCard({
	task,
	onDragStart,
	onDragEnd,
	onDragOverTask,
	onDropTask,
	onDelete,
	onEdit,
}) {
	// We forward the drag handlers from parent so the board can manage order.
	return (
		<div
			className='task-card'
			draggable
			onDragStart={(e) => onDragStart && onDragStart(e, task)}
			onDragEnd={(e) => onDragEnd && onDragEnd(e)}
			onDragOver={(e) => onDragOverTask && onDragOverTask(e)}
			onDrop={(e) => onDropTask && onDropTask(e)}
		>
			<div className='task-title'>{task.title}</div>
			<div className='task-description'>{task.description}</div>
			<div className='task-actions'>
				<button
					className='task-btn edit-btn'
					onClick={() => onEdit && onEdit(task)}
				>
					<i className='fas fa-edit'></i>
				</button>
				<button
					className='task-btn delete-btn'
					onClick={() => onDelete && onDelete(task.id)}
				>
					<i className='fas fa-trash'></i>
				</button>
			</div>
		</div>
	);
}
