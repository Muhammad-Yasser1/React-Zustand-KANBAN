import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, updateTask, deleteTask } from '../api/api';
import { useTaskStore } from '../store/useTaskStore';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';

const columns = [
	{ id: 'backlog', title: 'Backlog', icon: '📋' },
	{ id: 'inprogress', title: 'In Progress', icon: '⚡' },
	{ id: 'review', title: 'Review', icon: '👁️' },
	{ id: 'done', title: 'Done', icon: '✅' },
];

export default function KanbanBoard() {
	const queryClient = useQueryClient();
	const { data, isLoading } = useQuery(['tasks'], getTasks);
	const updateM = useMutation(({ id, updates }) => updateTask(id, updates), {
		onSuccess: () => queryClient.invalidateQueries(['tasks']),
	});
	const deleteM = useMutation(deleteTask, {
		onSuccess: () => queryClient.invalidateQueries(['tasks']),
	});

	// store
	const setTasks = useTaskStore((s) => s.setTasks);
	const tasks = useTaskStore((s) => s.tasks);
	const taskOrder = useTaskStore((s) => s.taskOrder);
	const setTaskOrder = useTaskStore((s) => s.setTaskOrder);
	const searchTerm = useTaskStore((s) => s.searchTerm);
	const setSearchTerm = useTaskStore((s) => s.setSearchTerm);
	const loadedItems = useTaskStore((s) => s.loadedItems);
	const setLoadedItems = useTaskStore((s) => s.setLoadedItems);
	const setEditingTask = useTaskStore((s) => s.setEditingTask);
	const setModalOpen = useTaskStore((s) => s.setModalOpen);

	useEffect(() => {
		if (data) {
			setTasks(data);
			// initialize taskOrder (preserve previous order + append new)
			const current = taskOrder;
			const newOrder = { ...current };
			let hasChanges = false;
			[('backlog', 'inprogress', 'review', 'done')].forEach((col) => {
				const colTasks = data
					.filter((t) => t.column === col)
					.map((t) => t.id);
				const existing = current[col] || [];
				const newIds = colTasks.filter((id) => !existing.includes(id));
				const filtered = existing.filter((id) => colTasks.includes(id));
				if (filtered.length !== existing.length || newIds.length > 0) {
					newOrder[col] = [...filtered, ...newIds];
					hasChanges = true;
				}
			});
			if (hasChanges) setTaskOrder(newOrder);
		}
	}, [data]);

	const [draggedTask, setDraggedTask] = useState(null);
	const [dragOverIndex, setDragOverIndex] = useState(null);
	const [dragOverColumn, setDragOverColumn] = useState(null);

	const handleDragStart = (e, task) => {
		setDraggedTask(task);
		// help older browsers + make drop handlers robust
		try {
			e.dataTransfer.setData('text/plain', String(task.id));
		} catch (err) {}
		e.dataTransfer.effectAllowed = 'move';
		e.currentTarget.classList.add('dragging');
	};

	const handleDragEnd = (e) => {
		e.currentTarget.classList.remove('dragging');
		setDraggedTask(null);
		setDragOverIndex(null);
		setDragOverColumn(null);
	};

	const handleDrop = async (e, column, index = null) => {
		e.preventDefault();
		e.stopPropagation();
		// remove any visual column drag class
		if (e.currentTarget && e.currentTarget.classList)
			e.currentTarget.classList.remove('drag-over');

		// determine dragged id (from state or fallback to dataTransfer)
		const draggedId =
			draggedTask?.id ??
			parseInt(e.dataTransfer.getData('text/plain'), 10);
		if (!draggedId) return;

		const currentOrder = { ...taskOrder };
		const sourceColumn =
			draggedTask?.column ??
			(() => {
				// fallback: find task's current column
				const t = tasks.find((x) => x.id === draggedId);
				return t?.column;
			})();

		// defensive: ensure arrays exist
		if (!Array.isArray(currentOrder[sourceColumn]))
			currentOrder[sourceColumn] = [];
		if (!Array.isArray(currentOrder[column])) currentOrder[column] = [];

		// remove dragged id from its source order
		currentOrder[sourceColumn] = currentOrder[sourceColumn].filter(
			(id) => id !== draggedId
		);

		// compute insertion index and adjust when moving inside same column
		if (index !== null && index !== undefined) {
			let insertIndex = index;
			if (sourceColumn === column) {
				const sourceIndex = (taskOrder[column] || []).indexOf(
					draggedId
				);
				// if moving forward (to a later index) after removal the target index shifts left by 1
				if (sourceIndex !== -1 && insertIndex > sourceIndex)
					insertIndex = insertIndex - 1;
			}
			currentOrder[column].splice(insertIndex, 0, draggedId);
		} else {
			currentOrder[column].push(draggedId);
		}

		// persist the new order locally
		setTaskOrder(currentOrder);

		// if column changed, update backend for task column
		if (sourceColumn !== column) {
			try {
				await updateM.mutateAsync({
					id: draggedId,
					updates: { column },
				});
			} catch (err) {
				// on error refetch to restore state
				queryClient.invalidateQueries(['tasks']);
			}
		}

		// reset drag markers
		setDragOverIndex(null);
		setDragOverColumn(null);
	};

	const handleDelete = async (id) => {
		await deleteM.mutateAsync(id);
		// remove from local order
		const current = { ...taskOrder };
		Object.keys(current).forEach((col) => {
			current[col] = current[col].filter((tid) => tid !== id);
		});
		setTaskOrder(current);
	};

	const handleEdit = (task) => {
		setEditingTask(task);
		setModalOpen(true);
	};

	const handleSearch = (e) => setSearchTerm(e.target.value);
	const loadMore = (col) =>
		setLoadedItems((prev) => ({ ...prev, [col]: prev[col] + 5 }));

	const getOrderedTasks = (col) => {
		const order = taskOrder[col] || [];
		const colTasks = tasks.filter((t) => {
			if (!searchTerm) return t.column === col;
			const s = searchTerm.toLowerCase();
			return (
				t.column === col &&
				(t.title.toLowerCase().includes(s) ||
					t.description.toLowerCase().includes(s))
			);
		});
		const ordered = [];
		order.forEach((id) => {
			const t = colTasks.find((x) => x.id === id);
			if (t) ordered.push(t);
		});
		colTasks.forEach((t) => {
			if (!order.includes(t.id)) ordered.push(t);
		});
		return ordered;
	};

	if (isLoading && !data)
		return (
			<div className='dashboard-container'>
				<div className='text-center p-5'>
					<div className='spinner-border text-primary' role='status'>
						<span className='visually-hidden'>Loading...</span>
					</div>
				</div>
			</div>
		);

	return (
		<div className='dashboard-container'>
			<div className='dashboard-header'>
				<div className='search-container'>
					<input
						className='search-input'
						placeholder='Search tasks...'
						value={searchTerm}
						onChange={handleSearch}
					/>
					<i className='fas fa-search search-icon'></i>
				</div>
				<button
					className='add-task-btn'
					onClick={() => {
						setEditingTask(null);
						setModalOpen(true);
					}}
				>
					<i className='fas fa-plus'></i> Add Task
				</button>
			</div>

			<div className='kanban-board'>
				{columns.map((col) => {
					const columnTasks = getOrderedTasks(col.id);
					const visible = columnTasks.slice(0, loadedItems[col.id]);
					return (
						<div
							key={col.id}
							className='kanban-column'
							onDragOver={(e) => {
								e.preventDefault();
								e.currentTarget.classList.add('drag-over');
							}}
							onDragLeave={(e) =>
								e.currentTarget.classList.remove('drag-over')
							}
							onDrop={(e) => handleDrop(e, col.id)}
						>
							<div className='column-header'>
								<div className='column-title'>
									<span>{col.icon}</span>
									<span>{col.title}</span>
								</div>
								<span className='column-count'>
									{columnTasks.length}
								</span>
							</div>

							{visible.map((task, idx) => (
								<div key={task.id}>
									{dragOverColumn === col.id &&
										dragOverIndex === idx && (
											<div
												style={{
													height: 2,
													background: '#667eea',
													margin: '5px 0',
												}}
											></div>
										)}
									<div
										onDragOver={(e) => {
											e.preventDefault();
											setDragOverIndex(idx);
											setDragOverColumn(col.id);
										}}
										onDrop={(e) =>
											handleDrop(e, col.id, idx)
										}
									>
										<TaskCard
											task={task}
											onDragStart={handleDragStart}
											onDragEnd={handleDragEnd}
											onDragOverTask={(e) => {
												e.preventDefault();
												setDragOverIndex(idx);
												setDragOverColumn(col.id);
											}}
											onDropTask={(e) =>
												handleDrop(e, col.id, idx)
											}
											onDelete={handleDelete}
											onEdit={handleEdit}
										/>
									</div>
								</div>
							))}

							{dragOverColumn === col.id &&
								dragOverIndex === visible.length && (
									<div
										style={{
											height: 2,
											background: '#667eea',
											margin: '5px 0',
										}}
									></div>
								)}

							{columnTasks.length > visible.length && (
								<button
									className='load-more-btn'
									onClick={() => loadMore(col.id)}
								>
									Load More (
									{columnTasks.length - visible.length}{' '}
									remaining)
								</button>
							)}
						</div>
					);
				})}
			</div>

			<TaskModal />
		</div>
	);
}
