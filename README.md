<div align="center">

# Full-Stack Todo App with Authentication

| | |
|---|---|
| ![Homepage](./docs/todoapp-homepage.png) | ![Dashboard](./docs/todoapp-dashboard.png) |
| *Landing page — clean sign-in entry point* | *Dashboard — task management with priority badges and filters* |


**A production-grade task management application built to demonstrate full-stack engineering skills — from database schema design to OAuth authentication to CI/CD deployment.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-brightgreen?style=for-the-badge&logo=vercel)](https://full-stack-to-do-app-with-auth-contactalangreen.vercel.app)
[![Portfolio](https://img.shields.io/badge/Portfolio-ContactAlanGreen-blue?style=for-the-badge&logo=github)](https://github.com/ContactAlanGreen-Portfolio-s)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Alan%20Green-0077B5?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/contactalangreen/)

</div>

---

## Overview

This is not a tutorial clone. It is a thoughtfully engineered, production-deployed web application that solves a real problem: securely storing and managing personal tasks across sessions. Every architectural decision — from the database adapter to the validation layer to the CI pipeline — was made deliberately and is documented throughout the codebase.

The application is live, authenticated via GitHub OAuth, and backed by a persistent PostgreSQL database. It is deployed continuously via Vercel with a GitHub Actions CI pipeline that enforces a full test suite on every push to `main`.

---

## Features & Technical Complexity

### Core Capabilities

- 🔐 **Secure GitHub OAuth Authentication** — Users sign in via GitHub using NextAuth.js. Sessions are JWT-based, with the session user ID injected server-side into every API call. The client can never spoof another user's identity.
- 🗂️ **Persistent Task Management** — Create, complete, and delete todos. Data is scoped to the authenticated user and stored in a PostgreSQL database via Prisma ORM. Tasks persist across sessions and devices.
- 🏷️ **Priority & Due Date Filtering** — Each todo supports priority levels (HIGH / MEDIUM / LOW) and optional due dates, with colour-coded badges and client-side filter controls.
- ⚡ **Optimistic UI Updates** — React Query powers all data fetching and mutations. The UI responds instantly to user actions without waiting for the server round-trip.
- 🔔 **Toast Notifications** — Server confirmation and error states are surfaced to the user via `sonner` toast notifications, ensuring clear, non-blocking feedback.
- 📱 **Responsive Design** — Built with Tailwind CSS and the shadcn/ui component library. Fully functional across desktop and mobile viewports.

### Architectural Complexity

This application deliberately avoids the "monolithic client" trap common in beginner Next.js projects. It applies a clean separation between:

- **Server Components** (dashboard, layout data fetching) — handled at the Next.js route level with `getServerSession` before any HTML is sent to the client.
- **Client Components** (form inputs, mutations, filter controls) — explicitly marked with `"use client"` and powered by React Query for cache-aware state management.
- **API Layer** — a purpose-built REST API under `/api/todos` with shared middleware (`withErrorHandler`, `requireAuth`, `successResponse`) to eliminate boilerplate and enforce consistent response shapes.
- **Validation** — a single Zod schema in `src/lib/validations.ts` serves as the source of truth for both server-side API validation and client-side React Hook Form validation, ensuring the rules can never drift apart.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | ![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=nextdotjs) App Router (v16) |
| Language | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white) Strict mode |
| UI Components | ![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=flat&logo=shadcnui&logoColor=white) + ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white) |
| Authentication | ![NextAuth.js](https://img.shields.io/badge/NextAuth.js-000000?style=flat&logo=next.js) v5 (GitHub OAuth, JWT strategy) |
| ORM | ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white) with `@prisma/adapter-pg` |
| Database | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white) |
| State Management | ![React Query](https://img.shields.io/badge/React_Query-FF4154?style=flat&logo=reactquery&logoColor=white) (TanStack Query v5) |
| Validation | ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat&logo=zod&logoColor=white) |
| Testing | ![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white) + ![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white) |
| CI/CD | ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=github-actions&logoColor=white) + ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white) |

---

## SDLC, Planning & Architecture

This project followed a structured Software Development Life Cycle (SDLC) — not a "build as you go" approach.

### Process

