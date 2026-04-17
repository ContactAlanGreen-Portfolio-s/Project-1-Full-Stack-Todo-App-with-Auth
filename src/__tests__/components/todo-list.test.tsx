// Component test for TodoList
// Mocks the useTodos hook so tests control what data is rendered,
// without needing MSW or a real network connection.
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the hooks module
jest.mock('@/hooks/use-todos', () => ({
  useCreateTodo: jest.fn(),
  useTodos: jest.fn(),
  useUpdateTodo: jest.fn(),
  useDeleteTodo: jest.fn(),
}));

import { useTodos, useUpdateTodo, useDeleteTodo } from '@/hooks/use-todos';
import { createTodo, createTodos } from '../helpers/factories';
import { TodoList } from '@/components/todos/todo-list';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

// Default no-op mutation hook return value
const noopMutation = {
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  reset: jest.fn(),
};

// Helper: set up useTodos to simulate a given query state
function mockTodosQuery(state: Partial<ReturnType<typeof useTodos>>) {
  (useTodos as jest.MockedFunction<typeof useTodos>).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    ...state,
  } as any);
}

describe('TodoList', () => {
  beforeEach(() => {
    (useUpdateTodo as jest.MockedFunction<typeof useUpdateTodo>).mockReturnValue(noopMutation as any);
    (useDeleteTodo as jest.MockedFunction<typeof useDeleteTodo>).mockReturnValue(noopMutation as any);
  });

  it('shows skeleton loaders while fetching', () => {
    mockTodosQuery({ isLoading: true });

    renderWithProviders(<TodoList />);

    // Skeleton elements have the animate-pulse class while loading
    expect(document.querySelector('[class*="animate-pulse"]')).toBeInTheDocument();
  });

  it('shows todos once loaded', async () => {
    const todos = createTodos(3);
    mockTodosQuery({ data: { data: todos, count: todos.length } as any });

    renderWithProviders(<TodoList />);

    // Todos render immediately since useTodos is mocked with data already
    const allTitles = screen.getAllByText(todos[0].title);
    expect(allTitles).toHaveLength(3);
  });

  it('shows empty state when there are no todos', async () => {
    mockTodosQuery({ data: { data: [], count: 0 } as any });

    renderWithProviders(<TodoList />);

    expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('shows error banner when the query fails', () => {
    mockTodosQuery({ isError: true, error: new Error('Server error') });

    renderWithProviders(<TodoList />);

    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });

  it('filters to show only pending todos when Pending tab is clicked', async () => {
    const pendingTodo = createTodo({ title: 'Pending task', status: 'PENDING' });
    const doneTodo = createTodo({ title: 'Done task', status: 'DONE' });
    mockTodosQuery({ data: { data: [pendingTodo, doneTodo], count: 2 } as any });

    const user = userEvent.setup();
    renderWithProviders(<TodoList />);

    // Wait for todos to appear
    await screen.findByText('Pending task');

    // Click the Pending filter tab
    await user.click(screen.getByRole('button', { name: /pending/i }));

    expect(screen.getByText('Pending task')).toBeInTheDocument();
    expect(screen.queryByText('Done task')).not.toBeInTheDocument();
  });

  it('shows correct count in the All tab', async () => {
    const todos = createTodos(5);
    mockTodosQuery({ data: { data: todos, count: 5 } as any });

    renderWithProviders(<TodoList />);

    expect(await screen.findByText(/all \(5\)/i)).toBeInTheDocument();
  });
});
