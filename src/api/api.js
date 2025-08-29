import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const client = axios.create({ baseURL: API_BASE });

export const getTasks = () => client.get('/tasks').then((r) => r.data);
export const createTask = (task) =>
	client.post('/tasks', task).then((r) => r.data);
export const updateTask = (id, updates) =>
	client.patch(`/tasks/${id}`, updates).then((r) => r.data);
export const deleteTask = (id) =>
	client.delete(`/tasks/${id}`).then((r) => r.data);
