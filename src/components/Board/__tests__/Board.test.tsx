import { render, screen } from '@testing-library/react';
import { Board } from '../Board';
import type { Task } from '@/types';

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  DragOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
  PointerSensor: jest.fn(),
  closestCorners: jest.fn(),
}));

jest.mock('../Column', () => ({
  Column: ({ title, tasks }: { title: string; tasks: Task[] }) => (
    <div data-testid={`column-${title}`}>
      <div>{title}</div>
      <div>{tasks.length} tasks</div>
    </div>
  ),
}));

describe('Board', () => {
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
      status: 'in_progress',
      priority: 'medium',
      type: 'Task',
      deadline: null,
      assigneeId: null,
      assignee: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('should render all columns', () => {
    render(<Board tasks={mockTasks} />);

    expect(screen.getByTestId('column-To Do')).toBeInTheDocument();
    expect(screen.getByTestId('column-In Progress')).toBeInTheDocument();
    expect(screen.getByTestId('column-Review')).toBeInTheDocument();
    expect(screen.getByTestId('column-Done')).toBeInTheDocument();
  });

  it('should group tasks by status', () => {
    render(<Board tasks={mockTasks} />);

    const todoColumn = screen.getByTestId('column-To Do');
    expect(todoColumn).toHaveTextContent('1 tasks');

    const inProgressColumn = screen.getByTestId('column-In Progress');
    expect(inProgressColumn).toHaveTextContent('1 tasks');
  });

  it('should call onTaskMove when task is moved', () => {
    const onTaskMove = jest.fn();
    render(<Board tasks={mockTasks} onTaskMove={onTaskMove} />);

    expect(onTaskMove).not.toHaveBeenCalled();
  });

  it('should call onTaskEdit when task is edited', () => {
    const onTaskEdit = jest.fn();
    render(<Board tasks={mockTasks} onTaskEdit={onTaskEdit} />);

    expect(onTaskEdit).not.toHaveBeenCalled();
  });

  it('should render empty columns when no tasks', () => {
    render(<Board tasks={[]} />);

    expect(screen.getByTestId('column-To Do')).toHaveTextContent('0 tasks');
    expect(screen.getByTestId('column-In Progress')).toHaveTextContent(
      '0 tasks'
    );
  });
});
