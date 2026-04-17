// Component test for TodoForm
// Uses jest.mock to intercept the useTodos hook rather than MSW server,
// which avoids the ESM/jsdom incompatibility with MSW's rettime dependency.
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the entire hooks module so we control mutation behaviour
jest.mock('@/hooks/use-todos', () => ({
  useCreateTodo: jest.fn(),
  useTodos: jest.fn(),
  useUpdateTodo: jest.fn(),
  useDeleteTodo: jest.fn(),
}));

import { useCreateTodo } from '@/hooks/use-todos';
import { TodoForm } from '@/components/todos/todo-form';

// Wrapper provides the QueryClient context all hooks need
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

// Default mock: mutation is idle (not loading, not error)
const mockMutateFn = jest.fn();
const defaultMutationState = {
  mutate: mockMutateFn,
  mutateAsync: jest.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  reset: jest.fn(),
};

describe('TodoForm', () => {
  beforeEach(() => {
    (useCreateTodo as jest.MockedFunction<typeof useCreateTodo>).mockReturnValue(
      defaultMutationState as any
    );
  });

  it('renders the title input and submit button', () => {
    renderWithProviders(<TodoForm />);

    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
  });

  it('shows a validation error when submitting with empty title', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoForm />);

    await user.click(screen.getByRole('button', { name: /add task/i }));

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
  });

  it('does not call mutate when the form has validation errors', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoForm />);

    await user.click(screen.getByRole('button', { name: /add task/i }));

    expect(mockMutateFn).not.toHaveBeenCalled();
  });

  it('shows loading state while the mutation is pending', () => {
    (useCreateTodo as jest.MockedFunction<typeof useCreateTodo>).mockReturnValue({
      ...defaultMutationState,
      isPending: true,
    } as any);

    renderWithProviders(<TodoForm />);

    expect(screen.getByRole('button', { name: /adding/i })).toBeDisabled();
  });

  it('calls mutate with the correct data when the form is submitted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoForm />);

    await user.type(screen.getByPlaceholderText('What needs to be done?'), 'Buy milk');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    expect(mockMutateFn).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Buy milk' }),
      expect.anything()
    );
  });
});
