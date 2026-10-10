import { z } from 'zod';
import { categories, statuses, priorities, utcToday } from './taskValues.js';
const password = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'Use at most 72 bytes for your password.',
  );
export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.email().trim().toLowerCase().max(254),
    password,
  })
  .strict();
export const loginSchema = z
  .object({
    email: z.email().trim().toLowerCase().max(254),
    password: z
      .string()
      .min(1)
      .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password exceeds 72 bytes.'),
  })
  .strict();
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value &&
      value >= '1900-01-01' &&
      value <= '2199-12-31'
    );
  }, 'Choose a valid calendar date between 1900 and 2199.');
export const taskSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required.').max(160),
    description: z.string().trim().max(5000).default(''),
    status: z.enum(statuses).default('To Do'),
    priority: z.enum(priorities).default('Medium'),
    category: z.enum(categories).default('Personal'),
    dueDate: dateSchema,
  })
  .strict();
export const statusSchema = z.object({ status: z.enum(statuses) }).strict();
export const querySchema = z
  .object({
    search: z.string().trim().max(160).optional(),
    status: z.enum(statuses).optional(),
    priority: z.enum(priorities).optional(),
    category: z.enum(categories).optional(),
    sort: z.enum(['dueDate', '-dueDate', 'createdAt', '-createdAt']).default('-createdAt'),
    view: z.enum(['all', 'today', 'upcoming', 'overdue']).default('all'),
    today: dateSchema.default(utcToday),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
  })
  .strict();
export const statsQuerySchema = z.object({ today: dateSchema.default(utcToday) }).strict();
