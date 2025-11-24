import { render, screen } from '@testing-library/react';
import { Column } from '../Column';
import type { Task } from '@/types';

jest.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    isOver: false,
  }),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  }),
}));

describe('Column', () => {
  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Task 1',
      description: 'Description 1',
      status: 'todo',
      priority: 'high',
      type: 'Task',
      deadline: null,
      assigneeId: null,
      assignee: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      title: 'Task 2',
      description: 'Description 2',
      status: 'todo',
      priority: 'medium',
      type: 'Task',
      deadline: null,
      assigneeId: null,
      assignee: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('should render column title', () => {
    render(<Column id="todo" title="To Do" tasks={[]} />);
    expect(screen.getByText(/TO DO/i)).toBeInTheDocument();
  });

  it('should render task count', () => {
    render(<Column id="todo" title="To Do" tasks={mockTasks} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render all tasks in column', () => {
    render(<Column id="todo" title="To Do" tasks={mockTasks} />);
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('should render empty column when no tasks', () => {
    render(<Column id="todo" title="To Do" tasks={[]} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should use custom color when provided', () => {
    const { container } = render(
      <Column id="todo" title="To Do" tasks={[]} color="#ff0000" />
    );
    expect(container).toBeInTheDocument();
  });

  it('should render tasks with onTaskEdit handler', () => {
    const onTaskEdit = jest.fn();
    render(
      <Column
        id="todo"
        title="To Do"
        tasks={mockTasks}
        onTaskEdit={onTaskEdit}
      />
    );

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });
});
