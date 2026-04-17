# Project 1: Full Stack Todo App with Auth
## Complete Step-by-Step Build Guide

> **How to use this document:** Follow every step in order. Nothing is skipped.
> Every command, every file, every config is shown. When you see a ✅ checkbox,
> it means you can verify that step worked before moving on.

---

## Table of Contents

- [Phase 0 — Prerequisites & Environment](#phase-0--prerequisites--environment)
- [Phase 1 — System Design (Waterfall)](#phase-1--system-design-waterfall)
- [Sprint 1 — Infrastructure & Auth](#sprint-1--infrastructure--auth)
- [Sprint 2 — Core CRUD & Frontend](#sprint-2--core-crud--frontend)
- [Sprint 3 — Polish & Deployment](#sprint-3--polish--deployment)
- [Git Workflow Reference](#git-workflow-reference)
- [Common Errors & Fixes](#common-errors--fixes)
- [Checklist: Definition of Done](#checklist-definition-of-done)

---

# Phase 0 — Prerequisites & Environment

> **Missing from original plan.** You need these before writing a single line.

## 0.1 Tools to Install

```bash
# 1. Node.js (use nvm to manage versions — never install Node directly)
# On Mac/Linux:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc    # or ~/.zshrc
nvm install 20      # LTS version
nvm use 20
node --version      # should print v20.x.x

# On Windows: use nvm-windows
# https://github.com/coreybutler/nvm-windows/releases

# 2. Git
git --version       # should print 2.x.x or higher
# If not installed: https://git-scm.com/downloads

# 3. VS Code extensions to install (open VS Code, Ctrl+Shift+X)
# - ESLint (Microsoft)
# - Prettier - Code formatter
# - Tailwind CSS IntelliSense
# - Prisma (Prisma.io)
# - TypeScript Error Translator (mattpocock)
# - GitLens

# 4. Verify npm
npm --version       # should print 10.x.x
```

## 0.2 Accounts to Create

```
Before starting, create free accounts at:

1. GitHub          → github.com              (code hosting, CI/CD)
2. Supabase        → supabase.com            (free PostgreSQL database)
3. Vercel          → vercel.com              (deployment — connect via GitHub)

All three are completely free for this project.
```

## 0.3 VS Code Workspace Settings

```json
// Create .vscode/settings.json in your project root:
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

---

# Phase 1 — System Design (Waterfall)

> Do this BEFORE writing any code. This is the engineering discipline that
> separates junior developers who build ad hoc from those who think first.

## 1.1 Database Schema Design

Draw this out, understand every field, then we'll implement it.

```
┌──────────────────────────────────────────────────────────┐
│                        users                             │
├──────────────────┬───────────────┬───────────────────────┤
│  id              │ TEXT (CUID)   │ PRIMARY KEY            │
│  email           │ TEXT          │ UNIQUE NOT NULL        │
│  name            │ TEXT          │ NULLABLE               │
│  image           │ TEXT          │ NULLABLE (OAuth avatar)│
│  created_at      │ TIMESTAMP     │ DEFAULT NOW()          │
└──────────────────┴───────────────┴───────────────────────┘
         │
         │ 1 user → many todos
         │
┌──────────────────────────────────────────────────────────┐
│                        todos                             │
├──────────────────┬───────────────┬───────────────────────┤
│  id              │ TEXT (CUID)   │ PRIMARY KEY            │
│  user_id         │ TEXT          │ FOREIGN KEY → users.id │
│  title           │ TEXT          │ NOT NULL               │
│  description     │ TEXT          │ NULLABLE               │
│  status          │ ENUM          │ 'pending' | 'done'     │
│  priority        │ ENUM          │ 'low' | 'med' | 'high' │
│  due_date        │ TIMESTAMP     │ NULLABLE               │
│  created_at      │ TIMESTAMP     │ DEFAULT NOW()          │
│  updated_at      │ TIMESTAMP     │ AUTO-UPDATE            │
└──────────────────────────────────────────────────────────┘

NextAuth also needs 3 additional tables (sessions, accounts, verification_tokens).
Prisma adapter handles these automatically.

Why CUID over auto-increment integer IDs?
→ CUIDs are collision-resistant, sortable, and safe to expose in URLs.
→ Integer IDs expose row counts (user id=1 tells attackers you have few users).
```

## 1.2 API Contract Design

Define the contract BEFORE building. This is what frontend and backend agree on.

```
BASE URL:  /api

─────────────────────────────────────────────────────────────────
AUTH (handled by NextAuth — these routes are automatic)
─────────────────────────────────────────────────────────────────
GET  /api/auth/signin              → shows sign in page
GET  /api/auth/signout             → signs out
GET  /api/auth/session             → returns current session
GET  /api/auth/callback/github     → OAuth callback (auto-handled)

─────────────────────────────────────────────────────────────────
TODOS (you will build these)
─────────────────────────────────────────────────────────────────

GET /api/todos
  Auth:     Required (Bearer JWT or session cookie)
  Response: 200 OK
  Body:     {
              "data": [
                {
                  "id": "clx...",
                  "title": "Buy milk",
                  "description": null,
                  "status": "pending",
                  "priority": "medium",
                  "dueDate": null,
                  "createdAt": "2025-01-15T10:30:00Z"
                }
              ],
              "count": 1
            }

POST /api/todos
  Auth:     Required
  Body:     {
              "title": "Buy milk",           ← required, string, 1-200 chars
              "description": "Full fat",     ← optional, string, max 500 chars
              "priority": "medium",          ← optional, enum, default "medium"
              "dueDate": "2025-01-20"        ← optional, ISO date string
            }
  Response: 201 Created
  Body:     { "data": { ...todo object } }
  Errors:   400 if validation fails
            401 if not authenticated

PATCH /api/todos/:id
  Auth:     Required (must OWN the todo)
  Body:     Any subset of: { title, description, status, priority, dueDate }
  Response: 200 OK  → { "data": { ...updated todo } }
  Errors:   400 validation fail
            401 not authenticated
            403 todo belongs to someone else
            404 todo not found

DELETE /api/todos/:id
  Auth:     Required (must OWN the todo)
  Response: 204 No Content
  Errors:   401, 403, 404
─────────────────────────────────────────────────────────────────

KEY SECURITY RULE (Multi-tenant):
Every DB query that touches todos MUST include: WHERE user_id = session.user.id
Without this, User A can read/delete User B's todos.
This is called a "broken object level authorisation" bug (OWASP API Top 1).
```

## 1.3 Folder Structure (Plan Before Creating)

```
todo-app/
├── .github/
│   └── workflows/
│       └── ci.yml                  ← GitHub Actions CI
├── .vscode/
│   └── settings.json
├── prisma/
│   ├── schema.prisma               ← DB schema definition
│   └── seed.ts                     ← optional: seed data
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← root layout (HTML, fonts, providers)
│   │   ├── page.tsx                ← home/landing page → redirects to /dashboard
│   │   ├── (auth)/                 ← route group (doesn't affect URL)
│   │   │   └── signin/
│   │   │       └── page.tsx        ← custom sign-in page
│   │   ├── (dashboard)/            ← route group: all protected pages
│   │   │   ├── layout.tsx          ← dashboard layout (sidebar, header)
│   │   │   └── dashboard/
│   │   │       └── page.tsx        ← main todos page
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts    ← NextAuth handler
│   │       └── todos/
│   │           ├── route.ts        ← GET all, POST new
│   │           └── [id]/
│   │               └── route.ts    ← PATCH update, DELETE
│   ├── components/
│   │   ├── ui/                     ← shadcn components (auto-generated)
│   │   ├── todos/
│   │   │   ├── todo-list.tsx
│   │   │   ├── todo-item.tsx
│   │   │   ├── todo-form.tsx
│   │   │   └── todo-filters.tsx
│   │   └── layout/
│   │       ├── header.tsx
│   │       └── sidebar.tsx
│   ├── lib/
│   │   ├── auth.ts                 ← NextAuth config (exported as authOptions)
│   │   ├── db.ts                   ← Prisma client singleton
│   │   ├── validations.ts          ← Zod schemas
│   │   ├── api-helpers.ts          ← shared response helpers
│   │   └── query-client.ts         ← TanStack Query client config
│   ├── hooks/
│   │   └── use-todos.ts            ← TanStack Query hooks for todos
│   ├── types/
│   │   └── index.ts                ← shared TypeScript types
│   └── middleware.ts               ← route protection
├── .env.local                      ← secrets (NEVER commit)
├── .env.example                    ← template (commit this)
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

# Sprint 1 — Infrastructure & Auth

## Step 1: Initialise the Project

```bash
# Create Next.js app
npx create-next-app@latest todo-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd todo-app

# Verify it runs
npm run dev
# Open http://localhost:3000 — should see Next.js welcome page
```

✅ **Verify:** You see the Next.js default page at localhost:3000.

## Step 2: Install All Dependencies

```bash
# Install everything at once — understand what each does:

npm install \
  @prisma/client \           # Prisma runtime (talks to DB)
  @auth/prisma-adapter \     # connects NextAuth to Prisma
  next-auth \                # authentication
  @tanstack/react-query \    # server state management
  react-hook-form \          # form state
  @hookform/resolvers \      # connects react-hook-form to zod
  zod \                      # schema validation
  bcryptjs \                 # password hashing (if using credentials)
  date-fns \                 # date formatting
  clsx \                     # conditional classNames
  tailwind-merge             # merges Tailwind classes safely

npm install --save-dev \
  prisma \                   # Prisma CLI (migrations, generate)
  @types/bcryptjs \
  prettier \
  prettier-plugin-tailwindcss  # auto-sorts Tailwind classes
```

## Step 3: Install and Configure shadcn/ui

```bash
# Initialise shadcn
npx shadcn@latest init

# When prompted:
# Style: Default
# Base color: Slate
# CSS variables: Yes

# Install the components you'll use:
npx shadcn@latest add button card input label textarea badge \
  dialog dropdown-menu form separator skeleton toast \
  tooltip select checkbox
```

✅ **Verify:** `src/components/ui/` directory now exists with button.tsx, card.tsx, etc.

## Step 4: Set Up Prettier

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

```json
// Add to package.json scripts:
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit"
  }
}
```

## Step 5: Create Supabase Project

```
1. Go to supabase.com → Sign in → New Project

2. Fill in:
   - Project name: todo-app
   - Database password: generate a strong one → SAVE IT SOMEWHERE SAFE
   - Region: choose closest to you (e.g. eu-west-1 if in UK/Europe)

3. Wait ~2 minutes for provisioning

4. Go to: Settings → Database → Connection string → URI
   Copy the connection string, it looks like:
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres

5. Go to: Settings → API
   Copy the "Project URL" and "anon public" key (you may need these later)

IMPORTANT: Never share your database connection string publicly.
```

## Step 6: Configure Environment Variables

```bash
# Create .env.local (this file is gitignored — never commit it)
touch .env.local

# Create .env.example (this IS committed — template without secrets)
touch .env.example
```

```bash
# .env.local — fill in your actual values
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres"

# DIRECT_URL is needed for Prisma migrations with Supabase (connection pooling issue)
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres"

# NextAuth — generate a secret:
# Run in terminal: openssl rand -base64 32
NEXTAUTH_SECRET="paste-your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# GitHub OAuth (we'll fill these in Step 8)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

```bash
# .env.example — safe to commit, just the keys without values
DATABASE_URL=""
DIRECT_URL=""
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

```bash
# .gitignore — verify these are included (Next.js adds them, double-check)
.env
.env.local
.env.*.local
```

## Step 7: Set Up Prisma Schema

```bash
# Initialise Prisma
npx prisma init --datasource-provider postgresql

# This creates prisma/schema.prisma — replace its contents:
```

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   // needed for Supabase with connection pooling
}

// ── NextAuth required models ─────────────────────────────────────────

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

// ── Application models ────────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime? @map("email_verified")
  image         String?
  createdAt     DateTime  @default(now()) @map("created_at")

  // Relations
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

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Indexes — important for performance
  @@index([userId])                         // fast lookup of user's todos
  @@index([userId, status])                 // fast filtering by status
  @@index([userId, createdAt(sort: Desc)])  // fast sorting newest first

  @@map("todos")
}

enum TodoStatus {
  PENDING
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}
```

```bash
# Push schema to Supabase (creates the tables)
npx prisma db push

# Generate Prisma client (TypeScript types from your schema)
npx prisma generate
```

✅ **Verify:** Run `npx prisma studio` — it opens a browser GUI showing your tables.

## Step 8: Set Up GitHub OAuth App

```
1. GitHub.com → Settings → Developer settings → OAuth Apps → New OAuth App

2. Fill in:
   Application name:    Todo App (Dev)
   Homepage URL:        http://localhost:3000
   Authorization callback URL: http://localhost:3000/api/auth/callback/github

3. Click "Register application"

4. Copy "Client ID" → paste into .env.local as GITHUB_CLIENT_ID
5. Click "Generate a new client secret" → copy → paste as GITHUB_CLIENT_SECRET

NOTE: You'll create a SECOND OAuth app for production later (with Vercel URLs).
```

## Step 9: Create Prisma Client Singleton

```typescript
// src/lib/db.ts
// WHY: In development, Next.js hot-reload creates new Prisma instances
// each time. This singleton pattern prevents "too many connections" errors.

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

## Step 10: Configure NextAuth

```typescript
// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GithubProvider from 'next-auth/providers/github';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  // Adapter: tells NextAuth to store users/sessions in Prisma (your DB)
  adapter: PrismaAdapter(db),

  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    // You can add more providers later: Google, Magic Links, Credentials
  ],

  session: {
    strategy: 'jwt',   // store session in JWT cookie (stateless, scales well)
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    // WHY: The JWT callback adds user.id to the token.
    // By default, the token doesn't include the DB user id.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // WHY: The session callback exposes token.id to the client session.
    // Without this, session.user.id would be undefined on the frontend.
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/signin',       // custom sign-in page (we'll build this)
    error: '/signin',        // redirect auth errors to sign-in page
  },
};
```

```typescript
// src/app/api/auth/[...nextauth]/route.ts
// This single file handles ALL auth routes automatically
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

## Step 11: Extend TypeScript Types for NextAuth

```typescript
// src/types/index.ts
// WHY: By default, next-auth's Session type doesn't include user.id.
// This declaration merges our custom fields into the existing types.

import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

// Application-level types derived from Prisma
import { Todo, TodoStatus, Priority } from '@prisma/client';

export type { Todo, TodoStatus, Priority };

export type TodoWithoutUserId = Omit<Todo, 'userId'>;

export type CreateTodoInput = {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
};

export type UpdateTodoInput = Partial<CreateTodoInput> & {
  status?: TodoStatus;
};
```

## Step 12: Define Zod Validation Schemas

```typescript
// src/lib/validations.ts
// WHY: Zod schemas are the single source of truth for validation.
// Used on the backend (API routes) AND frontend (React Hook Form).
// Never duplicate validation logic.

import { z } from 'zod';
import { Priority } from '@prisma/client';

export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .trim()
    .optional(),
  priority: z.nativeEnum(Priority).default('MEDIUM'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .optional()
    .nullable(),
});

export const updateTodoSchema = createTodoSchema
  .partial()                         // all fields optional
  .extend({
    status: z.enum(['PENDING', 'DONE']).optional(),
  });

export const todoIdSchema = z.object({
  id: z.string().cuid('Invalid todo ID'),
});

// TypeScript types inferred from schemas
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
```

## Step 13: Create API Helper Utilities

```typescript
// src/lib/api-helpers.ts
// WHY: Avoid repeating response boilerplate in every route handler.

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Consistent success response
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

// Consistent error response
export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// Auth guard — use in every protected route
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('UNAUTHORISED');
  }
  return session;
}

// Wrap route handlers to catch errors centrally
export function withErrorHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'UNAUTHORISED') {
          return errorResponse('Unauthorised', 401);
        }
        console.error(`[API Error] ${error.message}`, error);
      }
      return errorResponse('Internal server error', 500);
    }
  };
}
```

## Step 14: Build the API Routes

```typescript
// src/app/api/todos/route.ts — GET all todos + POST new todo

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { createTodoSchema } from '@/lib/validations';
import { requireAuth, successResponse, errorResponse, withErrorHandler } from '@/lib/api-helpers';

