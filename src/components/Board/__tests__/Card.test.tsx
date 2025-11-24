import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '../Card';
import type { Task } from '@/types';

jest.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  }),
}));

describe('Card', () => {
  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'high',
    type: 'Task',
    deadline: null,
    assigneeId: null,
    assignee: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should render task title', () => {
    render(<Card task={mockTask} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('should render task description when provided', () => {
    render(<Card task={mockTask} />);
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    const taskWithoutDescription = { ...mockTask, description: null };
    render(<Card task={taskWithoutDescription} />);
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
  });

  it('should render priority chip', () => {
    render(<Card task={mockTask} />);
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('should render type chip', () => {
    render(<Card task={mockTask} />);
    expect(screen.getByText('Task')).toBeInTheDocument();
  });

  it('should render deadline when provided', () => {
    const taskWithDeadline = {
      ...mockTask,
      deadline: new Date('2024-12-31'),
    };
    render(<Card task={taskWithDeadline} />);
    expect(screen.getByText(/Dec 31, 2024/)).toBeInTheDocument();
  });

  it('should not render deadline when not provided', () => {
    render(<Card task={mockTask} />);
    expect(screen.queryByText(/Dec 31, 2024/)).not.toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<Card task={mockTask} onEdit={onEdit} />);

    const editButton = screen.getByRole('button');
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockTask);
  });

  it('should not render edit button when onEdit is not provided', () => {
    render(<Card task={mockTask} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should render different priority colors', () => {
    const lowPriorityTask = { ...mockTask, priority: 'low' as const };
    const { rerender } = render(<Card task={lowPriorityTask} />);
    expect(screen.getByText('LOW')).toBeInTheDocument();

    const mediumPriorityTask = { ...mockTask, priority: 'medium' as const };
    rerender(<Card task={mediumPriorityTask} />);
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });
});
