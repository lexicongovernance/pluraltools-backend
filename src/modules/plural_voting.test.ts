import {createGroupMemberships, commonGroup, K, clusterMatch } from './plural_voting';

// test create group memberships 
describe('createGroupMemberships', () => {
  test('creates group memberships correctly', () => {
    const groups = [[0, 1], [1, 2, 3], [0, 2]];

    const result = createGroupMemberships(groups);
    expect(result).toEqual([[0, 2], [0, 1], [1, 2], [1]]);
  });
});


// test common group
describe('commonGroup', () => {
  test('should return true if participants share a common group', () => {
    const groupMemberships: number[][] = [[0, 2], [0, 1], [1, 2], [1]];

    const result = commonGroup(0, 1, groupMemberships);
    expect(result).toBe(true);
  });

  test('should return false if participants do not share a common group', () => {
    const groupMemberships: number[][] = [[0, 2], [0, 1], [1, 2], [1]];

    const result = commonGroup(0, 3, groupMemberships);
    expect(result).toBe(false);
  });
});


// test vote attenuation 
describe('K function', () => {
  test('should not attenuate votes of i if i is not in group and does not have any relations with members of the group', () => {
    const i = 0;
    const group = [1];
    const groupMemberships = [[0], [1, 2]];
    const contributions = [4, 9, 16];

    const result = K(i, group, groupMemberships, contributions);
    expect(result).toEqual(4); 
  });

  test('should attenuate votes of i if i has a shared group membership with another member of the group even if i is not in the group', () => {
    const i = 0;
    const group = [1];
    const groupMemberships = [[0, 1], [1, 2]];
    const contributions = [4, 9, 16];

    const result = K(i, group, groupMemberships, contributions);
    expect(result).toEqual(2);
  });

  test('should attenuate votes of i solely because i is in the other group himself', () => {
    const i = 0;
    const group = [1];
    const groupMemberships = [[0], [0, 1, 2]];
    const contributions = [4, 9, 16];

    const result = K(i, group, groupMemberships, contributions);
    expect(result).toEqual(2);
  });

  test('should attenuate votes of i if both conditions above that lead to attenuation are satisfied', () => {
    const i = 0;
    const group = [1];
    const groupMemberships = [[0, 1], [0, 1, 2]];
    const contributions = [4, 9, 16];

    const result = K(i, group, groupMemberships, contributions);
    expect(result).toEqual(2);
  });
});


// Test connection oriented cluster match 
describe('clusterMatch', () => {
  test('calculates plurality score according to connection oriented cluster match', () => {
    const groups: number[][] = [[0], [1]];
    const contributions: number[] = [4, 4];

    // Expected result
    const expectedScore = 4;

    const result = clusterMatch(groups, contributions);
    expect(result).toEqual(expectedScore);
  });
});