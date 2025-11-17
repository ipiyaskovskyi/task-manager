'use client';

import React, { useState } from 'react';
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Stack,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Clear as ClearIcon } from '@mui/icons-material';
import type { Status, Priority } from '@/types';

interface FilterState {
  status: Status | '';
  priority: Priority | '';
  createdFrom: string;
  createdTo: string;
}

interface ToolbarProps {
  onCreateTask: () => void;
  onFilterChange: (filters: FilterState) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onCreateTask,
  onFilterChange,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    priority: '',
    createdFrom: '',
    createdTo: '',
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: FilterState = {
      status: '',
      priority: '',
      createdFrom: '',
      createdTo: '',
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters =
    filters.status ||
    filters.priority ||
    filters.createdFrom ||
    filters.createdTo;

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        flexWrap: 'wrap',
      }}
    >
      <Button
        data-testid="create-task-button"
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreateTask}
        sx={{ minWidth: 140 }}
      >
        Create Task
      </Button>

      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="todo">To Do</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="review">Review</MenuItem>
            <MenuItem value="done">Done</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={filters.priority}
            label="Priority"
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <MenuItem value="">All Priorities</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          type="date"
          label="From"
          value={filters.createdFrom}
          onChange={(e) => handleFilterChange('createdFrom', e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140 }}
        />

        <TextField
          size="small"
          type="date"
          label="To"
          value={filters.createdTo}
          onChange={(e) => handleFilterChange('createdTo', e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140 }}
        />

        {hasActiveFilters && (
          <IconButton
            size="small"
            onClick={clearFilters}
            color="error"
            sx={{ ml: 1 }}
          >
            <ClearIcon />
          </IconButton>
        )}
      </Stack>
    </Paper>
  );
};
