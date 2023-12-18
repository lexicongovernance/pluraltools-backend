import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Mock implementation for the database pool
export const mockDbPool: PostgresJsDatabase<any> = {
  // Mock users table
  users: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    // Add other mock methods or properties as needed
  } as any,

  // Mock registrationOptions table
  registration_options: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    // Add other mock methods or properties as needed
  } as any,

  // Mock users_to_registration_options table
  users_to_registration_options: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    // Add other mock methods or properties as needed
  } as any,

  // Add other mock tables as needed
} as any;
