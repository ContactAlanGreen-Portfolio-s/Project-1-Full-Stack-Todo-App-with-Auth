import 'dotenv/config'; // <-- This line forces it to read your .env file
import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});