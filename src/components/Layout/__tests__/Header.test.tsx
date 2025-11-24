import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';
import { removeToken } from '@/lib/auth/token-storage';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/lib/auth/token-storage', () => ({
  removeToken: jest.fn(),
}));

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render header title', () => {
    render(<Header />);
    expect(screen.getByText('Task Management')).toBeInTheDocument();
  });

  it('should render logout button', () => {
    render(<Header />);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should call removeToken and navigate on logout', () => {
    render(<Header />);

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(removeToken).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
