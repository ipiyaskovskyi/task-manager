import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/lib/api/auth', () => ({
  login: jest.fn(),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form', () => {
    render(<LoginForm />);

    expect(
      screen.getByRole('heading', { name: /Sign In/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Sign In/i })
    ).toBeInTheDocument();
  });

  it('should disable submit button when form is empty', () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show email error when email is invalid', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
    });
  });

  it('should show email error when email is empty after blur', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    await user.click(emailInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('should show password error when password is empty after blur', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/Password/i);
    await user.click(passwordInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should not show errors before fields are touched', () => {
    render(<LoginForm />);

    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
  });

  it('should clear email error when email becomes valid', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'invalid');
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
    });

    await user.clear(emailInput);
    await user.type(emailInput, 'test@example.com');

    await waitFor(() => {
      expect(
        screen.queryByText('Please enter a valid email address')
      ).not.toBeInTheDocument();
    });
  });

  it('should show all errors when form is submitted with invalid data', async () => {
    render(<LoginForm />);

    const form = document.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(
      () => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should trim email before validation', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, '  test@example.com  ');
    await user.tab();

    await waitFor(() => {
      expect(
        screen.queryByText('Please enter a valid email address')
      ).not.toBeInTheDocument();
    });
  });
});
