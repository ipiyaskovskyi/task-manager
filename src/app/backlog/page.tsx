'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { fetchTasks, deleteTask, type TaskFilters } from '@/lib/api/tasks';
import type { Task, Status, Priority } from '@/types';
import { useRouter } from 'next/navigation';

type SortField =
  | 'id'
  | 'title'
  | 'status'
  | 'priority'
  | 'type'
  | 'assignee'
  | 'deadline'
  | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface PaginatedResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const STATUS_COLORS: Record<
  Status,
  'default' | 'primary' | 'warning' | 'success'
> = {
  todo: 'default',
  in_progress: 'primary',
  review: 'warning',
  done: 'success',
};

const PRIORITY_COLORS: Record<
  Priority,
  'default' | 'info' | 'warning' | 'error'
> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
};

export default function BacklogPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters] = useState<TaskFilters>({});
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadTasks = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const apiFilters: TaskFilters = {
        ...filters,
        page,
        limit: 20,
      };

      const response = await fetchTasks(apiFilters);

      if (Array.isArray(response)) {
        setTasks(response);
        setPagination({
          page: 1,
          limit: response.length,
          total: response.length,
          totalPages: 1,
        });
      } else if (
        response &&
        typeof response === 'object' &&
        'tasks' in response &&
        'pagination' in response
      ) {
        const paginatedResponse = response as unknown as PaginatedResponse;
        setTasks(paginatedResponse.tasks);
        setPagination(paginatedResponse.pagination);
      } else {
        setTasks([]);
        setPagination({
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
        });
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handlePageChange = (_event: unknown, newPage: number) => {
    loadTasks(newPage);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await deleteTask(id);
      await loadTasks(pagination.page);
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleEdit = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let aValue: string | number | Date | undefined;
    let bValue: string | number | Date | undefined;

    switch (sortField) {
      case 'id':
        aValue = a.id;
        bValue = b.id;
        break;
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'priority':
        const priorityOrder: Record<Priority, number> = {
          low: 1,
          medium: 2,
          high: 3,
          urgent: 4,
        };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      case 'type':
        aValue = a.type || '';
        bValue = b.type || '';
        break;
      case 'assignee':
        aValue = a.assignee
          ? `${a.assignee.firstname} ${a.assignee.lastname}`.toLowerCase()
          : '';
        bValue = b.assignee
          ? `${b.assignee.firstname} ${b.assignee.lastname}`.toLowerCase()
          : '';
        break;
      case 'deadline':
        aValue = a.deadline ? new Date(a.deadline).getTime() : 0;
        bValue = b.deadline ? new Date(b.deadline).getTime() : 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => {
    const isActive = sortField === field;
    return (
      <TableCell
        sx={{
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { backgroundColor: 'action.hover' },
        }}
        onClick={() => handleSort(field)}
      >
        <Box display="flex" alignItems="center" gap={1}>
          {children}
          {isActive && (
            <Typography variant="caption" color="primary">
              {sortDirection === 'asc' ? '↑' : '↓'}
            </Typography>
          )}
        </Box>
      </TableCell>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <Sidebar>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Backlog
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <SortableHeader field="id">ID</SortableHeader>
                      <SortableHeader field="title">Title</SortableHeader>
                      <SortableHeader field="status">Status</SortableHeader>
                      <SortableHeader field="priority">Priority</SortableHeader>
                      <SortableHeader field="type">Type</SortableHeader>
                      <SortableHeader field="assignee">Assignee</SortableHeader>
                      <SortableHeader field="deadline">Deadline</SortableHeader>
                      <SortableHeader field="createdAt">Created</SortableHeader>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            py={2}
                          >
                            No tasks found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedTasks.map((task) => (
                        <TableRow key={task.id} hover>
                          <TableCell>{task.id}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {task.title}
                            </Typography>
                            {task.description && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                sx={{
                                  maxWidth: 300,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {task.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={task.status}
                              color={STATUS_COLORS[task.status]}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={task.priority}
                              color={PRIORITY_COLORS[task.priority]}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{task.type || '-'}</TableCell>
                          <TableCell>
                            {task.assignee
                              ? `${task.assignee.firstname} ${task.assignee.lastname}`
                              : '-'}
                          </TableCell>
                          <TableCell>{formatDate(task.deadline)}</TableCell>
                          <TableCell>{formatDate(task.createdAt)}</TableCell>
                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="flex-end"
                            >
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(task)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(task.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {pagination.totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    count={pagination.totalPages}
                    page={pagination.page}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}

              {pagination.total > 0 && (
                <Box mt={2}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{' '}
                    of {pagination.total} tasks
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Container>
      </Sidebar>
    </Box>
  );
}