// GET /api/todos — list all todos for the current user
export const GET = withErrorHandler(async () => {
  const session = await requireAuth();

  const todos = await db.todo.findMany({
    where: { userId: session.user.id },     // ← CRITICAL: only this user's todos
    orderBy: { createdAt: 'desc' },
  });

  return successResponse({ data: todos, count: todos.length });
});

// POST /api/todos — create a new todo
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAuth();
  const body = await req.json();

  // Server-side validation (never trust the client)
  const result = createTodoSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      result.error.flatten().fieldErrors as unknown as string,
      400
    );
  }

  const { title, description, priority, dueDate } = result.data;

  const todo = await db.todo.create({
    data: {
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: session.user.id,             // ← always from server session, never client
    },
  });

  return successResponse(todo, 201);
});
```

```typescript
// src/app/api/todos/[id]/route.ts — PATCH update + DELETE

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { updateTodoSchema } from '@/lib/validations';
import { requireAuth, successResponse, errorResponse, withErrorHandler } from '@/lib/api-helpers';

// Helper: verify the todo exists AND belongs to the current user
async function getTodoOrFail(id: string, userId: string) {
  const todo = await db.todo.findFirst({
    where: {
      id,
      userId,                              // ← CRITICAL: ownership check
    },
  });

  if (!todo) {
    // Return 404 whether it doesn't exist OR belongs to someone else
    // WHY: Don't reveal that the resource exists (security: enumeration attack)
    throw Object.assign(new Error('NOT_FOUND'), { status: 404 });
  }

  return todo;
}

