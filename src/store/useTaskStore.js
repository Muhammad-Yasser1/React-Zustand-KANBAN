import { create } from 'zustand';

export const useTaskStore = create((set) => ({
	tasks: [],
	searchTerm: '',
	loadedItems: { backlog: 5, inprogress: 5, review: 5, done: 5 },
	taskOrder: { backlog: [], inprogress: [], review: [], done: [] },
	editingTask: null,
	modalOpen: false,

	setTasks: (tasks) => set({ tasks }),
	setSearchTerm: (t) => set({ searchTerm: t }),
	setLoadedItems: (fn) =>
		set((state) => ({
			loadedItems: typeof fn === 'function' ? fn(state.loadedItems) : fn,
		})),
	setTaskOrder: (order) => set({ taskOrder: order }),
	setEditingTask: (task) => set({ editingTask: task }),
	setModalOpen: (open) => set({ modalOpen: open }),
	moveTask: (taskId, newStatus, targetTaskId = null) =>
		set((state) => {
			const task = state.tasks.find((t) => t.id === taskId);
			if (!task) return state;

			const others = state.tasks.filter((t) => t.id !== taskId);
			const sameColumn = others.filter((t) => t.status === newStatus);
			const differentColumns = others.filter(
				(t) => t.status !== newStatus
			);

			let insertIndex = sameColumn.length; // default → push to end
			if (targetTaskId) {
				const targetIndex = sameColumn.findIndex(
					(t) => t.id === targetTaskId
				);
				if (targetIndex !== -1) insertIndex = targetIndex;
			}

			const updatedTask = { ...task, status: newStatus };
			sameColumn.splice(insertIndex, 0, updatedTask);

			return { tasks: [...differentColumns, ...sameColumn] };
		}),

	reorderTask: (status, draggedId, targetId) =>
		set((state) => {
			const sameColumn = state.tasks.filter((t) => t.status === status);
			const otherColumns = state.tasks.filter((t) => t.status !== status);

			const draggedIndex = sameColumn.findIndex(
				(t) => t.id === draggedId
			);
			const targetIndex = sameColumn.findIndex((t) => t.id === targetId);

			if (draggedIndex === -1 || targetIndex === -1) return state;

			const reordered = [...sameColumn];
			const [moved] = reordered.splice(draggedIndex, 1);
			reordered.splice(targetIndex, 0, moved);

			return { tasks: [...otherColumns, ...reordered] };
		}),
}));
