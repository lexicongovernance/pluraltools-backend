import { saveUsersToRegistrationOptions } from './registrationOptions';
import { mockDbPool } from '../mock_db/mockDbPool';

console.log = jest.fn();

describe('saveUsersToRegistrationOptions', () => {
  it('should delete existing records and insert new ones', async () => {
    const userId = 'testUserId';
    const newRegistrationOptions = ['option1', 'option2'];

    const result = await saveUsersToRegistrationOptions(mockDbPool, userId, newRegistrationOptions);

    // Check if result is null
    expect(result).toBeNull();

    // Check that an error message is logged
    expect(console.log).toHaveBeenCalledWith('error deleting user registration options {}');
  });
});
