import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly addButton: Locator;
  readonly todoList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.getByPlaceholder('What needs to be done?');
    this.addButton = page.getByRole('button', { name: /add task/i });
    this.todoList = page.getByRole('list');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async createTodo(title: string, priority?: string) {
    await this.titleInput.fill(title);
    if (priority) {
      await this.page.getByRole('combobox', { name: /priority/i }).selectOption(priority);
    }
    await this.addButton.click();
  }

  async completeTodo(title: string) {
    const item = this.page.getByText(title).locator('..');
    await item.getByRole('checkbox').click();
  }

  async deleteTodo(title: string) {
    const item = this.page.getByText(title).locator('..');
    this.page.on('dialog', dialog => dialog.accept());
    await item.getByRole('button', { name: /delete/i }).click();
  }

  async expectTodoVisible(title: string) {
    await expect(this.page.getByText(title)).toBeVisible();
  }

  async expectTodoNotVisible(title: string) {
    await expect(this.page.getByText(title)).not.toBeVisible();
  }

  async filterByStatus(status: 'All' | 'Pending' | 'Done') {
    await this.page.getByRole('button', { name: new RegExp(status, 'i') }).click();
  }
}
