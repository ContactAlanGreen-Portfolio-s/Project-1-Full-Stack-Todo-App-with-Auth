// Component test for TodoItem
// Mocks the useTodos hooks to control mutation behaviour without MSW.
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the hooks module so we control all mutations without network calls
jest.mock('@/hooks/use-todos', () => ({
  useCreateTodo: jest.fn(),
  useTodos: jest.fn(),
  useUpdateTodo: jest.fn(),
  useDeleteTodo: jest.fn(),
}));

import { useUpdateTodo, useDeleteTodo } from '@/hooks/use-todos';
import { createTodo } from '../helpers/factories';
import { TodoItem } from '@/components/todos/todo-item';

// QueryClient wrapper for components that use React Query hooks
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

// Reusable no-op mutation state returned by default
const noopMutation = {
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  reset: jest.fn(),
};

describe('TodoItem', () => {
  beforeEach(() => {
    (useUpdateTodo as jest.MockedFunction<typeof useUpdateTodo>).mockReturnValue(noopMutation as any);
    (useDeleteTodo as jest.MockedFunction<typeof useDeleteTodo>).mockReturnValue(noopMutation as any);
  });

  it('renders the todo title', () => {
    const todo = createTodo({ title: 'Write unit tests' });
    renderWithProviders(<TodoItem todo={todo} />);
    expect(screen.getByText('Write unit tests')).toBeInTheDocument();
  });

  it('renders an unchecked checkbox for a PENDING todo', () => {
    const todo = createTodo({ status: 'PENDING' });
    renderWithProviders(<TodoItem todo={todo} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('renders a checked checkbox for a DONE todo', () => {
    const todo = createTodo({ status: 'DONE' });
    renderWithProviders(<TodoItem todo={todo} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('applies line-through style on a completed todo title', () => {
    const todo = createTodo({ status: 'DONE' });
    renderWithProviders(<TodoItem todo={todo} />);
    const title = screen.getByText(todo.title);
    expect(title).toHaveClass('line-through');
  });

  it('shows the priority badge', () => {
    const todo = createTodo({ priority: 'HIGH' });
    renderWithProviders(<TodoItem todo={todo} />);
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('shows formatted due date when provided', () => {
    const todo = createTodo({ dueDate: new Date('2025-12-25') });
    renderWithProviders(<TodoItem todo={todo} />);
    expect(screen.getByText('Dec 25, 2025')).toBeInTheDocument();
  });

  it('calls updateTodo mutate when checkbox is clicked', async () => {
    const mutateFn = jest.fn();
    (useUpdateTodo as jest.MockedFunction<typeof useUpdateTodo>).mockReturnValue({
      ...noopMutation,
      mutate: mutateFn,
    } as any);

    const user = userEvent.setup();
    const todo = createTodo({ status: 'PENDING' });
    renderWithProviders(<TodoItem todo={todo} />);

    await user.click(screen.getByRole('checkbox'));

    expect(mutateFn).toHaveBeenCalledWith(
      expect.objectContaining({ id: todo.id, data: expect.objectContaining({ status: 'DONE' }) })
    );
  });

  it('shows a confirmation before deleting', async () => {
    const user = userEvent.setup();
    // Mock window.confirm to return false (user cancels)
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    const todo = createTodo();
    renderWithProviders(<TodoItem todo={todo} />);

    await user.click(screen.getByRole('button', { name: /delete task/i }));

    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
