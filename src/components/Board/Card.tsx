'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  Card as MuiCard,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Stack,
  Box,
} from '@mui/material';
import { Edit as EditIcon, Event as EventIcon } from '@mui/icons-material';
import type { Task } from '@/types';
import { format } from 'date-fns';

interface CardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

const priorityColor: Record<Task['priority'], string> = {
  low: '#97a0af',
  medium: '#0052cc',
  high: '#ff5630',
  urgent: '#ff5630',
};

export const Card: React.FC<CardProps> = ({ task, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <MuiCard
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.7 : 1,
        boxShadow: isDragging ? 2 : 1,
        transition: isDragging ? 'none' : 'box-shadow 0.2s, transform 0.2s',
        '&:hover': {
          boxShadow: isDragging ? 2 : 3,
        },
        ...style,
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" mb={1}>
          <Typography variant="body1" fontWeight={600} sx={{ flex: 1 }}>
            {task.title}
          </Typography>
          {onEdit && (
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                onEdit(task);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>

        {task.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {task.description}
          </Typography>
        )}

        <Stack
          direction="row"
          spacing={1}
          justifyContent="space-between"
          alignItems="center"
        >
          {task.deadline && (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{ color: 'text.secondary' }}
            >
              <EventIcon fontSize="small" sx={{ fontSize: '0.875rem' }} />
              <Typography variant="caption" color="text.secondary">
                {format(task.deadline, 'MMM dd, yyyy')}
              </Typography>
            </Stack>
          )}
          {!task.deadline && <Box />}
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip
              label={task.type ?? 'Task'}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
            <Chip
              label={task.priority.toUpperCase()}
              size="small"
              sx={{
                fontSize: '0.7rem',
                height: 20,
                bgcolor: priorityColor[task.priority],
                color: 'white',
              }}
            />
          </Stack>
        </Stack>
      </CardContent>
    </MuiCard>
  );
};
