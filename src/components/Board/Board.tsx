'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Box } from '@mui/material';
import type { Task, Status } from '@/types';
import { Column } from './Column';
import { Card } from './Card';

interface BoardProps {
  tasks: Task[];
  onTaskMove?: (taskId: number, newStatus: Status) => void;
  onTaskEdit?: (task: Task) => void;
}

export const Board: React.FC<BoardProps> = ({
  tasks,
  onTaskMove,
  onTaskEdit,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns: { id: Status; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' },
  ];

  const tasksByStatus = columns.reduce(
    (acc, column) => {
      acc[column.id] = tasks.filter((task) => task.status === column.id);
      return acc;
    },
    {} as Record<Status, Task[]>
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = Number(active.id);
    const task = tasks.find((t) => t.id === taskId);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = Number(active.id);
    if (Number.isNaN(taskId)) {
      setActiveTask(null);
      return;
    }
    const newStatus = over.id as Status;

    if (columns.some((col) => col.id === newStatus)) {
      if (onTaskMove) {
        onTaskMove(taskId, newStatus);
      }
    }

    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          py: 1,
        }}
      >
        {columns.map((column) => (
          <Column
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={tasksByStatus[column.id] || []}
            onTaskEdit={onTaskEdit}
          />
        ))}
      </Box>

      <DragOverlay>
        {activeTask ? (
          <Box sx={{ opacity: 0.8, transform: 'rotate(5deg)' }}>
            <Card task={activeTask} />
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