// PATCH /api/todos/:id — update a todo
export const PATCH = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const session = await requireAuth();
    await getTodoOrFail(params.id, session.user.id);

    const body = await req.json();
    const result = updateTodoSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation failed', 400);
    }

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

// DELETE /api/todos/:id — delete a todo
export const DELETE = withErrorHandler(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const session = await requireAuth();
    await getTodoOrFail(params.id, session.user.id);

    await db.todo.delete({ where: { id: params.id } });

    return new Response(null, { status: 204 }); // 204 No Content
  }
);
```

## Step 15: Add Route Protection Middleware

```typescript
// src/middleware.ts
// WHY: This runs BEFORE page rendering. Unauthenticated users are
// redirected to /signin instantly, before any React code runs.
// Without this, protected pages would flash before redirecting.

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Token exists here (withAuth already checked)
    // You can add role checks here later
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,  // true = allow, false = redirect to signIn
    },
  }
);

// Which routes to protect — everything except public pages
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/todos/:path*',
    // Add more protected routes here
  ],
};
```

✅ **Verify Sprint 1:** Try visiting `localhost:3000/dashboard` — you should be redirected to `/signin`.

---

# Sprint 2 — Core CRUD & Frontend

## Step 16: Set Up TanStack Query

```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,              // 1 minute — don't refetch unnecessarily
        retry: 1,                          // retry failed requests once
        refetchOnWindowFocus: false,       // don't refetch when user tabs back
      },
    },
  });
}
```

```typescript
// src/app/layout.tsx — wrap app in providers
'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { makeQueryClient } from '@/lib/query-client';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // useState ensures we don't recreate the client on every render
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster />
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

