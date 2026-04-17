// src/lib/utils.ts
// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers shared across the entire codebase.
//
// WHY THIS FILE EXISTS:
// Shadcn/ui components need a `cn()` helper to merge Tailwind CSS class names
// intelligently. Without it, conditional classes would override each other in
// unpredictable ways (e.g. adding `bg-red-500` to a component that already has
// `bg-blue-500` wouldn't actually remove the blue).

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// cn(...inputs) — Class Name utility
//
// HOW IT WORKS:
// 1. clsx() — merges class names and handles conditional objects/arrays:
//      clsx('foo', false && 'bar', { baz: true }) → "foo baz"
// 2. twMerge() — resolves Tailwind conflicts, last one wins:
//      twMerge('bg-blue-500 bg-red-500') → "bg-red-500" (not both!)
//
// USAGE EXAMPLES:
//   cn('base-class', isActive && 'active-class')
//   cn('p-4', className)  ← lets callers override default padding
//   cn({ 'opacity-50': isDisabled, 'line-through': isDone })
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
