import { z } from 'zod';
import { dataSchema, fieldsSchema } from '../types';
import { enforceRules } from './validation';

describe('service: validation', function () {
  describe('rule: required', function () {
    test('should return an error if a required field is missing', function () {
      const fields: z.infer<typeof fieldsSchema> = [
        {
          id: 'name',
          name: 'Name',
          position: 1,
          type: 'TEXT',
          validation: {
            required: true,
          },
        },
      ];
      const data: z.infer<typeof dataSchema> = {};

      const result = enforceRules({ data, fields });

      expect(result.length).toBe(1);
      expect(result).toEqual(['Name is required']);
    });

    test('should not return an error if a required field is present', function () {
      const fields: z.infer<typeof fieldsSchema> = [
        {
          id: 'name',
          name: 'Name',
          position: 1,
          type: 'TEXT',
          validation: {
            required: true,
          },
        },
      ];
      const data: z.infer<typeof dataSchema> = {
        name: {
          value: 'John Doe',
          fieldId: 'name',
        },
      };

      const result = enforceRules({ data, fields });

      expect(result.length).toBe(0);
    });
  });

  describe('officer: string', function () {
    describe('rule: minLength', function () {
      test('should return an error if the string is too short', function () {
        const fields: z.infer<typeof fieldsSchema> = [
          {
            id: 'name',
            name: 'Name',
            position: 1,
            type: 'TEXT',
            validation: {
              required: true,
              minLength: 5,
            },
          },
        ];
        const data: z.infer<typeof dataSchema> = {
          name: {
            value: 'John',
            fieldId: 'name',
          },
        };

        const result = enforceRules({ data, fields });

        expect(result.length).toBe(1);
        expect(result).toEqual(['Name must be at least 5 characters']);
      });

      test('should not return an error if the string is long enough', function () {
        const fields: z.infer<typeof fieldsSchema> = [
          {
            id: 'name',
            name: 'Name',
            position: 1,
            type: 'TEXT',
            validation: {
              required: true,
              minLength: 5,
            },
          },
        ];
        const data: z.infer<typeof dataSchema> = {
          name: {
            value: 'John Doe',
            fieldId: 'name',
          },
        };

        const result = enforceRules({ data, fields });

        expect(result.length).toBe(0);
      });
    });
    describe('rule: maxLength', function () {
      test('should return an error if the string is too long', function () {
        const fields: z.infer<typeof fieldsSchema> = [
          {
            id: 'name',
            name: 'Name',
            position: 1,
            type: 'TEXT',
            validation: {
              required: true,
              maxLength: 5,
            },
          },
        ];
        const data: z.infer<typeof dataSchema> = {
          name: {
            value: 'John Doe',
            fieldId: 'name',
          },
        };

        const result = enforceRules({ data, fields });

        expect(result.length).toBe(1);
        expect(result).toEqual(['Name must be at most 5 characters']);
      });

      test('should not return an error if the string is short enough', function () {
        const fields: z.infer<typeof fieldsSchema> = [
          {
            id: 'name',
            name: 'Name',
            position: 1,
            type: 'TEXT',
            validation: {
              required: true,
              maxLength: 5,
            },
          },
        ];
        const data: z.infer<typeof dataSchema> = {
          name: {
            value: 'John',
            fieldId: 'name',
          },
        };

        const result = enforceRules({ data, fields });

        expect(result.length).toBe(0);
      });
    });
  });

  describe('officer: number', function () {
    describe('rule: minLength', function () {
      test('should return an error if the number is too small', function () {
        const fields: z.infer<typeof fieldsSchema> = [
          {
            id: 'age',
            name: 'Age',
            position: 1,
            type: 'NUMBER',
            validation: {
              required: true,
              minLength: 18,
            },
          },
        ];
        const data: z.infer<typeof dataSchema> = {
          age: {
            value: 17,
            fieldId: 'age',
          },
        };

        const result = enforceRules({ data, fields });

        expect(result.length).toBe(1);
        expect(result).toEqual(['Age must be at least 18']);
      });

      test('should not return an error if the number is large enough', function () {
        const fields: z.infer<typeof fieldsSchema> = [
          {
            id: 'age',
            name: 'Age',
            position: 1,
            type: 'NUMBER',
            validation: {
              required: true,
              minLength: 18,
            },
          },
        ];
        const data: z.infer<typeof dataSchema> = {
          age: {
            value: 18,
            fieldId: 'age',
          },
        };

        const result = enforceRules({ data, fields });

        expect(result.length).toBe(0);
      });
    });
    describe('rule: maxLength', function () {
      test('should return an error if the number is too large', function () {
        const fields: z.infer<typeof fieldsSchema> = [
          {
            id: 'age',
            name: 'Age',
            position: 1,
            type: 'NUMBER',
            validation: {
              required: true,
              maxLength: 18,
            },
          },
        ];
        const data: z.infer<typeof dataSchema> = {
          age: {
            value: 19,
            fieldId: 'age',
          },
        };

        const result = enforceRules({ data, fields });

        expect(result.length).toBe(1);
        expect(result).toEqual(['Age must be at most 18']);
      });
      test('should not return an error if the number is small enough', function () {
        const fields: z.infer<typeof fieldsSchema> = [
          {
            id: 'age',
            name: 'Age',
            position: 1,
            type: 'NUMBER',
            validation: {
              required: true,
              maxLength: 18,
            },
          },
        ];
        const data: z.infer<typeof dataSchema> = {
          age: {
            value: 18,
            fieldId: 'age',
          },
        };

        const result = enforceRules({ data, fields });

        expect(result.length).toBe(0);
      });
    });
  });

  describe('officer: array', function () {
    describe('rule: minLength', function () {
      test('should return an error if the array is too small', function () {
        const fields: z.infer<typeof fieldsSchema> = [
          {
            id: 'colors',
            name: 'Colors',
            position: 1,
            type: 'MULTI_SELECT',
            validation: {
              required: true,
              minLength: 2,
            },
          },
        ];
        const data: z.infer<typeof dataSchema> = {
          colors: {
            value: ['red'],
            fieldId: 'colors',
          },
        };

        const result = enforceRules({ data, fields });

        expect(result.length).toBe(1);
        expect(result).toEqual(['Colors must have at least 2 items']);
      });
      test('should not return an error if the array is large enough', function () {
        const fields: z.infer<typeof fieldsSchema> = [
          {
            id: 'colors',
            name: 'Colors',
            position: 1,
            type: 'MULTI_SELECT',
            validation: {
              required: true,
              minLength: 2,
            },
          },
        ];
        const data: z.infer<typeof dataSchema> = {
          colors: {
            value: ['red', 'blue'],
            fieldId: 'colors',
          },
        };

        const result = enforceRules({ data, fields });

        expect(result.length).toBe(0);
      });
    });
    describe('rule: maxLength', function () {
      test('should return an error if the array is too large', function () {
        const fields: z.infer<typeof fieldsSchema> = [
          {
            id: 'colors',
            name: 'Colors',
            position: 1,
            type: 'MULTI_SELECT',
            validation: {
              required: true,
              maxLength: 2,
            },
          },
        ];
        const data: z.infer<typeof dataSchema> = {
          colors: {
            value: ['red', 'blue', 'green'],
            fieldId: 'colors',
          },
        };

        const result = enforceRules({ data, fields });

        expect(result.length).toBe(1);
        expect(result).toEqual(['Colors must have at most 2 items']);
      });
      test('should not return an error if the array is small enough', function () {
        const fields: z.infer<typeof fieldsSchema> = [
          {
            id: 'colors',
            name: 'Colors',
            position: 1,
            type: 'MULTI_SELECT',
            validation: {
              required: true,
              maxLength: 2,
            },
          },
        ];
        const data: z.infer<typeof dataSchema> = {
          colors: {
            value: ['red', 'blue'],
            fieldId: 'colors',
          },
        };

        const result = enforceRules({ data, fields });

        expect(result.length).toBe(0);
      });
    });
  });
});
