'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Alert,
  CircularProgress,
  Button,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Paper,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { fetchTaskById, updateTask, deleteTask } from '@/lib/api/tasks';
import type { Task, TaskType, Status, Priority } from '@/types';
import { taskFormSchema } from '@/components/Board/taskFormSchema';
import {
  TASK_TYPES,
  STATUSES,
  PRIORITIES,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/components/Board/constants';

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type TaskFormValues = {
  title: string;
  description: string;
  type: TaskType;
  status: Status;
  priority: Priority;
  deadline: string;
};

const DEFAULT_VALUES: TaskFormValues = {
  title: '',
  description: '',
  type: 'Task',
  status: 'todo',
  priority: 'medium',
  deadline: '',
};

export default function TaskEditPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = Number(params.id);

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formState, setFormState] = useState<TaskFormValues>(DEFAULT_VALUES);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof TaskFormValues, string>>
  >({});
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof TaskFormValues, boolean>>
  >({});

  useEffect(() => {
    if (isNaN(taskId)) {
      setError('Invalid task ID');
      setIsLoading(false);
      return;
    }

    const loadTask = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedTask = await fetchTaskById(taskId);
        setTask(loadedTask);
        setFormState({
          title: loadedTask.title,
          description: loadedTask.description || '',
          type: loadedTask.type || 'Task',
          status: loadedTask.status,
          priority: loadedTask.priority,
          deadline: loadedTask.deadline
            ? formatDateInput(loadedTask.deadline)
            : '',
        });
      } catch (err) {
        console.error('Failed to load task:', err);
        setError(err instanceof Error ? err.message : 'Failed to load task');
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [taskId]);

  const updateField = useCallback(
    <K extends keyof TaskFormValues>(field: K, value: TaskFormValues[K]) => {
      setFormState((prev) => {
        const newState = { ...prev, [field]: value };
        if (touchedFields[field]) {
          const validation = taskFormSchema.safeParse(newState);
          if (!validation.success) {
            const fieldError = validation.error.issues.find(
              (e) => e.path[0] === field
            );
            setFieldErrors((prev) => ({
              ...prev,
              [field]: fieldError?.message,
            }));
          } else {
            setFieldErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors[field];
              return newErrors;
            });
          }
        }
        return newState;
      });
    },
    [touchedFields]
  );

  const handleFieldBlur = useCallback(
    (field: keyof TaskFormValues) => {
      setTouchedFields((prev) => ({ ...prev, [field]: true }));
      const validation = taskFormSchema.safeParse(formState);
      if (!validation.success) {
        const fieldError = validation.error.issues.find(
          (e) => e.path[0] === field
        );
        setFieldErrors((prev) => ({
          ...prev,
          [field]: fieldError?.message,
        }));
      } else {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [formState]
  );

  const isFormValid = useMemo(() => {
    const validation = taskFormSchema.safeParse(formState);
    return validation.success;
  }, [formState]);

  const hasFormChanged = useMemo(() => {
    if (!task) return false;
    return (
      formState.title.trim() !== task.title ||
      formState.description.trim() !== (task.description || '') ||
      formState.type !== (task.type || 'Task') ||
      formState.status !== task.status ||
      formState.priority !== task.priority ||
      formState.deadline !==
        (task.deadline ? formatDateInput(task.deadline) : '')
    );
  }, [formState, task]);

  const isSubmitDisabled =
    !isFormValid || !hasFormChanged || isSubmitting || isDeleting;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const allFields: (keyof TaskFormValues)[] = [
      'title',
      'description',
      'type',
      'status',
      'priority',
      'deadline',
    ];
    setTouchedFields(
      allFields.reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {} as Partial<Record<keyof TaskFormValues, boolean>>
      )
    );

    const validation = taskFormSchema.safeParse(formState);
    if (!validation.success) {
      const errors: Partial<Record<keyof TaskFormValues, string>> = {};
      validation.error.issues.forEach((err) => {
        const field = err.path[0] as keyof TaskFormValues;
        if (field) {
          errors[field] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    if (!task) return;

    try {
      setIsSubmitting(true);
      await updateTask(task.id, {
        title: formState.title.trim(),
        description: formState.description.trim(),
        type: formState.type,
        status: formState.status,
        priority: formState.priority,
        deadline: formState.deadline || undefined,
      });
      router.push('/backlog');
    } catch (err) {
      console.error('Failed to update task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setError(null);
    try {
      setIsDeleting(true);
      await deleteTask(task.id);
      router.push('/backlog');
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <Sidebar>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Stack spacing={3}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/backlog')}
              sx={{ alignSelf: 'flex-start' }}
            >
              Back to Backlog
            </Button>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h4" component="h1">
                Edit Task
              </Typography>
              {task && (
                <Typography variant="body2" color="text.secondary">
                  TM-{task.id}
                </Typography>
              )}
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error || 'An error occurred'}
              </Alert>
            )}

            {isLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : task ? (
              <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Task Title"
                      required
                      value={formState.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      onBlur={() => handleFieldBlur('title')}
                      error={!!fieldErrors.title}
                      helperText={fieldErrors.title}
                    />

                    <FormControl fullWidth error={!!fieldErrors.type}>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={formState.type}
                        label="Type"
                        onChange={(e) =>
                          updateField('type', e.target.value as TaskType)
                        }
                        onBlur={() => handleFieldBlur('type')}
                      >
                        {TASK_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                      {fieldErrors.type && (
                        <FormHelperText>{fieldErrors.type}</FormHelperText>
                      )}
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={4}
                      value={formState.description}
                      onChange={(e) =>
                        updateField('description', e.target.value)
                      }
                      onBlur={() => handleFieldBlur('description')}
                      error={!!fieldErrors.description}
                      helperText={fieldErrors.description}
                    />

                    <Stack direction="row" spacing={2}>
                      <FormControl fullWidth error={!!fieldErrors.status}>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={formState.status}
                          label="Status"
                          onChange={(e) =>
                            updateField('status', e.target.value as Status)
                          }
                          onBlur={() => handleFieldBlur('status')}
                        >
                          {STATUSES.map((status) => (
                            <MenuItem key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </MenuItem>
                          ))}
                        </Select>
                        {fieldErrors.status && (
                          <FormHelperText>{fieldErrors.status}</FormHelperText>
                        )}
                      </FormControl>

                      <FormControl fullWidth error={!!fieldErrors.priority}>
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={formState.priority}
                          label="Priority"
                          onChange={(e) =>
                            updateField('priority', e.target.value as Priority)
                          }
                          onBlur={() => handleFieldBlur('priority')}
                        >
                          {PRIORITIES.map((priority) => (
                            <MenuItem key={priority} value={priority}>
                              {PRIORITY_LABELS[priority]}
                            </MenuItem>
                          ))}
                        </Select>
                        {fieldErrors.priority && (
                          <FormHelperText>
                            {fieldErrors.priority}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Stack>

                    <TextField
                      fullWidth
                      type="date"
                      label="Deadline"
                      value={formState.deadline}
                      onChange={(e) => updateField('deadline', e.target.value)}
                      onBlur={() => handleFieldBlur('deadline')}
                      error={!!fieldErrors.deadline}
                      helperText={fieldErrors.deadline}
                      InputLabelProps={{ shrink: true }}
                    />

                    <Divider />

                    <Stack
                      direction="row"
                      spacing={2}
                      justifyContent="space-between"
                    >
                      <Button
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDelete}
                        disabled={isSubmitting || isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Button>
                      <Stack direction="row" spacing={2}>
                        <Button
                          onClick={() => router.push('/backlog')}
                          disabled={isSubmitting || isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={<SaveIcon />}
                          disabled={isSubmitDisabled}
                        >
                          {isSubmitting ? 'Saving...' : 'Save changes'}
                        </Button>
                      </Stack>
                    </Stack>
                  </Stack>
                </form>
              </Paper>
            ) : (
              <Alert severity="warning">Task not found</Alert>
            )}
          </Stack>
        </Container>
      </Sidebar>
    </Box>
  );
}