```bash
# Install devtools
npm install @tanstack/react-query-devtools
```

## Step 17: Create Custom Hooks for API Calls

```typescript
// src/hooks/use-todos.ts
// WHY: Centralise all todo API calls in one place.
// Components import hooks, not fetch() calls directly.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import type { CreateTodoInput, UpdateTodoInput, Todo } from '@/types';

const TODOS_KEY = ['todos'] as const;

// Typed fetch helper
async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  if (res.status === 204) return null as T;
  const json = await res.json();
  return json.data;
}

// ─── Queries (read) ───────────────────────────────────────────────────────────

export function useTodos() {
  return useQuery({
    queryKey: TODOS_KEY,
    queryFn: () => fetchJSON<{ data: Todo[]; count: number }>('/api/todos'),
  });
}

// ─── Mutations (write) ────────────────────────────────────────────────────────

export function useCreateTodo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTodoInput) =>
      fetchJSON<Todo>('/api/todos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Optimistic update: show the todo immediately, before server confirms
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: TODOS_KEY });
      const previous = queryClient.getQueryData(TODOS_KEY);

      queryClient.setQueryData(TODOS_KEY, (old: any) => ({
        ...old,
        data: [{ id: 'temp-' + Date.now(), ...newTodo, status: 'PENDING', createdAt: new Date().toISOString() }, ...old.data],
      }));

      return { previous };
    },

    onError: (_err, _vars, context) => {
      // Rollback optimistic update on error
      queryClient.setQueryData(TODOS_KEY, context?.previous);
      toast({ title: 'Failed to create task', variant: 'destructive' });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_KEY }); // refetch real data
      toast({ title: 'Task created' });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTodoInput }) =>
      fetchJSON<Todo>(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },

    onError: () => {
      toast({ title: 'Failed to update task', variant: 'destructive' });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON<null>(`/api/todos/${id}`, { method: 'DELETE' }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_KEY });
      toast({ title: 'Task deleted' });
    },

    onError: () => {
      toast({ title: 'Failed to delete task', variant: 'destructive' });
    },
  });
}
```

