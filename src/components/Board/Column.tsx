'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Box, Typography, Chip } from '@mui/material';
import type { Task, Status } from '@/types';
import { Card } from './Card';

interface ColumnProps {
  id: Status;
  title: string;
  tasks: Task[];
  color?: string;
  onTaskEdit?: (task: Task) => void;
}

const statusColors: Record<Status, string> = {
  todo: '#97a0af',
  in_progress: '#0052cc',
  review: '#ffab00',
  done: '#36b37e',
};

export const Column: React.FC<ColumnProps> = ({
  id,
  title,
  tasks,
  color,
  onTaskEdit,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const columnColor = color || statusColors[id];

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1,
        minWidth: 300,
        px: 2,
        pb: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          pb: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: columnColor,
          }}
        />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
            color: 'text.secondary',
          }}
        >
          {title}
        </Typography>
        <Chip
          label={tasks.length}
          size="small"
          sx={{
            ml: 'auto',
            height: 20,
            fontSize: '0.75rem',
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          minHeight: 100,
          border: isOver ? 2 : 0,
          borderColor: 'primary.main',
          borderStyle: 'dashed',
          borderRadius: 1,
          p: isOver ? 0.5 : 0,
          transition: 'border 0.2s',
        }}
      >
        {tasks.map((task) => (
          <Card key={task.id} task={task} onEdit={onTaskEdit} />
        ))}
      </Box>
    </Box>
  );
};
