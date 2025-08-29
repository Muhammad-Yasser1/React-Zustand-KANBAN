import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, updateTask } from '../api/api';
import { useTaskStore } from '../store/useTaskStore';

export default function TaskModal() {
	const editing = useTaskStore((s) => s.editingTask);
	const modalOpen = useTaskStore((s) => s.modalOpen);
	const setEditing = useTaskStore((s) => s.setEditingTask);
	const setModalOpen = useTaskStore((s) => s.setModalOpen);
	const queryClient = useQueryClient();
	const createM = useMutation(createTask, {
		onSuccess: () => queryClient.invalidateQueries(['tasks']),
	});
	const updateM = useMutation(({ id, updates }) => updateTask(id, updates), {
		onSuccess: () => queryClient.invalidateQueries(['tasks']),
	});

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [column, setColumn] = useState('backlog');

	// initialize fields when modal opens or editing changes
	useEffect(() => {
		if (modalOpen) {
			setTitle(editing?.title ?? '');
			setDescription(editing?.description ?? '');
			setColumn(editing?.column ?? 'backlog');
		}
	}, [editing, modalOpen]);

	const close = () => {
		setModalOpen(false);
		setEditing(null);
	};

	const save = async () => {
		if (!title.trim()) {
			alert('Please enter a task title');
			return;
		}
		if (editing) {
			await updateM.mutateAsync({
				id: editing.id,
				updates: { title, description, column },
			});
		} else {
			await createM.mutateAsync({ title, description, column });
		}
		close();
	};

	// don't render modal DOM when closed
	if (!modalOpen) return null;

	return (
		<div
			className='modal-backdrop'
			onClick={(e) => {
				if (e.target === e.currentTarget) close();
			}}
		>
			<div className='modal-content'>
				<div className='modal-header'>
					<h3 id='modalTitle'>
						{editing ? 'Edit Task' : 'Add New Task'}
					</h3>
				</div>

				<div className='modal-body'>
					<div className='form-group'>
						<label className='form-label'>Title</label>
						<input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className='form-control'
						/>
					</div>

					<div className='form-group'>
						<label className='form-label'>Description</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows='3'
							className='form-control'
						/>
					</div>

					<div className='form-group'>
						<label className='form-label'>Column</label>
						<select
							value={column}
							onChange={(e) => setColumn(e.target.value)}
							className='form-select'
						>
							<option value='backlog'>Backlog</option>
							<option value='inprogress'>In Progress</option>
							<option value='review'>Review</option>
							<option value='done'>Done</option>
						</select>
					</div>
				</div>

				<div className='modal-footer'>
					<button className='btn btn-secondary' onClick={close}>
						Cancel
					</button>
					<button className='btn btn-primary' onClick={save}>
						Save Task
					</button>
				</div>
			</div>
		</div>
	);
}