## Step 18: Build the Todo Form Component

```typescript
// src/components/todos/todo-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTodoSchema, CreateTodoInput } from '@/lib/validations';
import { useCreateTodo } from '@/hooks/use-todos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function TodoForm() {
  const { mutate: createTodo, isPending } = useCreateTodo();

  const form = useForm<CreateTodoInput>({
    resolver: zodResolver(createTodoSchema),  // Zod validates automatically
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
    },
  });

  function onSubmit(values: CreateTodoInput) {
    createTodo(values, {
      onSuccess: () => form.reset(),  // clear form after success
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task title</FormLabel>
              <FormControl>
                <Input
                  placeholder="What needs to be done?"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage /> {/* shows validation errors automatically */}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add more details..."
                  rows={2}
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Adding...' : 'Add Task'}
        </Button>
      </form>
    </Form>
  );
}
```

## Step 19: Build the Todo List Components

```typescript
// src/components/todos/todo-item.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Trash2, Calendar } from 'lucide-react';
import { useUpdateTodo, useDeleteTodo } from '@/hooks/use-todos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Todo } from '@/types';

const PRIORITY_STYLES = {
  HIGH: 'bg-red-100 text-red-700 border-red-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
};

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const { mutate: updateTodo, isPending: isUpdating } = useUpdateTodo();
  const { mutate: deleteTodo, isPending: isDeleting } = useDeleteTodo();

  const isCompleted = todo.status === 'DONE';

  function handleToggle() {
    updateTodo({
      id: todo.id,
      data: { status: isCompleted ? 'PENDING' : 'DONE' },
    });
  }

  function handleDelete() {
    if (window.confirm('Delete this task?')) {
      deleteTodo(todo.id);
    }
  }

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-lg border p-4 transition-all',
      isCompleted && 'bg-muted/50 opacity-60'
    )}>
      {/* Checkbox */}
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
        className="mt-0.5"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium truncate',
          isCompleted && 'line-through text-muted-foreground'
        )}>
          {todo.title}
        </p>

        {todo.description && (
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
            {todo.description}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={cn('text-xs', PRIORITY_STYLES[todo.priority])}
          >
            {todo.priority.toLowerCase()}
          </Badge>

          {todo.dueDate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(todo.dueDate), 'MMM d, yyyy')}
            </span>
          )}
        </div>
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete task</span>
      </Button>
    </div>
  );
}
```

