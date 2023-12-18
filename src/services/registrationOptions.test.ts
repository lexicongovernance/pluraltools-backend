import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { saveUsersToRegistrationOptions } from './registrationOptions';

// Define a mock database pool
const mockDbPool: PostgresJsDatabase<any> = {
  users: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
  registrationOptions: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
  usersToRegistrationOptions: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
  // Add other mock tables as needed
} as any;

console.log = jest.fn();

describe('saveUsersToRegistrationOptions', () => {
  test('should throw an error if it tries to delete a non existing record', async () => {
    const userId = 'testUserId';
    const newRegistrationOptions = ['option1', 'option2'];

    const result = await saveUsersToRegistrationOptions(mockDbPool, userId, newRegistrationOptions);

    // Check if result is null
    expect(result).toBeNull();

    // Check that an error message is logged
    expect(console.log).toHaveBeenCalledWith('error deleting user registration options {}');
  });
});
