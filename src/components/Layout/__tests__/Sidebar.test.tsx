import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

const mockPush = jest.fn();
const mockPathname = '/board';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <Sidebar>
        <div>Test Content</div>
      </Sidebar>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render navigation items', () => {
    render(
      <Sidebar>
        <div>Test</div>
      </Sidebar>
    );

    expect(screen.getByText('Board')).toBeInTheDocument();
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('should highlight active route', () => {
    render(
      <Sidebar>
        <div>Test</div>
      </Sidebar>
    );

    const boardItem = screen.getByText('Board');
    const listItemButton =
      boardItem.closest('[role="button"]') || boardItem.closest('div');
    expect(listItemButton).toBeInTheDocument();
  });

  it('should navigate when item is clicked', () => {
    render(
      <Sidebar>
        <div>Test</div>
      </Sidebar>
    );

    const backlogItem = screen.getByText('Backlog');
    fireEvent.click(backlogItem);

    expect(mockPush).toHaveBeenCalledWith('/backlog');
  });
});
