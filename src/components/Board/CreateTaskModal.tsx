'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Stack,
  Alert,
  Box,
  Typography,
  Link,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { Status, Priority, TaskType } from '@/types';
import {
  TASK_TYPES,
  STATUSES,
  PRIORITIES,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from './constants';
import { taskFormSchema } from './taskFormSchema';

export interface TaskFormValues {
  title: string;
  description: string;
  type: TaskType;
  status: Status;
  priority: Priority;
  deadline: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValues?: Partial<TaskFormValues>;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  ticketId?: number | null;
}

const DEFAULT_VALUES: TaskFormValues = {
  title: '',
  description: '',
  type: 'Task',
  status: 'todo',
  priority: 'medium',
  deadline: '',
};

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  mode,
  initialValues,
  onClose,
  onSubmit,
  onDelete,
  ticketId,
}) => {
  const mergedInitialValues = useMemo<TaskFormValues>(
    () => ({
      ...DEFAULT_VALUES,
      ...initialValues,
      deadline: initialValues?.deadline ?? DEFAULT_VALUES.deadline,
    }),
    [initialValues]
  );

  const [formState, setFormState] =
    useState<TaskFormValues>(mergedInitialValues);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof TaskFormValues, string>>
  >({});
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof TaskFormValues, boolean>>
  >({});

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
    if (mode === 'create') {
      return (
        formState.title.trim() !== '' || formState.description.trim() !== ''
      );
    }
    return (
      formState.title.trim() !== mergedInitialValues.title ||
      formState.description.trim() !==
        (mergedInitialValues.description || '') ||
      formState.type !== mergedInitialValues.type ||
      formState.status !== mergedInitialValues.status ||
      formState.priority !== mergedInitialValues.priority ||
      formState.deadline !== (mergedInitialValues.deadline || '')
    );
  }, [formState, mode, mergedInitialValues]);

  const isSubmitDisabled =
    !isFormValid || !hasFormChanged || isSubmitting || isDeleting;

  const resetFormState = useCallback(() => {
    setFormState(mergedInitialValues);
    setError('');
    setIsSubmitting(false);
    setIsDeleting(false);
    setFieldErrors({});
    setTouchedFields({});
  }, [mergedInitialValues]);

  const handleClose = useCallback(() => {
    resetFormState();
    onClose();
  }, [onClose, resetFormState]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

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

    try {
      setIsSubmitting(true);

      await onSubmit({
        title: formState.title.trim(),
        description: formState.description.trim(),
        type: formState.type,
        status: formState.status,
        priority: formState.priority,
        deadline: formState.deadline,
      });
      handleClose();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while submitting the task'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) {
      return;
    }

    setError('');
    try {
      setIsDeleting(true);
      await onDelete();
      handleClose();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : 'Failed to delete the task'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    resetFormState();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, isOpen, resetFormState]);

  const heading = mode === 'edit' ? 'Edit Task' : 'Create New Task';
  const ticketLink =
    mode === 'edit' && ticketId != null
      ? {
          label: `TM-${ticketId}`,
          href: `/tasks/${ticketId}`,
        }
      : null;
  const showDeleteButton = mode === 'edit' && onDelete != null;

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{heading}</Typography>
          {ticketLink && (
            <Link
              href={ticketLink.href}
              underline="hover"
              color="text.secondary"
            >
              {ticketLink.label}
            </Link>
          )}
          <IconButton aria-label="close" onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Task Title"
            required
            value={formState.title}
            onChange={(e) => updateField('title', e.target.value)}
            onBlur={() => handleFieldBlur('title')}
            error={!!fieldErrors.title}
            helperText={fieldErrors.title}
            margin="normal"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              id="task-type-select"
              data-testid="task-type-select"
              value={formState.type}
              label="Type"
              onChange={(e) => updateField('type', e.target.value as TaskType)}
              onBlur={() => handleFieldBlur('type')}
              error={!!fieldErrors.type}
            >
              {TASK_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
            {fieldErrors.type && (
              <FormHelperText error>{fieldErrors.type}</FormHelperText>
            )}
          </FormControl>

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={4}
            value={formState.description}
            onChange={(e) => updateField('description', e.target.value)}
            onBlur={() => handleFieldBlur('description')}
            error={!!fieldErrors.description}
            helperText={fieldErrors.description}
            margin="normal"
          />

          <Stack direction="row" spacing={2} sx={{ mt: 0 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                id="task-status-select"
                data-testid="task-status-select"
                value={formState.status}
                label="Status"
                onChange={(e) =>
                  updateField('status', e.target.value as Status)
                }
                onBlur={() => handleFieldBlur('status')}
                error={!!fieldErrors.status}
              >
                {STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors.status && (
                <FormHelperText error>{fieldErrors.status}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Priority</InputLabel>
              <Select
                id="task-priority-select"
                data-testid="task-priority-select"
                value={formState.priority}
                label="Priority"
                onChange={(e) =>
                  updateField('priority', e.target.value as Priority)
                }
                onBlur={() => handleFieldBlur('priority')}
                error={!!fieldErrors.priority}
              >
                {PRIORITIES.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors.priority && (
                <FormHelperText error>{fieldErrors.priority}</FormHelperText>
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
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>

        <DialogActions sx={{ pl: 3, pr: 3, pb: 3 }}>
          {showDeleteButton && (
            <Button
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleClose} disabled={isSubmitting || isDeleting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitDisabled}>
            {mode === 'edit'
              ? isSubmitting
                ? 'Saving...'
                : 'Save changes'
              : isSubmitting
                ? 'Creating...'
                : 'Create task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
