'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Container, Alert, CircularProgress } from '@mui/material';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Board } from '@/components/Board/Board';
import { Toolbar } from '@/components/Board/Toolbar';
import {
  CreateTaskModal,
  type TaskFormValues,
} from '@/components/Board/CreateTaskModal';
import type { Task, Status } from '@/types';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  type CreateTaskPayload,
} from '@/lib/api/tasks';

interface FilterState {
  status: Status | '';
  priority: string;
  createdFrom: string;
  createdTo: string;
}

export default function BoardPage() {
  const [kanbanTasks, setKanbanTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    priority: '',
    createdFrom: '',
    createdTo: '',
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousTasksRef = useRef<Task[] | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        const apiFilters: {
          status?: Status;
          priority?: string;
          createdFrom?: string;
          createdTo?: string;
        } = {};

        if (filters.status) {
          apiFilters.status = filters.status;
        }
        if (filters.priority) {
          apiFilters.priority = filters.priority;
        }
        if (filters.createdFrom) {
          apiFilters.createdFrom = filters.createdFrom;
        }
        if (filters.createdTo) {
          apiFilters.createdTo = filters.createdTo;
        }

        const tasksResponse = await fetchTasks(apiFilters);
        const tasks = Array.isArray(tasksResponse)
          ? tasksResponse
          : tasksResponse.tasks;
        setKanbanTasks(tasks);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : 'Failed to load tasks from API'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [filters]);

  const handleTaskMove = (taskId: number, newStatus: Status) => {
    setKanbanTasks((prevTasks) => {
      previousTasksRef.current = prevTasks;
      return prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );
    });

    updateTask(taskId, { status: newStatus })
      .then(() => {
        previousTasksRef.current = null;
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        if (previousTasksRef.current) {
          setKanbanTasks(previousTasksRef.current);
        }
        setError(
          err instanceof Error ? err.message : 'Failed to update task status'
        );
      });
  };

  const handleCreateTask = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateTaskSubmit = async (data: TaskFormValues) => {
    const payload: CreateTaskPayload = {
      title: data.title,
      description: data.description || undefined,
      type: data.type,
      status: data.status,
      priority: data.priority,
      deadline: data.deadline ? data.deadline : undefined,
    };

    try {
      const newTask = await createTask(payload);
      setKanbanTasks((prevTasks) => [...prevTasks, newTask]);
      setIsCreateModalOpen(false);
      setError(null);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : 'Failed to create task';
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  };

  const handleEditTaskSubmit = async (data: TaskFormValues) => {
    if (!editingTask) {
      return;
    }

    try {
      const updatedTask = await updateTask(editingTask.id, {
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        status: data.status,
        priority: data.priority,
        deadline: data.deadline ? data.deadline : undefined,
      });

      setKanbanTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === editingTask.id ? updatedTask : task
        )
      );
      setEditingTask(null);
      setError(null);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : 'Failed to update the task';
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  };

  const handleDeleteTask = async () => {
    if (!editingTask) {
      return;
    }

    try {
      await deleteTask(editingTask.id);
      setKanbanTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== editingTask.id)
      );
      setEditingTask(null);
      setError(null);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : 'Failed to delete the task';
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  function mapTaskToFormValues(task: Task): TaskFormValues {
    return {
      title: task.title,
      description: task.description ?? '',
      type: task.type ?? 'Task',
      status: task.status,
      priority: task.priority,
      deadline: task.deadline ? formatDateInput(task.deadline) : '',
    };
  }

  function formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <Sidebar>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Toolbar
            onCreateTask={handleCreateTask}
            onFilterChange={handleFilterChange}
          />
          <Container maxWidth={false} sx={{ py: 3, flex: 1 }}>
            {error && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {isLoading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={200}
              >
                <CircularProgress />
              </Box>
            ) : (
              <Board
                tasks={kanbanTasks}
                onTaskMove={handleTaskMove}
                onTaskEdit={setEditingTask}
              />
            )}
          </Container>
        </Box>

        <CreateTaskModal
          isOpen={isCreateModalOpen}
          mode="create"
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTaskSubmit}
        />

        <CreateTaskModal
          isOpen={Boolean(editingTask)}
          mode="edit"
          initialValues={
            editingTask ? mapTaskToFormValues(editingTask) : undefined
          }
          onClose={() => setEditingTask(null)}
          onSubmit={handleEditTaskSubmit}
          onDelete={handleDeleteTask}
          ticketId={editingTask?.id ?? null}
        />
      </Sidebar>
    </Box>
  );
}
