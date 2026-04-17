# GitHub Project Setup Guide
## Project 1: Full Stack Todo App with Auth

> **Goal:** Everything lives on GitHub. No Notion. No separate notes.
> This file tells you how to set up the board, create every issue,
> manage branches, write commits, and do pull requests — professionally.

---

## Table of Contents

1. [Part 1 — Configure the Project Board](#part-1--configure-the-project-board)
2. [Part 2 — Add the Iteration (Sprint) Field](#part-2--add-the-iteration-sprint-field)
3. [Part 3 — Add Custom Fields](#part-3--add-custom-fields)
4. [Part 4 — Create All Issues (Full Project)](#part-4--create-all-issues-full-project)
5. [Part 5 — Assign Issues to Sprints & Board](#part-5--assign-issues-to-sprints--board)
6. [Part 6 — Git Workflow: Branches, Commits & PRs](#part-6--git-workflow-branches-commits--prs)
7. [Part 7 — Your Sprint 2 Starting Point](#part-7--your-sprint-2-starting-point)
8. [Part 8 — PR Template Setup](#part-8--pr-template-setup)

---

# Part 1 — Configure the Project Board

Your board is already created and linked to the repo. Now we configure it properly.

## 1.1 Rename the Statuses to Match Dev Workflow

Your current columns: `To do` / `In Progress` / `In Review` / `Done`  
These are correct. Leave them as-is — they map to a real team workflow:

```
To do        → Issue exists, not started yet
In Progress  → You have the branch open and are coding
In Review    → PR is open, you're self-reviewing the diff
Done         → PR merged to main ✓
```

## 1.2 Switch to Board View (if not already)

```
1. In your Project, click the "View 1" dropdown (top left)
2. Click the layout icon → select "Board"
3. Group by: Status
4. Click "Save" to persist this view

Optional: Create a second view for sprint planning
1. Click "+ New view"
2. Name it "Sprint View"
3. Layout: Table
4. Group by: Iteration (you'll add this field next)
```

---

# Part 2 — Add the Iteration (Sprint) Field

GitHub Projects has a built-in Iteration field — this is how you create Sprints.

## 2.1 Add the Field

```
1. In your Project board, click the "+" button on the far right of the field headers
   (In Table view this is easier — switch to table view temporarily)

2. Click "+ New field"

3. Field type: Iteration

4. Field name: Sprint

5. Configure iterations:
   Click "Add iteration" for each sprint:

   Sprint 0 — Setup & Design
   Duration: 1 week
   Start date: [your actual start date]

   Sprint 1 — Infrastructure & Auth
   Duration: 1 week
   Start date: [week 2]

   Sprint 2 — Core CRUD & Frontend
   Duration: 1 week
   Start date: [week 3]  ← YOU ARE HERE

   Sprint 3 — Polish & Deployment
   Duration: 1 week
   Start date: [week 4]

6. Click "Save"
```

> **Note:** The duration is flexible. If you take 2 weeks on Sprint 2, that's fine.
> The iteration is a label, not a hard deadline. What matters is the habit of sprints.

---

# Part 3 — Add Custom Fields

Add these fields to make your board more useful:

```
1. Click "+ New field" again

   Field: Priority
   Type: Single select
   Options:
     🔴 High
     🟡 Medium
     🟢 Low

2. Add another field:
   Field: Effort
   Type: Single select
   Options:
     XS (30 min)
     S  (1-2 hrs)
     M  (half day)
     L  (full day)
     XL (2+ days)

3. The "Assignee" and "Labels" fields are already linked from your repo.
```

---

# Part 4 — Create All Issues (Full Project)

## How to Create an Issue

```
Method 1 (from board):
  Click the "+" in the "To do" column → "Create new item"
  Type the title → press Enter → click the item → fill in description

Method 2 (recommended — more control):
  Go to your REPOSITORY (not the project)
  Click Issues tab → New Issue
  Fill in title, description, labels, assignee
  Then it auto-appears in your project (because it's linked)
```

## Labels to Create First

```
Before making issues, create these labels:
Repository → Issues → Labels → New Label

  setup       #6366f1  purple   → environment, config, accounts
  design      #8b5cf6  violet   → schema, API contracts, planning
  auth        #ec4899  pink     → authentication, sessions
  backend     #f97316  orange   → API routes, DB queries
  frontend    #06b6d4  cyan     → UI components, pages
  devops      #84cc16  green    → CI, deployment, GitHub Actions
  polish      #f59e0b  amber    → UX, empty states, toasts, loading
  bug         #ef4444  red      → something broken
  chore       #6b7280  grey     → maintenance, deps, refactor
```

---

## SPRINT 0 — Setup & Design Issues

---

### Issue #S0-1

```
TITLE:
[Setup] Install and configure local development environment

LABELS: setup

DESCRIPTION:
## Goal
Get the local development environment ready before writing any project code.

## Tasks
- [ ] Install nvm and Node.js v20 LTS
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  nvm install 20 && nvm use 20
  node --version  # v20.x.x
  ```
- [ ] Verify Git is installed: `git --version`
- [ ] Install VS Code extensions:
  - ESLint (Microsoft)
  - Prettier - Code formatter
  - Tailwind CSS IntelliSense
  - Prisma (Prisma.io)
  - TypeScript Error Translator (mattpocock)
  - GitLens
- [ ] Create accounts: GitHub ✓, Supabase, Vercel
- [ ] Create .vscode/settings.json with Prettier + ESLint config

## Acceptance Criteria
- `node --version` prints v20.x.x
- `npm --version` prints 10.x.x
- Vercel and Supabase accounts exist and are accessible

## Sprint
Sprint 0
```

---

### Issue #S0-2

```
TITLE:
[Design] Define database schema for users and todos

LABELS: design

DESCRIPTION:
## Goal
Design the full database schema before any code is written.
This is a planning issue — the output is a decision, not code.

## Schema to Define

### users table
| Field      | Type      | Constraints          |
|------------|-----------|----------------------|
| id         | TEXT CUID | PRIMARY KEY          |
| email      | TEXT      | UNIQUE NOT NULL      |
| name       | TEXT      | NULLABLE             |
| image      | TEXT      | NULLABLE             |
| created_at | TIMESTAMP | DEFAULT NOW()        |

### todos table
| Field       | Type      | Constraints               |
|-------------|-----------|---------------------------|
| id          | TEXT CUID | PRIMARY KEY               |
| user_id     | TEXT      | FK → users.id CASCADE DEL |
| title       | VARCHAR   | NOT NULL, MAX 200         |
| description | VARCHAR   | NULLABLE, MAX 500         |
| status      | ENUM      | PENDING / DONE            |
| priority    | ENUM      | LOW / MEDIUM / HIGH       |
| due_date    | TIMESTAMP | NULLABLE                  |
| created_at  | TIMESTAMP | DEFAULT NOW()             |
| updated_at  | TIMESTAMP | AUTO-UPDATE               |

### NextAuth tables (auto-managed by Prisma adapter)
- accounts, sessions, verification_tokens

## Indexes to plan
- `todos(user_id)` — fast user lookup
- `todos(user_id, status)` — fast filtered lookup
- `todos(user_id, created_at DESC)` — fast sorted lookup

## Tasks
- [ ] Review schema and understand every field and why it exists
- [ ] Understand why CUID instead of integer IDs
- [ ] Note which tables NextAuth manages automatically

## Acceptance Criteria
- Schema decisions are understood and documented
- Ready to implement in Prisma in Sprint 1

## Sprint
Sprint 0
```

---

### Issue #S0-3

```
TITLE:
[Design] Define REST API contract for /api/todos

LABELS: design

DESCRIPTION:
## Goal
Agree on the exact API shape before building the backend.
Frontend and backend will implement against this contract.

## Endpoints

### GET /api/todos
- Auth: Required
- Response 200: `{ data: Todo[], count: number }`
- Response 401: `{ error: "Unauthorised" }` if not logged in

### POST /api/todos
- Auth: Required
- Body: `{ title: string, description?: string, priority?: enum, dueDate?: string }`
- Response 201: `{ data: Todo }`
- Response 400: `{ error: validation errors }`
- Response 401: if not logged in

### PATCH /api/todos/:id
- Auth: Required + must OWN the todo
- Body: any subset of above + `status?: "PENDING" | "DONE"`
- Response 200: `{ data: Todo }`
- Response 404: if not found OR belongs to another user (security: no 403)

### DELETE /api/todos/:id
- Auth: Required + must OWN the todo
- Response 204: No Content
- Response 404: not found or wrong owner

## Security Rule to Embed
Every query: `WHERE user_id = session.user.id`
This is OWASP API Top 1: Broken Object Level Authorisation

## Tasks
- [ ] Read the API contract and understand each status code
- [ ] Understand why 404 (not 403) is returned for other users' todos

## Acceptance Criteria
- API shape is understood and agreed before backend Sprint 1

## Sprint
Sprint 0
```

---

## SPRINT 1 — Infrastructure & Auth Issues

---

### Issue #1

```
TITLE:
[Setup] Initialise Next.js project with TypeScript, Tailwind and shadcn/ui

LABELS: setup

DESCRIPTION:
## Goal
Bootstrap the project with the correct configuration.

## Commands
```bash
npx create-next-app@latest todo-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd todo-app

# Install core dependencies
npm install \
  @prisma/client @auth/prisma-adapter next-auth \
  @tanstack/react-query react-hook-form @hookform/resolvers \
  zod bcryptjs date-fns clsx tailwind-merge

npm install --save-dev prisma @types/bcryptjs prettier prettier-plugin-tailwindcss

# shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card input label textarea badge \
  dialog dropdown-menu form separator skeleton toast tooltip select checkbox avatar
```

## Files to create/configure
- [ ] `.prettierrc`
- [ ] `.vscode/settings.json`
- [ ] Update `package.json` scripts (add `type-check`, `format`)
- [ ] Create `.env.local` and `.env.example`
- [ ] Update `.gitignore` to confirm `.env.local` is excluded

## Acceptance Criteria
- `npm run dev` starts without errors at localhost:3000
- `npm run type-check` exits 0
- `npm run lint` exits 0
- shadcn components exist in `src/components/ui/`

## Branch
`feature/#1-project-init`

## Sprint
Sprint 1
```

---

### Issue #2

```
TITLE:
[Setup] Create and connect Supabase PostgreSQL database

LABELS: setup, backend

DESCRIPTION:
## Goal
Provision the free PostgreSQL database on Supabase.

## Steps
1. supabase.com → New Project
   - Name: `todo-app`
   - Region: eu-west-1 (or closest)
   - Generate a strong database password → **save it**

2. Wait ~2 minutes for provisioning

3. Get connection strings:
   Settings → Database → Connection string → URI
   Copy `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`

4. Add to `.env.local`:
   ```
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"
   ```
   (Both URLs are identical for Supabase — DIRECT_URL bypasses the connection pooler for migrations)

## Acceptance Criteria
- Supabase project is created and not paused
- `.env.local` has DATABASE_URL and DIRECT_URL set
- Connection string verified (will be fully tested in Issue #3)

## Branch
Add to `feature/#1-project-init` (same branch — still setup)
Or: `feature/#2-supabase-setup`

## Sprint
Sprint 1
```

---

### Issue #3

```
TITLE:
[Backend] Define Prisma schema and run initial database migration

LABELS: backend

DESCRIPTION:
## Goal
Translate the schema design (Issue #S0-2) into Prisma and push it to Supabase.

## File to create: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
  @@map("verification_tokens")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime? @map("email_verified")
  image         String?
  createdAt     DateTime  @default(now()) @map("created_at")
  accounts Account[]
  sessions Session[]
  todos    Todo[]
  @@map("users")
}

model Todo {
  id          String     @id @default(cuid())
  userId      String     @map("user_id")
  title       String     @db.VarChar(200)
  description String?    @db.VarChar(500)
  status      TodoStatus @default(PENDING)
  priority    Priority   @default(MEDIUM)
  dueDate     DateTime?  @map("due_date")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@index([userId, status])
  @@index([userId, createdAt(sort: Desc)])
  @@map("todos")
}

enum TodoStatus { PENDING DONE }
enum Priority { LOW MEDIUM HIGH }
```

## Commands
```bash
npx prisma db push       # push schema to Supabase
npx prisma generate      # generate TypeScript client
npx prisma studio        # verify tables exist in browser UI
```

## Files to create
- [ ] `src/lib/db.ts` — Prisma singleton

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

## Acceptance Criteria
- `npx prisma studio` shows: users, todos, accounts, sessions, verification_tokens tables
- `src/lib/db.ts` exists with singleton pattern
- No TypeScript errors

## Branch
`feature/#3-prisma-schema`

## Sprint
Sprint 1
```

---

### Issue #4

```
TITLE:
[Auth] Configure GitHub OAuth App (development)

LABELS: auth, setup

DESCRIPTION:
## Goal
Register a GitHub OAuth app for local development login.

## Steps
1. GitHub.com → Settings (your profile) → Developer settings
2. OAuth Apps → New OAuth App

3. Fill in:
   ```
   Application name:         Todo App (Dev)
   Homepage URL:             http://localhost:3000
   Authorization callback URL: http://localhost:3000/api/auth/callback/github
   ```

4. Click "Register application"
5. Copy "Client ID" → add to `.env.local` as `GITHUB_CLIENT_ID`
6. Click "Generate a new client secret"
7. Copy secret → add to `.env.local` as `GITHUB_CLIENT_SECRET`

8. Generate NextAuth secret:
   ```bash
   openssl rand -base64 32
   ```
   Add to `.env.local` as `NEXTAUTH_SECRET`
   Add `NEXTAUTH_URL=http://localhost:3000`

## Acceptance Criteria
- `.env.local` has all 4 auth env vars set
- `.env.example` has all 4 keys (empty values)

## Branch
Add to `feature/#3-prisma-schema` or open `feature/#4-github-oauth`

## Sprint
Sprint 1
```

---

### Issue #5

```
TITLE:
[Auth] Implement NextAuth with GitHub provider and Prisma adapter

LABELS: auth, backend

DESCRIPTION:
## Goal
Wire up NextAuth so users can sign in with GitHub and sessions are stored in Postgres.

## Files to create

### `src/lib/auth.ts`
```typescript
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GithubProvider from 'next-auth/providers/github';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) session.user.id = token.id as string;
      return session;
    },
  },
  pages: { signIn: '/signin', error: '/signin' },
};
```

### `src/app/api/auth/[...nextauth]/route.ts`
```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### `src/types/index.ts`
```typescript
import { DefaultSession } from 'next-auth';
declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user'];
  }
}
export type { Todo, TodoStatus, Priority } from '@prisma/client';
```

## Acceptance Criteria
- [ ] Visit `http://localhost:3000/api/auth/signin` — GitHub button appears
- [ ] Click GitHub → authorise → redirected back to app
- [ ] `npx prisma studio` shows a new row in `users` table with your GitHub email
- [ ] `session.user.id` is defined (check with `console.log` in any server component)

## Branch
`feature/#5-nextauth`

## Sprint
Sprint 1
```

---

### Issue #6

```
TITLE:
[Backend] Add route protection middleware

LABELS: backend, auth

DESCRIPTION:
## Goal
Protect all dashboard routes and API routes so unauthenticated users are redirected.

## File to create: `src/middleware.ts`
```typescript
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/todos/:path*',
  ],
};
```

## File to create: `src/lib/api-helpers.ts`
```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error('UNAUTHORISED');
  return session;
}

export function withErrorHandler(handler: Function) {
  return async (req: Request, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORISED') {
        return errorResponse('Unauthorised', 401);
      }
      console.error(error);
      return errorResponse('Internal server error', 500);
    }
  };
}
```

## Acceptance Criteria
- [ ] Visiting `/dashboard` without being logged in → redirects to `/signin`
- [ ] `GET /api/todos` without session → returns `{ error: "Unauthorised" }` with 401
- [ ] Being logged in → dashboard loads normally

## Branch
`feature/#6-middleware`

## Sprint
Sprint 1
```

---

### Issue #7

```
TITLE:
[Frontend] Build custom sign-in page and home page redirect

LABELS: frontend

DESCRIPTION:
## Goal
Create a polished sign-in page and a home page that redirects authenticated users.

## Files to create

### `src/app/(auth)/signin/page.tsx`
A centered card with a "Continue with GitHub" button.
- Shows OAuth error messages if `?error=` param is present
- `callbackUrl` param sends users back to where they were trying to go

### `src/app/page.tsx`
- If `session` exists → `redirect('/dashboard')`
- If not → show landing hero with "Get Started" button linking to `/signin`

## Acceptance Criteria
- [ ] `/` with no session → shows landing page
- [ ] `/` with active session → redirects to `/dashboard` immediately
- [ ] `/signin` shows GitHub sign-in button
- [ ] Sign in via GitHub → redirected to `/dashboard`
- [ ] Sign in error → error message displayed on `/signin`

## Branch
`feature/#7-signin-page`

## Sprint
Sprint 1
```

---

## SPRINT 2 — Core CRUD & Frontend Issues

---

### Issue #8

```
TITLE:
[Backend] Define Zod validation schemas for todos

LABELS: backend

DESCRIPTION:
## Goal
Create Zod schemas that are the single source of truth for validation.
Used on both API routes (backend) and React Hook Form (frontend).

## File to create: `src/lib/validations.ts`
```typescript
import { z } from 'zod';

export const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().max(500).trim().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .optional()
    .nullable(),
});

export const updateTodoSchema = createTodoSchema
  .partial()
  .extend({ status: z.enum(['PENDING', 'DONE']).optional() });

export const todoIdSchema = z.object({
  id: z.string().cuid('Invalid todo ID'),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
```

## Why this matters
- One schema, two uses: backend validation + frontend form validation
- Never duplicate validation logic in separate places
- If you change a rule (max title length), it changes everywhere at once

## Acceptance Criteria
- [ ] `src/lib/validations.ts` exists
- [ ] Schemas export TypeScript types via `z.infer`
- [ ] No TypeScript errors

## Branch
`feature/#8-zod-schemas`

## Sprint
Sprint 2
```

---

### Issue #9

```
TITLE:
[Backend] Build GET and POST /api/todos route handlers

LABELS: backend

DESCRIPTION:
## Goal
Implement the two collection-level API routes.

## File: `src/app/api/todos/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { createTodoSchema } from '@/lib/validations';
import { requireAuth, successResponse, errorResponse, withErrorHandler } from '@/lib/api-helpers';

// GET /api/todos
export const GET = withErrorHandler(async () => {
  const session = await requireAuth();
  const todos = await db.todo.findMany({
    where: { userId: session.user.id },   // ← CRITICAL: always scope to user
    orderBy: { createdAt: 'desc' },
  });
  return successResponse({ data: todos, count: todos.length });
});

// POST /api/todos
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAuth();
  const body = await req.json();
  const result = createTodoSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(result.error.flatten().fieldErrors as any, 400);
  }
  const { title, description, priority, dueDate } = result.data;
  const todo = await db.todo.create({
    data: {
      title, description, priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: session.user.id,          // ← from server session, never client
    },
  });
  return successResponse(todo, 201);
});
```

## Security checklist for this issue
- [ ] `userId` comes from `session.user.id` — NEVER from the request body
- [ ] Zod validates before any DB call
- [ ] 401 returned if not authenticated (via `requireAuth()`)

## Test manually
```bash
# Test without auth (should get 401):
curl -X GET http://localhost:3000/api/todos

# Test with a real session: use browser DevTools → Network tab
# Sign in, then make a GET /api/todos call from the app
```

## Acceptance Criteria
- [ ] `GET /api/todos` without auth → 401
- [ ] `POST /api/todos` without auth → 401
- [ ] `POST /api/todos` with empty title → 400 with validation error
- [ ] `POST /api/todos` with valid data → 201 with todo object
- [ ] `GET /api/todos` returns only the current user's todos

## Branch
`feature/#9-todos-api-collection`

## Sprint
Sprint 2
```

---

### Issue #10

```
TITLE:
[Backend] Build PATCH and DELETE /api/todos/:id route handlers

LABELS: backend

DESCRIPTION:
## Goal
Implement the resource-level API routes with ownership verification.

## File: `src/app/api/todos/[id]/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { updateTodoSchema } from '@/lib/validations';
import { requireAuth, successResponse, errorResponse, withErrorHandler } from '@/lib/api-helpers';

// SECURITY: Returns 404 whether not found OR wrong owner
// Reason: never reveal that a resource exists to unauthorised users
async function getTodoOrFail(id: string, userId: string) {
  const todo = await db.todo.findFirst({ where: { id, userId } });
  if (!todo) throw Object.assign(new Error('NOT_FOUND'), { status: 404 });
  return todo;
}

// PATCH /api/todos/:id
export const PATCH = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const session = await requireAuth();
    await getTodoOrFail(params.id, session.user.id);
    const body = await req.json();
    const result = updateTodoSchema.safeParse(body);
    if (!result.success) return errorResponse('Validation failed', 400);
    const updated = await db.todo.update({
      where: { id: params.id },
      data: {
        ...result.data,
        dueDate: result.data.dueDate ? new Date(result.data.dueDate) : undefined,
      },
    });
    return successResponse(updated);
  }
);

// DELETE /api/todos/:id
export const DELETE = withErrorHandler(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const session = await requireAuth();
    await getTodoOrFail(params.id, session.user.id);
    await db.todo.delete({ where: { id: params.id } });
    return new Response(null, { status: 204 });
  }
);
```

## Acceptance Criteria
- [ ] `PATCH /api/todos/:id` with valid data → 200 with updated todo
- [ ] `PATCH /api/todos/:id` with another user's todo → 404
- [ ] `DELETE /api/todos/:id` → 204
- [ ] `DELETE /api/todos/:id` with another user's todo → 404

## Branch
`feature/#10-todos-api-resource`

## Sprint
Sprint 2
```

---

### Issue #11

```
TITLE:
[Frontend] Set up TanStack Query provider and custom todo hooks

LABELS: frontend

DESCRIPTION:
## Goal
Configure TanStack Query globally and create typed hooks for all API calls.

## Files to create/modify

### `src/app/layout.tsx` — wrap in providers
- SessionProvider (NextAuth)
- QueryClientProvider (TanStack Query)
- Toaster (shadcn)
- ReactQueryDevtools (dev only)

### `src/lib/query-client.ts`
```typescript
import { QueryClient } from '@tanstack/react-query';
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
    },
  });
}
```

### `src/hooks/use-todos.ts`
Implement these hooks:
- `useTodos()` — GET /api/todos
- `useCreateTodo()` — POST with optimistic update
- `useUpdateTodo()` — PATCH with cache invalidation
- `useDeleteTodo()` — DELETE with cache invalidation

Each mutation hook should:
- Show a toast on success
- Show an error toast on failure
- Invalidate the `['todos']` query key on success

## Install devtools
```bash
npm install @tanstack/react-query-devtools
```

## Acceptance Criteria
- [ ] TanStack Query DevTools visible in dev mode (bottom-right corner)
- [ ] `useTodos()` returns data / isLoading / error states
- [ ] Creating a todo updates the list without a full page reload

## Branch
`feature/#11-tanstack-query`

## Sprint
Sprint 2
```

---

### Issue #12

```
TITLE:
[Frontend] Build TodoForm component with React Hook Form + Zod validation

LABELS: frontend

DESCRIPTION:
## Goal
Create the form to add new todos, validated with the same Zod schema as the backend.

## File: `src/components/todos/todo-form.tsx`

Key implementation points:
- Use `useForm<CreateTodoInput>` with `zodResolver(createTodoSchema)`
- Use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- Fields: title (required), description (textarea, optional), priority (Select)
- On submit: call `useCreateTodo().mutate(values)`, reset form on success
- Disable all fields while `isPending` is true

## Why zodResolver matters
The same Zod schema from `src/lib/validations.ts` validates:
- Client-side: instantly as user types (React Hook Form)
- Server-side: before any DB call (API route)
You change the rules once, both sides update.

## Acceptance Criteria
- [ ] Submitting with empty title shows inline error "Title is required"
- [ ] Submitting with 201+ char title shows inline error
- [ ] Valid submit creates todo and resets form
- [ ] Form is disabled during submission (no double-submit)

## Branch
`feature/#12-todo-form`

## Sprint
Sprint 2
```

---

### Issue #13

```
TITLE:
[Frontend] Build TodoItem and TodoList components

LABELS: frontend

DESCRIPTION:
## Goal
Build the read/update/delete parts of the UI.

## Files to create

### `src/components/todos/todo-item.tsx`
- Checkbox toggles status between PENDING / DONE
- Completed todos get `line-through opacity-60` style
- Priority badge with colour coding (red/yellow/green)
- Optional due date display with `date-fns` formatting
- Delete button with `window.confirm` confirmation
- All actions use the hooks from Issue #11

### `src/components/todos/todo-list.tsx`
- Calls `useTodos()` and handles all three states:
  - **Loading**: show 4 `<Skeleton>` items (shadcn Skeleton)
  - **Error**: show error banner with message
  - **Empty**: show illustration + "Add a task above to get started" text
- Filter tabs: All / Pending / Done — client-side, instant
- Renders `<TodoItem>` for each filtered todo

## Acceptance Criteria
- [ ] Checking a todo updates it immediately (optimistic or fast mutation)
- [ ] Unchecking a done todo puts it back to pending
- [ ] Clicking delete → confirm dialog → todo disappears
- [ ] Filter tabs work without an API call
- [ ] Skeleton loads when data is fetching
- [ ] Empty state shows when no todos match the filter

## Branch
`feature/#13-todo-list`

## Sprint
Sprint 2
```

---

### Issue #14

```
TITLE:
[Frontend] Build dashboard page and header with sign-out

LABELS: frontend

DESCRIPTION:
## Goal
Assemble the full dashboard page and a sticky header with user menu.

## Files to create

### `src/components/layout/header.tsx`
- Sticky top bar with app name/logo
- Avatar dropdown (shadcn DropdownMenu) showing:
  - User name and email
  - Sign out button (calls `signOut({ callbackUrl: '/' })`)

### `src/app/(dashboard)/dashboard/page.tsx`
- Server component (no 'use client')
- `getServerSession(authOptions)` → redirect if no session
- Layout:
  - User greeting with Avatar at top
  - `<Card>` containing `<TodoForm>`
  - `<Card>` containing `<TodoList>`

### `src/app/(dashboard)/layout.tsx`
- Renders `<Header>` above `{children}`

## Acceptance Criteria
- [ ] Dashboard shows current user's name and avatar
- [ ] Header dropdown shows user info
- [ ] Sign out → redirected to home page
- [ ] Page metadata: `title: 'Dashboard — Todo App'`

## Branch
`feature/#14-dashboard-page`

## Sprint
Sprint 2
```

---

## SPRINT 3 — Polish & Deployment Issues

---

### Issue #15

```
TITLE:
[Polish] Add empty states, loading skeletons and error boundaries

LABELS: polish, frontend

DESCRIPTION:
## Goal
Handle every possible UI state. A professional app never shows a blank screen.

## States to handle
| State | Component | What to show |
|-------|-----------|-------------|
| Loading todos | TodoList | 4 skeleton cards |
| Empty (no todos) | TodoList | Icon + "No tasks yet" message |
| Empty (filter active) | TodoList | "No [status] tasks" |
| API error | TodoList | Error banner with retry button |
| Creating todo | TodoForm | Button shows "Adding..." + disabled |
| Deleting todo | TodoItem | Delete button shows spinner |
| Network offline | Any | Toast: "Check your connection" |

## Acceptance Criteria
- [ ] No component ever shows a blank/broken state
- [ ] Skeletons match the height/shape of real todo items
- [ ] Error states include actionable text (not just "Error")

## Branch
`feature/#15-ui-polish`

## Sprint
Sprint 3
```

---

### Issue #16

```
TITLE:
[Polish] Add toast notifications for all user actions

LABELS: polish, frontend

DESCRIPTION:
## Goal
Every mutation gives the user feedback. No silent actions.

## Toast messages to implement
| Action | Success toast | Error toast |
|--------|--------------|-------------|
| Create todo | "Task created" | "Failed to create task" |
| Complete todo | "Task completed" | "Failed to update task" |
| Uncomplete todo | "Task reopened" | "Failed to update task" |
| Delete todo | "Task deleted" | "Failed to delete task" |
| Sign out | — | — |

## Implementation
Toast is called in the `onSuccess` / `onError` callbacks of each
mutation hook in `src/hooks/use-todos.ts`.

Toaster component must be in `src/app/layout.tsx`.

## Acceptance Criteria
- [ ] Every create/update/delete action shows a toast
- [ ] Toasts auto-dismiss after 3-4 seconds
- [ ] Error toasts use destructive variant (red)
- [ ] Success toasts use default variant

## Branch
`feature/#15-ui-polish` (same branch as Issue #15 — same PR)

## Sprint
Sprint 3
```

---

### Issue #17

```
TITLE:
[DevOps] Set up GitHub Actions CI pipeline

LABELS: devops

DESCRIPTION:
## Goal
Every push and every PR automatically runs type checking and linting.
If either fails, the PR cannot be merged.

## File: `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Type Check & Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Generate Prisma client
        run: npx prisma generate
        env:
          DATABASE_URL: "postgresql://fake:fake@localhost:5432/fake"
          DIRECT_URL: "postgresql://fake:fake@localhost:5432/fake"
      - name: Type check
        run: npm run type-check
      - name: Lint
        run: npm run lint
      - name: Check formatting
        run: npx prettier --check .
```

## Why fake DATABASE_URL in CI?
Prisma generate only reads `schema.prisma` to generate TypeScript types.
It doesn't connect to a database. The env var is required by the schema
declaration but not actually used.

## Enable branch protection after CI is working:
Repository → Settings → Branches → Add rule
Branch name: `main`
✓ Require status checks to pass before merging
✓ Status checks: select "Type Check & Lint"

## Acceptance Criteria
- [ ] Push to any branch → Actions tab shows CI running
- [ ] CI passes (green) when code is correct
- [ ] CI fails (red) when there's a TypeScript error (test by adding one)
- [ ] Branch protection prevents merging failing PRs

## Branch
`feature/#17-github-actions`

## Sprint
Sprint 3
```

---

### Issue #18

```
TITLE:
[DevOps] Deploy to Vercel and configure production environment

LABELS: devops

DESCRIPTION:
## Goal
Deploy the production app on Vercel with environment-specific configuration.

## Steps

### 1. Import to Vercel
- vercel.com → Add New Project → Import GitHub repo
- Framework: Next.js (auto-detected)

### 2. Add all environment variables in Vercel
Settings → Environment Variables:
```
DATABASE_URL     = [Supabase connection string]
DIRECT_URL       = [same as DATABASE_URL]
NEXTAUTH_SECRET  = [same secret as .env.local]
NEXTAUTH_URL     = https://YOUR-APP.vercel.app
GITHUB_CLIENT_ID = [leave blank — fill in step 3]
GITHUB_CLIENT_SECRET = [leave blank — fill in step 3]
```

### 3. Create PRODUCTION GitHub OAuth App (separate from dev)
- GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
  ```
  Application name:         Todo App (Production)
  Homepage URL:             https://YOUR-APP.vercel.app
  Authorization callback:   https://YOUR-APP.vercel.app/api/auth/callback/github
  ```
- Copy new Client ID and Secret → update Vercel env vars
- Redeploy in Vercel dashboard

### 4. Run database migrations
Supabase already has the tables from `prisma db push` in Sprint 1.
No extra step needed — same database, just new environment variables pointing to it.

## Acceptance Criteria
- [ ] `https://YOUR-APP.vercel.app` loads without errors
- [ ] GitHub sign-in works in production
- [ ] Creating/completing/deleting todos works in production
- [ ] Sign out redirects to home page
- [ ] No environment variables are hardcoded in code

## Branch
`feature/#18-vercel-deploy`

## Sprint
Sprint 3
```

---

### Issue #19

```
TITLE:
[DevOps] Add PR description template

LABELS: devops, chore

DESCRIPTION:
## Goal
Every PR has a consistent description format so reviewing is faster.

## File to create: `.github/PULL_REQUEST_TEMPLATE.md`
```markdown
## What does this PR do?
<!-- 1-2 sentences describing the change -->

## Related Issue
Closes #[issue number]

## Type of change
- [ ] feat: new feature
- [ ] fix: bug fix
- [ ] refactor: code change that doesn't fix a bug or add a feature
- [ ] chore: dependency update, config change

## How to test
<!-- Steps to verify this works locally -->
1. 
2. 

## Checklist
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] Tested in browser (not just compiled)
- [ ] No console.log left in code
- [ ] No hardcoded secrets
```

## Acceptance Criteria
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` exists
- [ ] Next PR opened on GitHub auto-populates the description with this template

## Branch
`feature/#17-github-actions` (add to same PR)

## Sprint
Sprint 3
```

---

### Issue #20

```
TITLE:
[Chore] Final review: definition of done checklist

LABELS: chore

DESCRIPTION:
## Goal
Go through every item in the Definition of Done before calling this project complete.

## Functionality
- [ ] User can sign in with GitHub OAuth
- [ ] User is redirected to dashboard after sign in
- [ ] User can create a todo with title, optional description, priority
- [ ] Validation prevents empty title or title over 200 chars (frontend AND backend)
- [ ] User can mark a todo as complete
- [ ] User can unmark a completed todo
- [ ] User can delete a todo with confirmation
- [ ] User can filter todos by status
- [ ] Loading skeletons show while fetching
- [ ] Toast on create/delete success
- [ ] Empty state when no todos
- [ ] User can sign out

## Security
- [ ] Unauth users cannot access `/dashboard`
- [ ] Unauth requests to `/api/todos` return 401
- [ ] Every API route verifies session
- [ ] Every DB query filtered by `userId`
- [ ] PATCH/DELETE on another user's todo returns 404
- [ ] No secrets in code or browser DevTools
- [ ] Zod validation on every API route

## Code Quality
- [ ] `npm run type-check` exits 0
- [ ] `npm run lint` exits 0
- [ ] No `any` types without comment
- [ ] No `console.log` in production code

## DevOps
- [ ] GitHub Actions CI passes on every PR
- [ ] Production deployed on Vercel
- [ ] Env vars in Vercel (not hardcoded)
- [ ] Production GitHub OAuth app configured
- [ ] `.env.local` NOT committed
- [ ] `.env.example` IS committed

## Branch
No branch — this is a review issue, close it when all boxes are ticked.

## Sprint
Sprint 3
```

---

# Part 5 — Assign Issues to Sprints & Board

## After creating all issues:

```
1. Go to your Project board

2. For EACH issue, click on it and set:
   - Sprint: Sprint 0 / Sprint 1 / Sprint 2 / Sprint 3
   - Priority: High / Medium / Low
   - Status: To do

3. Issue → Sprint mapping summary:
   Sprint 0: #S0-1, #S0-2, #S0-3 (design/setup — mark as Done if already done)
   Sprint 1: #1, #2, #3, #4, #5, #6, #7
   Sprint 2: #8, #9, #10, #11, #12, #13, #14
   Sprint 3: #15, #16, #17, #18, #19, #20

4. Since you're starting Sprint 2 now:
   - Move Sprint 0 and Sprint 1 issues to Done (they're complete)
   - Sprint 2 issues should be in To do
   - Sprint 3 issues stay in To do (future)
```

---

# Part 6 — Git Workflow: Branches, Commits & PRs

## The Full Professional Workflow — Step by Step

### Step 1: Always start from an up-to-date main

```bash
git checkout main
git pull origin main
```

> Do this EVERY time before starting a new issue. Even if you were just on main.

---

### Step 2: Create a branch named after the issue

```bash
# Format: feature/#[issue-number]-[short-description]
git checkout -b feature/#9-todos-api-collection
```

**Branch naming rules:**
```
feature/#9-todos-api-collection   ← new feature (most common)
fix/#22-fix-auth-redirect         ← fixing a bug
chore/#19-pr-template             ← maintenance, no user-facing change
docs/#30-update-readme            ← documentation only
refactor/#25-extract-api-helpers  ← code change, no behaviour change
```

> **Why include the issue number?** GitHub automatically links the branch
> to the issue. In the repo's "Branches" view you see exactly which issue
> each branch belongs to.

---

### Step 3: Write code, then commit in small logical units

```bash
# Check what changed
git status
git diff

# Stage specific files (not git add . — be intentional)
git add src/app/api/todos/route.ts
git add src/lib/validations.ts

# Commit with a meaningful message
git commit -m "feat: add GET and POST handlers for /api/todos (#9)"
```

**Commit message format:**
```
type: short description (#issue-number)

Types:
  feat     → adds new functionality
  fix      → fixes a bug
  chore    → no user-facing change (deps, config)
  docs     → documentation only
  refactor → code restructure, same behaviour
  test     → adds or changes tests
  style    → formatting only (whitespace, quotes)

Examples:
  feat: add Zod schema for todo creation (#8)
  feat: add GET /api/todos with user scoping (#9)
  feat: add POST /api/todos with validation (#9)
  fix: return 404 instead of 403 for wrong-owner todos (#10)
  chore: install tanstack query devtools (#11)
  refactor: extract fetchJSON into shared util (#11)
```

> **Tip:** One commit per logical change. If you fixed two things, make two commits.
> Good commits tell the story of HOW you built something.

---

### Step 4: Push the branch to GitHub

```bash
git push origin feature/#9-todos-api-collection

# If it's the first push for this branch, Git may ask you to set upstream:
git push --set-upstream origin feature/#9-todos-api-collection
# Or shorthand:
git push -u origin feature/#9-todos-api-collection
```

---

### Step 5: Open a Pull Request on GitHub

```
1. Go to your repository on GitHub

2. You'll see a yellow banner: "feature/#9-todos-api-collection had recent pushes"
   Click "Compare & pull request"
   
   OR: go to Pull Requests → New pull request → select your branch

3. Fill in the PR:

   TITLE:
   feat: add GET and POST /api/todos (#9)

   DESCRIPTION (the template will auto-fill — complete it):
   ## What does this PR do?
   Adds the collection-level API routes for todos.
   GET returns all todos for the authenticated user.
   POST creates a new todo with Zod validation.

   ## Related Issue
   Closes #9

   ## How to test
   1. Sign in at localhost:3000
   2. Open browser DevTools → Network
   3. Navigate to /dashboard
   4. Verify GET /api/todos returns 200 with empty array
   5. Create a todo in the UI
   6. Verify POST /api/todos returns 201 with todo object

   ## Checklist
   - [x] `npm run type-check` passes
   - [x] `npm run lint` passes
   - [x] Tested in browser
   - [x] No console.log
   - [x] No hardcoded secrets

4. On the right sidebar:
   - Assignees: assign yourself
   - Labels: backend
   - Projects: link to your Project 1 board
   - Milestone: Sprint 2 (if you've set one up)

5. Click "Create pull request"
```

---

### Step 6: Review your own PR

```
This is the habit that makes you hireable.

1. In the PR, click "Files changed" tab
2. Read every line of diff
3. Ask yourself:
   - Is there any hardcoded value that should be an env var?
   - Is the userId always coming from the session, never the client?
   - Is there any unhandled error case?
   - Are there any console.logs?
   - Does the TypeScript cover everything (no any)?

4. If you find issues:
   - Don't close the PR
   - Fix locally, commit, push — the PR auto-updates:
     git add .
     git commit -m "fix: remove leftover console.log"
     git push

5. When satisfied, click "Merge pull request" → "Confirm merge"
```

> If CI is set up (Issue #17), GitHub will show a green or red status check.
> Never merge a red PR unless you have a very good reason (and document it).

---

### Step 7: Clean up after merge

```bash
# Back on your machine:
git checkout main
git pull origin main              # get the merged changes
git branch -d feature/#9-todos-api-collection  # delete local branch

# The remote branch is auto-deleted if you enabled:
# Repository → Settings → General → "Automatically delete head branches" ✓
```

---

## The "Closes" Keyword — Automatic Issue Closing

When you write `Closes #9` in your PR description, GitHub automatically:
- Links the PR to Issue #9
- Moves Issue #9 to "Done" in your Project board when the PR is merged
- Adds a reference in the issue timeline

```
Other keywords that work:
  Closes #9
  Fixes #9
  Resolves #9
```

---

## Moving Issues on the Board as You Work

```
When you start coding Issue #9:
  → Drag it from "To do" to "In Progress" on the board

When you open the PR:
  → Drag it from "In Progress" to "In Review"

When the PR is merged (Closes #9 in PR body):
  → GitHub auto-moves it to "Done" ✓
```

---

# Part 7 — Your Sprint 2 Starting Point

You said middleware is already done (Issue #6). Here's your current state:

## What's Done (Sprint 0 + Sprint 1)

```
✅ Sprint 0: Design issues (mark as Done)
✅ Sprint 1:
   ✅ #1  — Project init
   ✅ #2  — Supabase setup
   ✅ #3  — Prisma schema
   ✅ #4  — GitHub OAuth (dev)
   ✅ #5  — NextAuth setup
   ✅ #6  — Middleware (you said this is done)
   ✅ #7  — Sign-in page
```

## Sprint 2 — Your Next Steps In Order

```
Start here → Issue #8  → feature/#8-zod-schemas
Then       → Issue #9  → feature/#9-todos-api-collection
Then       → Issue #10 → feature/#10-todos-api-resource
Then       → Issue #11 → feature/#11-tanstack-query
Then       → Issue #12 → feature/#12-todo-form
Then       → Issue #13 → feature/#13-todo-list
Finish     → Issue #14 → feature/#14-dashboard-page
```

> **Tip:** Issues #9 and #10 (backend) can be done in one branch if you prefer:
> `feature/#9-#10-todos-api` — just reference both in the PR: `Closes #9, Closes #10`

---

## Exact Commands to Start Issue #8 Right Now

```bash
# Make sure you're on main and up to date
git checkout main
git pull origin main

# Create the branch
git checkout -b feature/#8-zod-schemas

# Create the file
mkdir -p src/lib
touch src/lib/validations.ts
# ... write the code from Issue #8 description ...

# Verify no type errors
npm run type-check

# Stage and commit
git add src/lib/validations.ts
git commit -m "feat: add Zod validation schemas for todo creation and update (#8)"

# Push
git push -u origin feature/#8-zod-schemas

# Open PR on GitHub → fill template → Closes #8 → Merge
```

---

# Part 8 — PR Template Setup

Create this file so every PR auto-fills:

```markdown
<!-- File: .github/PULL_REQUEST_TEMPLATE.md -->

## What does this PR do?
<!-- 1-2 sentences -->

## Related Issue
Closes #

## Type of change
- [ ] feat: new feature
- [ ] fix: bug fix
- [ ] refactor: code restructure, no behaviour change
- [ ] chore: dependency / config change
- [ ] docs: documentation only

## How to test locally
1. 
2. 
3. 

## Self-review checklist
- [ ] `npm run type-check` passes with 0 errors
- [ ] `npm run lint` passes with 0 warnings
- [ ] Tested manually in browser (not just compiled)
- [ ] No `console.log` left in code
- [ ] No secrets or env vars hardcoded
- [ ] userId always comes from session, never from request body
- [ ] Every new function has a clear name that explains what it does
```

---

## Quick Reference Card

```
START ISSUE:
  git checkout main && git pull origin main
  git checkout -b feature/#[N]-[short-name]

COMMIT:
  git add [files]
  git commit -m "feat: description (#[N])"

PUSH:
  git push -u origin feature/#[N]-[short-name]

OPEN PR:
  GitHub → Compare & pull request
  Title:  "feat: description (#N)"
  Body:   fill template → write "Closes #N"
  Review: Files changed tab → read every line

MERGE:
  CI green → Merge pull request

CLEANUP:
  git checkout main && git pull origin main
  git branch -d feature/#[N]-[short-name]

BOARD UPDATE:
  To do → In Progress (when branch created)
  In Progress → In Review (when PR opened)
  In Review → Done (auto when PR merged with "Closes #N")
```

---

*From here on: every piece of work is an issue. Every issue is a branch. Every branch is a PR. That's the loop.*
