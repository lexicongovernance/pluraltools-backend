import { z } from 'zod';
import { insertUserSchema } from '../types/users';

describe('service: users', function () {
  describe('schema: insertUserSchema', function () {
    it('should remove empty strings from user data', function () {
      const user: z.infer<typeof insertUserSchema> = {
        email: '',
        username: '',
        firstName: '',
        lastName: '',
        telegram: '',
      };

      const transformedUser: { [key: string]: string | null | string[] | object } =
        insertUserSchema.parse(user);

      // loop through all keys and check if they are not empty strings

      for (const key of Object.keys(transformedUser)) {
        console.log(key);
        expect(transformedUser[key]).not.toBe('');
      }
    });
  });
});
