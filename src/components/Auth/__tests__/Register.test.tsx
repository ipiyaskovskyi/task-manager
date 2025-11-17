import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../RegisterForm';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/lib/api/auth', () => ({
  register: jest.fn(),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render register form', () => {
    render(<RegisterForm />);

    expect(
      screen.getByRole('heading', { name: /Sign Up/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Firstname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lastname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Password/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Sign Up/i })
    ).toBeInTheDocument();
  });

  it('should disable submit button when form is empty', () => {
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show firstname error when firstname is empty after blur', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const firstnameInput = screen.getByLabelText(/Firstname/i);
    await user.click(firstnameInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Firstname is required')).toBeInTheDocument();
    });
  });

  it('should show firstname error when firstname is too short', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const firstnameInput = screen.getByLabelText(/Firstname/i);
    await user.type(firstnameInput, 'A');
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText('Firstname must be at least 2 characters')
      ).toBeInTheDocument();
    });
  });

  it('should show lastname error when lastname is empty after blur', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const lastnameInput = screen.getByLabelText(/Lastname/i);
    await user.click(lastnameInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Lastname is required')).toBeInTheDocument();
    });
  });

  it('should show email error when email is invalid', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
    });
  });

  it('should show password error when password is too short', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInputs = screen.getAllByLabelText(/Password/i);
    const passwordInput = passwordInputs[0];
    await user.type(passwordInput, '12345');
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 6 characters')
      ).toBeInTheDocument();
    });
  });

  it('should show confirm password error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInputs = screen.getAllByLabelText(/Password/i);
    const passwordInput = passwordInputs[0];
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password456');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should clear confirm password error when passwords match', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInputs = screen.getAllByLabelText(/Password/i);
    const passwordInput = passwordInputs[0];
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password456');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    await user.clear(confirmPasswordInput);
    await user.type(confirmPasswordInput, 'password123');

    await waitFor(() => {
      expect(
        screen.queryByText('Passwords do not match')
      ).not.toBeInTheDocument();
    });
  });

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/Firstname/i), 'John');
    await user.type(screen.getByLabelText(/Lastname/i), 'Doe');
    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    const passwordInputs = screen.getAllByLabelText(/Password/i);
    await user.type(passwordInputs[0], 'password123');
    await user.type(screen.getByLabelText(/Confirm Password/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should not show errors before fields are touched', () => {
    render(<RegisterForm />);

    expect(screen.queryByText('Firstname is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Lastname is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
  });

  it('should show all errors when form is submitted with invalid data', async () => {
    render(<RegisterForm />);

    const form = document.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(
      () => {
        expect(screen.getByText('Firstname is required')).toBeInTheDocument();
        expect(screen.getByText('Lastname is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
        expect(
          screen.getByText('Please confirm your password')
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should update confirm password validation when password changes', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInputs = screen.getAllByLabelText(/Password/i);
    const passwordInput = passwordInputs[0];
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.tab();

    await user.clear(passwordInput);
    await user.type(passwordInput, 'newpassword456');

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should trim names before validation', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const firstnameInput = screen.getByLabelText(/Firstname/i);
    await user.type(firstnameInput, '  John  ');
    await user.tab();

    await waitFor(() => {
      expect(
        screen.queryByText('Firstname must be at least 2 characters')
      ).not.toBeInTheDocument();
    });
  });
});