```typescript
// src/components/todos/todo-list.tsx
'use client';

import { useMemo, useState } from 'react';
import { useTodos } from '@/hooks/use-todos';
import { TodoItem } from './todo-item';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList } from 'lucide-react';
import type { TodoStatus, Priority } from '@/types';

type Filter = 'ALL' | TodoStatus;

export function TodoList() {
  const { data, isLoading, error } = useTodos();
  const [filter, setFilter] = useState<Filter>('ALL');

  const filteredTodos = useMemo(() => {
    if (!data?.data) return [];
    if (filter === 'ALL') return data.data;
    return data.data.filter(t => t.status === filter);
  }, [data, filter]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
        Failed to load tasks. Please refresh the page.
      </div>
    );
  }

  // Empty state
  if (filteredTodos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-semibold text-muted-foreground">No tasks yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add a task above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Filter tabs */}
      <div className="flex gap-2 border-b pb-3 mb-4">
        {(['ALL', 'PENDING', 'DONE'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1 text-sm rounded-md transition-colors',
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f === 'ALL' ? `All (${data?.count ?? 0})` : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Todo items */}
      {filteredTodos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}
```

## Step 20: Build the Dashboard Page

```typescript
// src/app/(dashboard)/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TodoForm } from '@/components/todos/todo-form';
import { TodoList } from '@/components/todos/todo-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// This is a SERVER component — it runs on the server
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Belt-and-suspenders auth check (middleware handles this, but explicit is safe)
  if (!session) redirect('/signin');

  return (
    <main className="container max-w-2xl mx-auto px-4 py-8">
      {/* User header */}
      <div className="flex items-center gap-3 mb-8">
        <Avatar>
          <AvatarImage src={session.user?.image ?? ''} alt={session.user?.name ?? ''} />
          <AvatarFallback>
            {session.user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">Welcome, {session.user?.name}</h1>
          <p className="text-sm text-muted-foreground">{session.user?.email}</p>
        </div>
      </div>

      {/* Add task card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add a task</CardTitle>
          <CardDescription>What do you need to get done?</CardDescription>
        </CardHeader>
        <CardContent>
          <TodoForm />
        </CardContent>
      </Card>

      {/* Task list */}
      <Card>
        <CardHeader>
          <CardTitle>Your tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <TodoList />
        </CardContent>
      </Card>
    </main>
  );
}

export const metadata = {
  title: 'Dashboard — Todo App',
};
```

## Step 21: Build the Sign-In Page

```typescript
// src/app/(auth)/signin/page.tsx
'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github } from 'lucide-react';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to access your tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error === 'OAuthAccountNotLinked'
                ? 'This email is already registered with a different provider.'
                : 'Authentication failed. Please try again.'}
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => signIn('github', { callbackUrl })}
          >
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
```

## Step 22: Home Page — Redirect Logic