1. **Requirements & Scoping** — Core features were defined upfront and documented as GitHub Issues before a single line of code was written.
2. **Architecture Design** — The database schema, API contract, and component hierarchy were planned before implementation. Decisions on server vs. client component boundaries were made deliberately.
3. **Iterative Development** — Work was tracked using a **[GitHub Projects Kanban Board](https://github.com/orgs/ContactAlanGreen-Portfolio-s/projects/1)** with columns for Backlog, In Progress, In Review, and Done. Each feature was developed on its own branch and merged via pull request.
4. **Test-Driven Validation** — A dedicated testing guide (`testing_guide_project1.md`) was authored before tests were written, outlining what each phase of testing needed to cover.
5. **CI/CD & Deployment** — A GitHub Actions workflow (`.github/workflows/ci.yml`) enforces the full test suite on every push to `main`, with automatic deployment to Vercel on success.

### Planning Artefacts

> - 🗄️ **Database Schema (ERD):**
> ![Database Schema](./docs/database-schema.png)
> - 📋 **GitHub Projects Board:** [View Kanban Board](https://github.com/orgs/ContactAlanGreen-Portfolio-s/projects/1)
> - 🧪 **Testing Guide:** [`testing_guide_project1.md`](./testing_guide_project1.md)

---

## AI Integration — The Antigravity Workflow

AI was used throughout this project as a **force multiplier**, not a code generator. Every AI-assisted output was reviewed, validated, and intentionally integrated. The workflow centred on Google Antigravity AI as a pair-programming and developer-advocacy tool.

### Planning Phase
- Brainstormed the application architecture, feature scope, and database schema design in dialogue with the AI.
- Generated the structured project planning `.md` file and the `testing_guide_project1.md`, outlining each phase of development and validation before work began.
- Used AI to evaluate trade-offs (e.g. JWT vs. database sessions, Prisma vs. raw SQL, MSW vs. direct mock strategies for testing).

### Coding Phase
- AI acted as a **pair programmer** for debugging complex TypeScript generics (Zod input/output type mismatches with React Hook Form), Vercel build failures, and Next.js App Router prerendering constraints.
- Used AI to generate boilerplate (shadcn/ui form scaffolding, API route structure) and then extended it with domain-specific logic.
- All generated code was reviewed line-by-line and refactored to match project conventions.

### Testing Phase
- AI generated the full unit, integration, and component test suites based on the pre-agreed testing guide, ensuring test coverage mapped precisely to the application's acceptance criteria.
- Used AI to plan and execute test phases — identifying mock strategy (direct hook mocking over MSW for component tests to avoid ESM/jsdom incompatibilities), resolving `jest-dom` TypeScript type conflicts, and stabilising the test runner configuration.
- Final test suite: **61 tests across 7 suites — 100% pass rate**.

---

## Testing Strategy

The project uses a layered testing approach with dedicated directories for each test type:

```
src/__tests__/
├── unit/              # Pure function and schema validation tests
├── integration/       # API route handler tests (with Prisma and auth mocked)
└── components/        # React component render and interaction tests
```

End-to-end tests are located in `e2e/` and run via Playwright.

### Running the Test Suite

```bash
# Run all unit, integration, and component tests
npm run test

# Run with coverage report
npm run test:coverage

# Run a specific suite
npm run test:unit
npm run test:integration
npm run test:components

# Run end-to-end (Playwright) tests
npm run test:e2e

# Run everything (Jest + Playwright)
npm run test:all
```

The GitHub Actions CI pipeline (`.github/workflows/ci.yml`) runs `npm run test` automatically on every push to `main`.

---

## Local Setup & Installation

### Prerequisites

- Node.js v18+
- A PostgreSQL database (local or hosted, e.g. [Neon](https://neon.tech))
- A GitHub OAuth App ([create one here](https://github.com/settings/developers))

### 1. Clone the Repository

```bash
git clone https://github.com/ContactAlanGreen-Portfolio-s/Project-1-Full-Stack-Todo-App-with-Auth.git
cd Project-1-Full-Stack-Todo-App-with-Auth
```

### 2. Install Dependencies

```bash
npm install
```

> **Note:** The `postinstall` script automatically runs `prisma generate` after install.

### 3. Configure Environment Variables

Create a `.env.local` file in the root of the project:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

# NextAuth — generate a secret with: openssl rand -base64 32
NEXTAUTH_SECRET="your-random-secret-here"

# The URL of your local dev server
NEXTAUTH_URL="http://localhost:3000"

# GitHub OAuth App credentials
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

**To create a GitHub OAuth App:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers) → *OAuth Apps* → *New OAuth App*
2. Set **Homepage URL** to `http://localhost:3000`
3. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`

### 4. Set Up the Database

```bash
# Push the Prisma schema to your database
npx prisma db push

# (Optional) Open Prisma Studio to inspect your data
npx prisma studio
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/signin/        # Sign-in page (GitHub OAuth)
│   ├── (dashboard)/          # Protected dashboard route
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth handler
│   │   └── todos/            # REST API: GET, POST, PATCH, DELETE
│   └── layout.tsx            # Root layout with providers
├── components/
│   ├── todos/                # TodoList, TodoItem, TodoForm
│   └── ui/                   # shadcn/ui components
├── hooks/
│   └── use-todos.ts          # React Query hooks (useTodos, useCreateTodo, etc.)
├── lib/
│   ├── api-helpers.ts        # Shared middleware (withErrorHandler, requireAuth)
│   ├── auth.ts               # NextAuth configuration
│   ├── db.ts                 # Prisma client singleton
│   ├── query-client.ts       # React Query client factory
│   ├── utils.ts              # cn() class utility
│   └── validations.ts        # Zod schemas (single source of truth)
└── types/
    └── index.ts              # Global TypeScript types
```

---

## About the Author

I'm **Alan Green**, a full-stack developer focused on building production-quality web applications with modern JavaScript tooling. This project is part of my developer portfolio, designed to demonstrate real-world engineering capabilities — not just syntax familiarity.

I'm particularly interested in roles where engineering quality, clean architecture, and developer experience are treated as first-class concerns.

- 🔗 **LinkedIn:** [linkedin.com/in/contactalangreen](https://www.linkedin.com/in/contactalangreen/)
- 💻 **GitHub:** [github.com/contactalangreen](https://github.com/contactalangreen)
- 🗂️ **Portfolio Org:** [github.com/ContactAlanGreen-Portfolio-s](https://github.com/ContactAlanGreen-Portfolio-s)

---

<div align="center">

*Built with care, tested with rigour, deployed with confidence.*

</div>