```typescript
// src/app/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If already logged in, go straight to dashboard
  if (session) redirect('/dashboard');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold tracking-tight mb-3">
        Stay organised, ship faster.
      </h1>
      <p className="text-muted-foreground text-lg mb-8 max-w-md">
        A clean task manager for developers. Simple, fast, and yours.
      </p>
      <Button asChild size="lg">
        <Link href="/signin">Get started for free</Link>
      </Button>
    </main>
  );
}
```

✅ **Verify Sprint 2:** Full flow should work:
1. Visit `/` → redirected to `/dashboard` (if already signed in)
2. Visit `/` → click Get Started → GitHub OAuth → redirected to `/dashboard`
3. Create a todo → appears in list
4. Check/uncheck todo → status changes
5. Delete todo → removed from list

---

# Sprint 3 — Polish & Deployment

## Step 23: Add a Header with Sign Out

```typescript
// src/components/layout/header.tsx
'use client';

import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, CheckSquare } from 'lucide-react';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2 font-semibold">
          <CheckSquare className="h-5 w-5 text-primary" />
          <span>TodoApp</span>
        </div>

        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image ?? ''} />
                  <AvatarFallback>
                    {session.user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
```

## Step 24: Set Up GitHub Repository & Branching

```bash
# Initialise git (if not already done by create-next-app)
git init
git add .
git commit -m "chore: initial project setup"

# Create GitHub repo (via GitHub UI or GitHub CLI):
gh repo create todo-app --public --source=. --remote=origin --push
# OR: create on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/todo-app.git
git push -u origin main

# Set up branch protection (GitHub UI):
# Settings → Branches → Add rule
# Branch name pattern: main
# ✓ Require status checks to pass before merging
# ✓ Require branches to be up to date

# Work on features in branches — NEVER commit directly to main
git checkout -b feature/auth
# ... make changes ...
git add .
git commit -m "feat: add GitHub OAuth with NextAuth"
git push origin feature/auth
# Then create a Pull Request on GitHub
```

## Step 25: Set Up GitHub Actions CI

```yaml
# .github/workflows/ci.yml
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
          # WHY: We need DATABASE_URL to run prisma generate,
          # but CI doesn't need a real DB for type checking / linting.
          # Prisma generate just creates TypeScript types.

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Check formatting
        run: npx prettier --check .
```

✅ **Verify:** Push to GitHub → Actions tab → CI should pass (green checkmark).

## Step 26: Deploy to Vercel

```
DEPLOYMENT STEPS:

1. Go to vercel.com → Add New Project → Import your GitHub repo

2. Framework preset: Next.js (auto-detected)

3. Add Environment Variables (Settings → Environment Variables):
   Add ALL variables from your .env.local:
   - DATABASE_URL       (your Supabase connection string)
   - DIRECT_URL         (same as DATABASE_URL for Supabase)
   - NEXTAUTH_SECRET    (same secret as local)
   - NEXTAUTH_URL       → SET THIS TO: https://your-app.vercel.app
   - GITHUB_CLIENT_ID   (you'll update this in next step)
   - GITHUB_CLIENT_SECRET

4. Click Deploy → wait ~2 minutes

5. Note your Vercel URL: https://todo-app-xxx.vercel.app
```

## Step 27: Create Production GitHub OAuth App

```
You need a SEPARATE OAuth app for production (different redirect URL):

1. GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App

2. Fill in:
   Application name:    Todo App (Production)
   Homepage URL:        https://todo-app-xxx.vercel.app
   Authorization callback URL:
     https://todo-app-xxx.vercel.app/api/auth/callback/github

3. Copy the new Client ID and Client Secret

4. Go to Vercel → Settings → Environment Variables
   Update GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET with production values

5. Redeploy: Vercel → Deployments → ... → Redeploy
```

✅ **Verify Production:**
- Visit your Vercel URL
- Sign in with GitHub
- Create, complete, and delete todos
- Sign out and sign back in — todos persist

---

# Git Workflow Reference

> **This is how you work on every feature. Make it a habit.**

```bash
# Start new feature
git checkout main
git pull origin main                    # always start from latest main
git checkout -b feature/your-feature   # create feature branch

# Work... make changes... test locally...

git add -p                              # -p = interactive: review each change
git commit -m "feat: add todo filtering by status"
# Commit message format: type(scope): description
# Types: feat, fix, chore, docs, refactor, test, style
# Examples:
#   feat: add priority filter to todo list
#   fix: prevent todo creation with empty title
#   chore: update dependencies
#   refactor: extract todo helpers into separate module

git push origin feature/your-feature

# On GitHub: Create Pull Request → Review your own diff → Merge
# After merge:
git checkout main
git pull origin main
git branch -d feature/your-feature     # delete local branch
```

---

# Common Errors & Fixes

```
ERROR: "PrismaClientInitializationError: Can't reach database server"
FIX:   Check DATABASE_URL in .env.local. Verify Supabase project is not paused
       (free tier pauses after inactivity). Unpause in Supabase dashboard.

ERROR: "Cannot find module '@/components/ui/...'"
FIX:   Run: npx shadcn@latest add [component-name]
       OR: check tsconfig.json has "@/*": ["./src/*"]

ERROR: "[next-auth] Secret not found"
FIX:   NEXTAUTH_SECRET is not set. Run: openssl rand -base64 32
       Add to .env.local and Vercel env vars.

ERROR: "OAuthAccountNotLinked" on sign-in page
FIX:   The email used in OAuth is already in DB from a different provider.
       In dev: run npx prisma studio, delete the user row, try again.

ERROR: "Hydration mismatch"
FIX:   A component renders differently on server vs client.
       Common cause: using new Date() directly in render — use date-fns instead.
       Check for browser-only APIs (window, localStorage) in server components.

ERROR: Vercel build fails: "Environment variable not found: DATABASE_URL"
FIX:   Add missing env vars in Vercel Dashboard → Settings → Environment Variables.
       After adding, redeploy.

ERROR: Prisma generate fails in CI
FIX:   Add: npx prisma generate with a fake DATABASE_URL (see Step 25).
       Generate only needs the schema file, not a real DB connection.

ERROR: "Cannot access 'session' before initialization"
FIX:   You're using useSession() in a server component.
       Server components: use getServerSession(authOptions)
       Client components: use useSession()

PERFORMANCE: Todos page is slow on first load
FIX:   Add prefetching in layout.tsx using queryClient.prefetchQuery()
       OR: Make the page a server component and pass initial data as props.
```

---

# Checklist: Definition of Done

> Before calling this project complete, every item below should be ticked.

## Functionality

- [ ] User can sign in with GitHub OAuth
- [ ] User is redirected to dashboard after sign in
- [ ] User can create a todo with title, optional description, priority
- [ ] Validation prevents empty title or title over 200 chars (frontend AND backend)
- [ ] User can mark a todo as complete (checkbox)
- [ ] User can mark a completed todo as pending again
- [ ] User can delete a todo with a confirmation
- [ ] User can filter todos by status (all / pending / done)
- [ ] User sees loading skeletons while todos are fetching
- [ ] User sees a toast notification on create/delete success
- [ ] User sees an empty state when no todos exist
- [ ] User can sign out

## Security (Critical)

- [ ] Unauthenticated users cannot access `/dashboard` (middleware blocks them)
- [ ] Unauthenticated requests to `/api/todos` return 401
- [ ] Every API route verifies `session.user.id` exists
- [ ] Every DB query filters by `userId` (no cross-user data leaks)
- [ ] Attempting to PATCH/DELETE another user's todo returns 404 (not 403)
- [ ] No secrets are in committed code or visible in browser DevTools
- [ ] Zod validation runs on every API route (not just frontend)

## Code Quality

- [ ] TypeScript: `npm run type-check` exits with 0 errors
- [ ] Linting: `npm run lint` exits with 0 errors
- [ ] No `any` types (or if unavoidable, commented with reason)
- [ ] No `console.log` in production code (use structured logging or remove)
- [ ] Components are < 150 lines (split if larger)

## DevOps

- [ ] GitHub Actions CI passes on every PR (type-check + lint)
- [ ] Production deployment on Vercel works
- [ ] Environment variables are set in Vercel (not hardcoded)
- [ ] Production GitHub OAuth app points to Vercel URL
- [ ] `.env.local` is not committed (check `.gitignore`)
- [ ] `.env.example` IS committed as a template

## What This Project Demonstrates in Interviews

```
You can now say:

"I built a multi-tenant SaaS application with:
 - Next.js App Router with server and client components
 - JWT-based session auth via NextAuth with GitHub OAuth
 - PostgreSQL (Supabase) with Prisma ORM and migrations
 - Type-safe API routes with Zod validation on both client and server
 - Row-level security: every query scoped to the authenticated user
 - TanStack Query for server state with optimistic updates
 - React Hook Form with Zod resolver for validated forms
 - CI pipeline with GitHub Actions for type checking and linting
 - Deployed to Vercel with environment-specific OAuth apps"

This covers: auth, CRUD, multi-tenancy, type safety, validation,
API design, state management, CI/CD, and cloud deployment.
That's a full-stack interview win.
```

---

*Build it in order. Commit often. Ask for help when stuck, not after 3 hours.*
